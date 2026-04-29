"""Vertex Gemini provider.

Wraps `google-genai` (the unified Gemini SDK) configured with `vertexai=True`
and the project + location from settings. Returns the model's text payload
so the gateway can JSON-validate it like any other provider response.

Retry policy follows LLM_MAX_RETRIES + LLM_INITIAL_BACKOFF:
  - Transient (429, 503, network) → exponential backoff retry
  - Permanent (400, 403, 404, 401) → fail fast (gateway will raise ProviderError)

Schema enforcement uses Vertex's `response_mime_type="application/json"` +
`response_schema=...` so the model returns valid JSON in nearly all cases;
the gateway still validates and retries once if it doesn't.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from app.ai.types import AICallMetrics, ProviderError, ProviderResponse
from app.config import get_settings

logger = logging.getLogger(__name__)


_PERMANENT_STATUSES = {400, 401, 403, 404}


def _status_from_exc(exc: Exception) -> int | None:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if isinstance(code, int):
        return code
    msg = str(exc)
    for s in (400, 401, 403, 404, 429, 500, 502, 503, 504):
        if f" {s} " in f" {msg} ":
            return s
    return None


class VertexGeminiProvider:
    name = "vertex_gemini"

    def __init__(self) -> None:
        s = get_settings()
        if not s.gcp_credentials:
            raise RuntimeError(
                "VertexGeminiProvider requires GCP_SERVICE_ACCOUNT_JSON_B64 to be set."
            )
        # Lazy-import so test envs without the SDK still load this module.
        from google import genai
        from google.oauth2 import service_account

        creds = service_account.Credentials.from_service_account_info(
            s.gcp_credentials,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        self._client = genai.Client(
            vertexai=True,
            project=s.gcp_project,
            location=s.gcp_location,
            credentials=creds,
        )
        self._max_retries = s.llm_max_retries
        self._initial_backoff = s.llm_initial_backoff
        self._timeout_s = s.llm_request_timeout_s

    async def generate_json(
        self,
        *,
        system: str,
        user: str,
        json_schema: dict[str, Any],
        model: str,
        request_id: str,
        retry_feedback: str | None = None,
    ) -> ProviderResponse:
        from google.genai import types as gtypes

        user_text = user if not retry_feedback else f"{user}\n\n[Validator]: {retry_feedback}"
        contents = [gtypes.Content(role="user", parts=[gtypes.Part.from_text(text=user_text)])]
        config = gtypes.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=_strip_unsupported(json_schema),
            temperature=0.2,
            top_p=0.95,
            candidate_count=1,
        )

        attempt = 0
        backoff = self._initial_backoff
        started = time.perf_counter()
        last_exc: Exception | None = None

        while True:
            attempt += 1
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self._client.models.generate_content,
                        model=model,
                        contents=contents,
                        config=config,
                    ),
                    timeout=self._timeout_s,
                )
                raw = (response.text or "").strip()
                if not raw:
                    raise ProviderError("Vertex returned an empty response body.")

                usage = getattr(response, "usage_metadata", None)
                tokens_in = getattr(usage, "prompt_token_count", None) if usage else None
                tokens_out = getattr(usage, "candidates_token_count", None) if usage else None

                metrics = AICallMetrics(
                    model=model,
                    prompt_version=None,
                    tokens_in=tokens_in,
                    tokens_out=tokens_out,
                    latency_ms=int((time.perf_counter() - started) * 1000),
                    request_id=request_id,
                    success=True,
                    metadata={"provider": self.name, "attempts": attempt},
                )
                return ProviderResponse(raw_text=raw, metrics=metrics)

            except Exception as e:  # noqa: BLE001
                last_exc = e
                status = _status_from_exc(e)
                permanent = status in _PERMANENT_STATUSES
                exhausted = attempt > self._max_retries
                logger.warning(
                    "vertex call failed",
                    extra={
                        "request_id": request_id,
                        "model": model,
                        "attempt": attempt,
                        "status": status,
                        "permanent": permanent,
                        "error": str(e),
                    },
                )
                if permanent or exhausted:
                    raise ProviderError(f"Vertex call failed: {e}") from e
                await asyncio.sleep(backoff)
                backoff *= 2

        # unreachable; mypy comfort
        raise ProviderError(f"Vertex call failed: {last_exc}")


def _strip_unsupported(schema: dict[str, Any]) -> dict[str, Any]:
    """Make a Pydantic-emitted JSON Schema acceptable to Vertex `response_schema`.

    Three transformations, in order:

      1. **Inline `$ref` against `$defs`/`definitions`** so the result is
         self-contained. Vertex ignores `$defs` and won't follow refs;
         leaving the refs in place (or stripping `$defs` only) was the root
         cause of the `INVALID_ARGUMENT: required fields ['title'] are not
         defined in the schema properties` error we saw.

      2. **Strip metadata-only keys** (`title`, `default`, `$schema`,
         `additionalProperties`, `definitions`, `$defs`, `examples`, etc.)
         **but only at metadata positions** — never inside a `properties`
         object, where the keys are real field names. (`StrengthOrBlocker`
         and `RecommendedJobPath` both have a literal `title` field.)

      3. **Normalise `anyOf` for nullable fields**: Pydantic emits
         `anyOf: [{...}, {"type": "null"}]` for `Optional[X]`. Vertex
         accepts a `nullable: true` flag plus the non-null branch instead
         of a fully general `anyOf`, and is friendlier to the former.
    """
    if not isinstance(schema, dict):
        return schema  # type: ignore[return-value]

    defs = schema.get("$defs") or schema.get("definitions") or {}
    inlined = _inline_refs(schema, defs)
    cleaned = _clean(inlined)
    return cleaned


# ---- helpers ---------------------------------------------------------------


_METADATA_KEYS_TO_DROP = {
    # Schema metadata Vertex doesn't accept
    "title",
    "default",
    "$schema",
    "$id",
    "additionalProperties",
    "definitions",
    "$defs",
    "examples",
    "$comment",
    "readOnly",
    "writeOnly",
    "discriminator",
    # Value constraints that compile into Vertex's response-schema FSM and
    # blow past the "too many states for serving" limit on complex schemas
    # (visa / family / documents / workflow / synthesis). Pydantic re-validates
    # the model output in the gateway after the call returns, so dropping
    # these here doesn't relax our actual contract — it just stops Vertex
    # from refusing the request before generation.
    "pattern",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "format",
}


def _inline_refs(node: Any, defs: dict[str, Any], _seen: tuple[str, ...] = ()) -> Any:
    """Replace every `{"$ref": "#/$defs/Foo"}` with the inlined `defs["Foo"]`.

    Cycles are short-circuited (replaced with `{}`) — none of our analysis
    schemas are cyclic, but we guard regardless.
    """
    if isinstance(node, dict):
        if "$ref" in node and isinstance(node["$ref"], str):
            ref = node["$ref"]
            # Support "#/$defs/Foo" and "#/definitions/Foo"
            if ref.startswith("#/$defs/"):
                key = ref[len("#/$defs/"):]
            elif ref.startswith("#/definitions/"):
                key = ref[len("#/definitions/"):]
            else:
                # Unknown ref form — leave it alone; Vertex will complain loudly.
                return {k: _inline_refs(v, defs, _seen) for k, v in node.items()}
            if key in _seen:
                return {}  # cycle
            target = defs.get(key)
            if target is None:
                return {}  # dangling ref
            inlined_target = _inline_refs(target, defs, _seen + (key,))
            # Merge any sibling keys (e.g. `description`) onto the inlined object.
            if len(node) == 1:
                return inlined_target
            merged = dict(inlined_target) if isinstance(inlined_target, dict) else {}
            for k, v in node.items():
                if k == "$ref":
                    continue
                merged[k] = _inline_refs(v, defs, _seen)
            return merged
        return {k: _inline_refs(v, defs, _seen) for k, v in node.items()}
    if isinstance(node, list):
        return [_inline_refs(x, defs, _seen) for x in node]
    return node


def _clean(node: Any) -> Any:
    """Drop metadata keys + normalise `anyOf` nullables — structure-aware.

    `properties` and `$defs` value dicts are *carriers of named children*; we
    must NOT drop their keys (those are field names like `title`). Anywhere
    else, we drop the metadata keys.
    """
    if isinstance(node, dict):
        # Normalise anyOf nullables BEFORE recursing.
        node = _normalise_nullable_anyof(node)

        out: dict[str, Any] = {}
        for k, v in node.items():
            if k in _METADATA_KEYS_TO_DROP:
                continue
            if k == "properties" and isinstance(v, dict):
                # Preserve property keys verbatim; clean each value subtree.
                out[k] = {pk: _clean(pv) for pk, pv in v.items()}
            else:
                out[k] = _clean(v)
        return out
    if isinstance(node, list):
        return [_clean(x) for x in node]
    return node


def _normalise_nullable_anyof(node: dict[str, Any]) -> dict[str, Any]:
    """`anyOf: [X, {type:null}]` → X with `nullable: true`.

    Leaves more general `anyOf` shapes alone — Vertex accepts those.
    """
    any_of = node.get("anyOf")
    if not isinstance(any_of, list) or len(any_of) != 2:
        return node
    null_idx = next(
        (i for i, opt in enumerate(any_of)
         if isinstance(opt, dict) and opt.get("type") == "null"),
        None,
    )
    if null_idx is None:
        return node
    other = any_of[1 - null_idx]
    if not isinstance(other, dict):
        return node
    merged = {k: v for k, v in node.items() if k != "anyOf"}
    for k, v in other.items():
        merged.setdefault(k, v)
    merged["nullable"] = True
    return merged
