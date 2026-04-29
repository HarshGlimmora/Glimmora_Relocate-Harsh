"""AI gateway tests: success path, schema retry, all-attempts-failed."""

from __future__ import annotations

import json
import os

os.environ.setdefault("JWT_SECRET", "test-secret-32-characters-min-padding-1234567890")

from typing import Any  # noqa: E402

import pytest  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from app.ai.gateway import AIGateway, GenerationRequest  # noqa: E402
from app.ai.types import (  # noqa: E402
    AICallMetrics,
    ModelTier,
    ProviderResponse,
    SchemaValidationFailed,
)


class _Tiny(BaseModel):
    score: int
    label: str


class _ScriptedProvider:
    """Returns scripted responses in order."""

    name = "scripted"

    def __init__(self, scripted: list[str]) -> None:
        self.scripted = list(scripted)
        self.calls: list[dict[str, Any]] = []

    async def generate_json(self, **kwargs: Any) -> ProviderResponse:
        self.calls.append(kwargs)
        text = self.scripted.pop(0)
        return ProviderResponse(
            raw_text=text,
            metrics=AICallMetrics(
                model=kwargs["model"],
                prompt_version=None,
                tokens_in=10,
                tokens_out=10,
                latency_ms=1,
                request_id=kwargs["request_id"],
                success=True,
            ),
        )


def _request() -> GenerationRequest[_Tiny]:
    return GenerationRequest(
        kind="resume_extraction",
        prompt_name="resume_extraction",
        prompt_version="v1",
        model_tier=ModelTier.FAST,
        schema=_Tiny,
        system="extra system",
        user="hi",
    )


@pytest.mark.asyncio
async def test_first_attempt_success() -> None:
    provider = _ScriptedProvider([json.dumps({"score": 1, "label": "ok"})])
    gw = AIGateway(provider=provider)
    out = await gw.generate(_request())
    assert out.parsed.score == 1
    assert out.attempts == 1
    assert provider.calls[0]["retry_feedback"] is None


@pytest.mark.asyncio
async def test_retry_on_schema_failure_then_success() -> None:
    provider = _ScriptedProvider(
        [
            json.dumps({"score": "not-an-int", "label": "ok"}),
            json.dumps({"score": 2, "label": "ok"}),
        ]
    )
    gw = AIGateway(provider=provider)
    out = await gw.generate(_request())
    assert out.parsed.score == 2
    assert out.attempts == 2
    # Second call must include feedback citing the validation error.
    assert provider.calls[1]["retry_feedback"] is not None
    assert "score" in provider.calls[1]["retry_feedback"]


@pytest.mark.asyncio
async def test_retry_on_invalid_json() -> None:
    provider = _ScriptedProvider(
        ["this is not json", json.dumps({"score": 3, "label": "ok"})]
    )
    gw = AIGateway(provider=provider)
    out = await gw.generate(_request())
    assert out.parsed.score == 3


@pytest.mark.asyncio
async def test_all_attempts_fail_raises() -> None:
    provider = _ScriptedProvider(
        [
            json.dumps({"score": "x"}),
            json.dumps({"score": "y"}),
        ]
    )
    gw = AIGateway(provider=provider)
    with pytest.raises(SchemaValidationFailed):
        await gw.generate(_request())
