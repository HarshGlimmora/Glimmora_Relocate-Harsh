"""Resume text → ResumeExtraction.

Routes through the AI gateway so the production swap (StubProvider →
VertexGeminiProvider) is a config change. The stub provider runs a
deterministic heuristic pass over the text — good enough for unit tests
and local development, and it doubles as the fallback when Vertex blips
so the user always gets a populated profile rather than a dead end.
"""

from __future__ import annotations

import logging

from app.ai.gateway import AIGateway, GenerationRequest
from app.ai.providers.stub import StubProvider
from app.ai.types import ModelTier
from app.schemas.envelope import AnalysisKind  # used as a logical 'kind' for telemetry
from app.schemas.profile import ResumeExtraction

logger = logging.getLogger(__name__)


class ResumeExtractor:
    PROMPT_NAME = "resume_extraction"
    PROMPT_VERSION = "v2"

    def __init__(self, gateway: AIGateway) -> None:
        self.gateway = gateway

    async def extract(self, *, raw_text: str) -> ResumeExtraction:
        req = GenerationRequest(
            kind="resume_extraction",
            prompt_name=self.PROMPT_NAME,
            prompt_version=self.PROMPT_VERSION,
            model_tier=ModelTier.FAST,
            schema=ResumeExtraction,
            system=(
                "You are a strict information-extraction system. "
                "Extract ONLY values that are literally present in the resume text. "
                "Do not infer, compute, paraphrase, or guess. "
                "Prefer null/[] over fabrication. "
                "Output a single JSON object that matches the schema. "
                "No prose, no commentary."
            ),
            user=raw_text,
            metadata={"analysis_kind_compat": AnalysisKind.JOBFIT.value},
        )
        try:
            result = await self.gateway.generate(req)
            return result.parsed
        except Exception as e:
            logger.warning(
                "primary resume extractor failed, falling back to stub: %s", e
            )
            return await _stub_fallback(req)


async def _stub_fallback(req: GenerationRequest[ResumeExtraction]) -> ResumeExtraction:
    """Run the same request against the deterministic stub provider.

    The stub does regex-based extraction over the resume text. It won't
    match Vertex quality but it always succeeds and surfaces enough fields
    (name, emails, phones, headline, summary, skills) for onboarding to be
    useful instead of blocking the user behind a transient AI failure.
    """
    stub_gateway = AIGateway(provider=StubProvider())
    result = await stub_gateway.generate(req)
    return result.parsed
