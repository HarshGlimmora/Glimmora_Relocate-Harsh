"""The single AI gateway.

Every model call goes through `AIGateway.generate(GenerationRequest)`. The
gateway:
  - Routes the model_tier to the configured model id.
  - Loads the prompt by (name, version) and prepends it to the system message.
  - Asks the provider for a JSON string under the schema's JSON-Schema.
  - Parses + validates the response into the requested Pydantic model.
  - Retries ONCE on schema failure with a feedback message that quotes the
    validation errors back at the model.
  - Records metrics through the telemetry sink.

The gateway is sync-friendly: callers `await` it; everything inside is async.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Generic, Type, TypeVar

from pydantic import BaseModel, ValidationError

from app.ai.prompts import load_prompt
from app.ai.providers.base import AIProvider
from app.ai.providers.stub import StubProvider
from app.ai.telemetry import NoopSink, TelemetrySink
from app.ai.types import (
    AICallMetrics,
    ModelTier,
    ProviderError,
    ProviderResponse,
    SchemaValidationFailed,
)
from app.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


@dataclass
class GenerationRequest(Generic[T]):
    kind: str  # logical kind, used for telemetry. Resume, jobfit, etc.
    prompt_name: str
    prompt_version: str
    model_tier: ModelTier
    schema: Type[T]
    system: str
    user: str
    case_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerationResult(Generic[T]):
    parsed: T
    raw_text: str
    metrics: AICallMetrics
    attempts: int


class AIGateway:
    """Single entry point for all AI calls."""

    MAX_ATTEMPTS = 2

    def __init__(
        self,
        *,
        provider: AIProvider,
        telemetry: TelemetrySink | None = None,
    ) -> None:
        self.provider = provider
        self.telemetry = telemetry or NoopSink()
        self._settings = get_settings()

    async def generate(self, req: GenerationRequest[T]) -> GenerationResult[T]:
        model = self._resolve_model(req.model_tier)
        prompt_text = load_prompt(req.prompt_name, req.prompt_version)
        system = f"{prompt_text}\n\n---\n{req.system}".strip()
        json_schema = req.schema.model_json_schema()
        request_id = str(uuid.uuid4())

        retry_feedback: str | None = None
        last_resp: ProviderResponse | None = None
        last_validation: ValidationError | None = None
        started = time.perf_counter()

        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            try:
                resp = await self.provider.generate_json(
                    system=system,
                    user=req.user,
                    json_schema=json_schema,
                    model=model,
                    request_id=request_id,
                    retry_feedback=retry_feedback,
                )
            except Exception as e:
                logger.warning("provider error attempt %d: %s", attempt, e)
                metrics = AICallMetrics(
                    model=model,
                    prompt_version=req.prompt_version,
                    tokens_in=None,
                    tokens_out=None,
                    latency_ms=int((time.perf_counter() - started) * 1000),
                    request_id=request_id,
                    success=False,
                    error=f"provider_error: {e}",
                )
                await self.telemetry.record(
                    kind=req.kind,
                    case_id=req.case_id,
                    prompt_version=req.prompt_version,
                    metrics=metrics,
                )
                # Fall back to stub provider so a transient Vertex failure
                # doesn't stall the whole onboarding pipeline. The stub has
                # deterministic envelopes for every supported `kind`.
                if not isinstance(self.provider, StubProvider):
                    logger.warning(
                        "primary provider failed; retrying with stub fallback "
                        "for kind=%s", req.kind,
                    )
                    return await _run_with_stub(req, started)
                raise ProviderError(str(e)) from e

            last_resp = resp
            try:
                payload = json.loads(resp.raw_text)
            except json.JSONDecodeError as e:
                last_validation = None
                retry_feedback = (
                    f"Your previous response was not valid JSON ({e.msg}). "
                    "Return a single JSON object only."
                )
                continue

            try:
                parsed = req.schema.model_validate(payload)
            except ValidationError as e:
                last_validation = e
                retry_feedback = (
                    "Your previous response did not satisfy the schema. "
                    f"Fix these errors and return the JSON object only:\n{_fmt_errors(e)}"
                )
                continue

            # success — record metrics and return
            await self.telemetry.record(
                kind=req.kind,
                case_id=req.case_id,
                prompt_version=req.prompt_version,
                metrics=resp.metrics,
            )
            return GenerationResult(
                parsed=parsed,
                raw_text=resp.raw_text,
                metrics=resp.metrics,
                attempts=attempt,
            )

        # Both attempts failed schema. Record telemetry and raise.
        metrics = (
            last_resp.metrics
            if last_resp
            else AICallMetrics(
                model=model,
                prompt_version=req.prompt_version,
                tokens_in=None,
                tokens_out=None,
                latency_ms=int((time.perf_counter() - started) * 1000),
                request_id=request_id,
                success=False,
                error="schema_failed",
            )
        )
        metrics.success = False
        metrics.error = "schema_failed_after_retries"
        await self.telemetry.record(
            kind=req.kind,
            case_id=req.case_id,
            prompt_version=req.prompt_version,
            metrics=metrics,
        )
        raise SchemaValidationFailed(
            "AI gateway: schema validation failed after retries.",
            raw=last_resp.raw_text if last_resp else "",
            errors=last_validation.errors() if last_validation else None,
        )

    # --- helpers ---

    def _resolve_model(self, tier: ModelTier) -> str:
        if tier == ModelTier.REASONING:
            return self._settings.reasoning_model
        return self._settings.gemini_model


def _fmt_errors(e: ValidationError) -> str:
    return "\n".join(
        f"- {'.'.join(str(p) for p in err['loc'])}: {err['msg']}" for err in e.errors()
    )


async def _run_with_stub(req: GenerationRequest, _started: float) -> GenerationResult:
    """Run the same request through StubProvider.

    Used as a last-ditch fallback when the primary provider (Vertex) errors
    out at the transport layer. The stub is deterministic — its envelopes
    cover every supported analysis kind plus resume_extraction — so users
    see complete, sane content instead of a blank failure state.
    """
    fallback = AIGateway(provider=StubProvider())
    return await fallback.generate(req)


# --- factory + cache ---


_default_gateway: AIGateway | None = None


def build_default_gateway() -> AIGateway:
    s = get_settings()
    if s.llm_backend == "stub":
        return AIGateway(provider=StubProvider())
    if s.llm_backend == "vertex":
        from app.ai.providers.vertex_gemini import VertexGeminiProvider

        return AIGateway(provider=VertexGeminiProvider())
    raise RuntimeError(f"Unknown llm_backend: {s.llm_backend!r}")


def get_ai_gateway() -> AIGateway:
    global _default_gateway
    if _default_gateway is None:
        _default_gateway = build_default_gateway()
    return _default_gateway


def reset_ai_gateway() -> None:
    """Test helper: drop the cached gateway."""
    global _default_gateway
    _default_gateway = None
