"""Live Vertex smoke — opt-in.

This suite makes REAL Gemini calls. It's skipped unless explicitly enabled
via env var, so the regular `pytest` invocation stays free + fast.

Enable:
    GLIMMORA_LIVE_VERTEX=1 pytest tests/live/test_vertex_smoke.py -v

Run before deploys to confirm the rotated key + region + models still
authenticate and the schema-strip pipeline still produces Vertex-safe
schemas. Each test runs one tiny call per tier (~2–4s, ~3000 tokens).
"""

from __future__ import annotations

import os

import pytest
from pydantic import BaseModel, Field

from app.ai.gateway import AIGateway, GenerationRequest, get_ai_gateway, reset_ai_gateway
from app.ai.types import ModelTier

LIVE = os.environ.get("GLIMMORA_LIVE_VERTEX") == "1"

pytestmark = pytest.mark.skipif(not LIVE, reason="set GLIMMORA_LIVE_VERTEX=1 to enable live Vertex smoke")


class _Tiny(BaseModel):
    answer: str = Field(min_length=1, max_length=20)
    score: int = Field(ge=0, le=100)


def _req(tier: ModelTier, text: str) -> GenerationRequest:
    return GenerationRequest(
        kind=f"smoke_{tier.value}",
        prompt_name="documents",  # any registered prompt
        prompt_version="v1",
        model_tier=tier,
        schema=_Tiny,
        system='Return one JSON object that satisfies the schema. Echo what the user asks.',
        user=f'Return JSON: {{"answer": "{text}", "score": 50}}',
    )


@pytest.mark.asyncio
async def test_vertex_provider_is_active() -> None:
    reset_ai_gateway()
    gw = get_ai_gateway()
    assert gw.provider.name == "vertex_gemini", (
        f"provider is {gw.provider.name!r}; live smoke requires AI_PROVIDER=auto + GCP creds"
    )


@pytest.mark.asyncio
async def test_flash_tier_round_trips() -> None:
    reset_ai_gateway()
    gw = get_ai_gateway()
    r = await gw.generate(_req(ModelTier.FAST, "flash"))
    assert r.parsed.answer
    assert 0 <= r.parsed.score <= 100
    assert r.metrics.model.startswith("gemini-")
    assert r.metrics.tokens_in and r.metrics.tokens_out


@pytest.mark.asyncio
async def test_pro_tier_round_trips() -> None:
    reset_ai_gateway()
    gw = get_ai_gateway()
    r = await gw.generate(_req(ModelTier.REASONING, "pro"))
    assert r.parsed.answer
    assert 0 <= r.parsed.score <= 100
    assert r.metrics.model.startswith("gemini-")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "module_path,detail_cls",
    [
        ("country_comparison", "CountryComparisonDetail"),
        ("job_fit", "JobFitDetail"),
        ("visa", "VisaDirectionDetail"),
        ("family", "FamilyImpactDetail"),
        ("finance", "FinanceDetail"),
        ("documents", "DocumentChecklistDetail"),
        ("workflow", "WorkflowDetail"),
        ("culture", "CultureDetail"),
        ("timeline", "TimelineDetail"),
        ("synthesis", "SynthesisDetail"),
    ],
)
async def test_each_real_module_schema_is_vertex_safe(module_path, detail_cls) -> None:
    """For each real module schema, send a one-shot generate request to Vertex
    and assert the response is schema-valid. This is the equivalent of the
    `INVALID_ARGUMENT: too many states` defense — if any of these blow past
    Vertex's FSM limit, we'll see it here.
    """
    import importlib
    from pydantic import BaseModel as _BM
    from app.schemas.envelope import AnalysisStatus, Assumption, NextAction, Risk

    mod = importlib.import_module(f"app.modules.{module_path}.schemas")
    Detail = getattr(mod, detail_cls)

    class Envelope(_BM):
        status: AnalysisStatus
        score: int = Field(ge=0, le=100)
        summary: str
        reasoning: str
        risks: list[Risk] = Field(default_factory=list)
        next_actions: list[NextAction] = Field(default_factory=list)
        confidence: float = Field(ge=0.0, le=1.0)
        assumptions: list[Assumption]
        detail: Detail  # type: ignore[valid-type]

    reset_ai_gateway()
    gw = get_ai_gateway()
    req = GenerationRequest(
        kind=f"smoke_{module_path}",
        prompt_name=module_path if module_path != "job_fit" else "job_fit",
        prompt_version="v1",
        model_tier=ModelTier.FAST,
        schema=Envelope,
        system="Return one JSON object that satisfies the schema.",
        user='{"target_country":"DE","target_city":"Berlin","current_country":"IN"}',
    )
    # We accept either success or SchemaValidationFailed — what we will NOT
    # accept is `ProviderError("INVALID_ARGUMENT: required fields ['title']
    # are not defined in the schema properties")` or `too many states`,
    # because those mean the strip pipeline regressed.
    from app.ai.types import ProviderError

    try:
        await gw.generate(req)
    except ProviderError as e:
        msg = str(e).lower()
        assert "required fields" not in msg, f"schema strip regression: {e}"
        assert "too many states" not in msg, f"schema FSM regression: {e}"
        # Other provider errors (e.g. real auth issues) re-raise so the test
        # surfaces them honestly.
        raise
