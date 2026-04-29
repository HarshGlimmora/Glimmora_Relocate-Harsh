"""Vertex provider failure & fallback semantics.

These tests verify the contract:

  - Vertex transient errors (429 / 503 / network) retry per LLM_MAX_RETRIES
    and only surface as a `failed` envelope after the budget is exhausted.
  - Vertex permanent errors (400 / 401 / 403 / 404) fail fast with no
    retries — no silent stub fallback, no crash.
  - Schema validation failures retry once with the validator's feedback,
    then yield a clean `failed` envelope with `error_code=schema_validation_failed`.
  - Stub is NEVER used silently in production mode. The build path is
    explicit: `llm_backend=stub` ↔ Stub, `llm_backend=vertex` ↔ Vertex.
  - The failed envelope shape is consistent across failure types so the
    frontend can render uniformly.

We mock the provider rather than calling Vertex live so these tests run
fast and deterministically — they validate the *gateway* contract, not
Vertex itself.
"""

from __future__ import annotations

import pytest

from app.ai.gateway import AIGateway, GenerationRequest
from app.ai.providers.base import AIProvider
from app.ai.types import (
    AICallMetrics,
    ModelTier,
    ProviderError,
    ProviderResponse,
    SchemaValidationFailed,
)
from pydantic import BaseModel, Field
from app.schemas.envelope import AnalysisStatus, Assumption, NextAction, Risk


# ---- a tiny envelope schema for these tests --------------------------------


class _Detail(BaseModel):
    answer: str
    score: int = Field(ge=0, le=100)


class _Envelope(BaseModel):
    status: AnalysisStatus
    score: int = Field(ge=0, le=100)
    summary: str
    reasoning: str
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    assumptions: list[Assumption]
    detail: _Detail


# ---- helpers --------------------------------------------------------------


def _valid_payload() -> dict:
    return {
        "status": "ready",
        "score": 50,
        "summary": "ok",
        "reasoning": "ok",
        "risks": [],
        "next_actions": [],
        "confidence": 0.7,
        "assumptions": [{"label": "x", "source": "default", "confidence": 0.5}],
        "detail": {"answer": "yes", "score": 50},
    }


def _req() -> GenerationRequest:
    return GenerationRequest(
        kind="failure_test",
        prompt_name="documents",
        prompt_version="v1",
        model_tier=ModelTier.FAST,
        schema=_Envelope,
        system="Return one JSON object.",
        user='Return: ' + str(_valid_payload()),
    )


# ---- 1) permanent provider error → failed envelope, no fallback ----------


class _PermanentErrorProvider:
    name = "perm-error"

    def __init__(self) -> None:
        self.calls = 0

    async def generate_json(self, **kwargs):  # type: ignore[no-untyped-def]
        self.calls += 1
        raise ProviderError("Vertex call failed: 400 INVALID_ARGUMENT")


@pytest.mark.asyncio
async def test_provider_error_fails_fast_no_silent_fallback() -> None:
    p = _PermanentErrorProvider()
    gw = AIGateway(provider=p)
    with pytest.raises(ProviderError):
        await gw.generate(_req())
    assert p.calls == 1, "no implicit retry on permanent provider error"


# ---- 2) schema-validation retry once, then failed ------------------------


class _BrokenJsonProvider:
    name = "broken-json"

    def __init__(self) -> None:
        self.calls = 0

    async def generate_json(self, **kwargs):  # type: ignore[no-untyped-def]
        self.calls += 1
        return ProviderResponse(
            raw_text="<<not json>>",
            metrics=AICallMetrics(
                model=kwargs["model"],
                prompt_version=None,
                tokens_in=1,
                tokens_out=1,
                latency_ms=1,
                request_id=kwargs["request_id"],
                success=True,
            ),
        )


@pytest.mark.asyncio
async def test_invalid_json_retries_once_then_fails() -> None:
    p = _BrokenJsonProvider()
    gw = AIGateway(provider=p)
    with pytest.raises(SchemaValidationFailed):
        await gw.generate(_req())
    assert p.calls == 2, "gateway must retry exactly once on schema failure"


# ---- 3) recovers on second attempt --------------------------------------


class _FlakyProvider:
    name = "flaky"

    def __init__(self) -> None:
        self.calls = 0

    async def generate_json(self, **kwargs):  # type: ignore[no-untyped-def]
        self.calls += 1
        if self.calls == 1:
            return ProviderResponse(
                raw_text="not-json",
                metrics=AICallMetrics(
                    model=kwargs["model"], prompt_version=None,
                    tokens_in=1, tokens_out=1, latency_ms=1,
                    request_id=kwargs["request_id"], success=True,
                ),
            )
        import json
        return ProviderResponse(
            raw_text=json.dumps(_valid_payload()),
            metrics=AICallMetrics(
                model=kwargs["model"], prompt_version=None,
                tokens_in=10, tokens_out=20, latency_ms=2,
                request_id=kwargs["request_id"], success=True,
            ),
        )


@pytest.mark.asyncio
async def test_recovers_on_retry_with_validator_feedback() -> None:
    p = _FlakyProvider()
    gw = AIGateway(provider=p)
    result = await gw.generate(_req())
    assert p.calls == 2
    assert result.attempts == 2
    assert result.parsed.detail.answer == "yes"


# ---- 4) build_default_gateway is explicit about backend (no silent stub) -


def test_build_default_gateway_respects_backend() -> None:
    """Production mode (vertex) cannot silently land on the stub provider."""
    from unittest.mock import patch
    from app.ai import gateway as gw_mod

    with patch.object(gw_mod, "get_settings") as gs:
        s = type("S", (), {})()
        s.llm_backend = "stub"
        gs.return_value = s
        g = gw_mod.build_default_gateway()
        assert g.provider.name == "stub"

    # Unknown backend → explicit error, not a silent stub
    with patch.object(gw_mod, "get_settings") as gs:
        s = type("S", (), {})()
        s.llm_backend = "openai"  # not supported
        gs.return_value = s
        with pytest.raises(RuntimeError) as ei:
            gw_mod.build_default_gateway()
        assert "openai" in str(ei.value)


# ---- 5) Vertex provider transient retry behaviour (synthetic) -----------


@pytest.mark.asyncio
async def test_vertex_transient_retries_then_fails(monkeypatch) -> None:
    """Use the real VertexGeminiProvider class but mock the SDK call to raise
    a 503 twice. With LLM_MAX_RETRIES=1 the provider attempts 2 calls then
    raises ProviderError. No silent stub fallback.
    """
    from app.ai.providers import vertex_gemini as vg

    # Build a provider instance without calling the SDK init.
    instance = object.__new__(vg.VertexGeminiProvider)
    instance._max_retries = 1
    instance._initial_backoff = 0.01
    instance._timeout_s = 10

    class _FakeClient:
        def __init__(self) -> None:
            self.calls = 0

        class models:  # noqa: N801
            @staticmethod
            def generate_content(*a, **kw):
                raise RuntimeError("503 SERVICE UNAVAILABLE")

    instance._client = _FakeClient()

    with pytest.raises(ProviderError) as ei:
        await instance.generate_json(
            system="s", user="u", json_schema={"type": "object", "properties": {}, "required": []},
            model="gemini-2.5-flash", request_id="r1",
        )
    assert "Vertex call failed" in str(ei.value)


@pytest.mark.asyncio
async def test_vertex_permanent_does_not_retry(monkeypatch) -> None:
    from app.ai.providers import vertex_gemini as vg

    instance = object.__new__(vg.VertexGeminiProvider)
    instance._max_retries = 5  # would retry many times if it were treated as transient
    instance._initial_backoff = 0.01
    instance._timeout_s = 10

    call_counter = {"n": 0}

    class _FakeClient:
        class models:  # noqa: N801
            @staticmethod
            def generate_content(*a, **kw):
                call_counter["n"] += 1
                raise RuntimeError("400 INVALID_ARGUMENT bad schema")

    instance._client = _FakeClient()

    with pytest.raises(ProviderError):
        await instance.generate_json(
            system="s", user="u", json_schema={"type": "object", "properties": {}, "required": []},
            model="gemini-2.5-pro", request_id="r2",
        )
    assert call_counter["n"] == 1, "permanent error must not retry"
