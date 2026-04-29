"""Final Synthesis service.

This is the dashboard module. It rolls every upstream analysis into a
single decision-grade verdict.

Pipeline shape mirrors the other modules. Two synthesis-specific bits:

  - Inputs: the prior-analysis summary is *richer* — we include score,
    summary, confidence, and a curated detail excerpt per kind so the
    LLM has enough to reconcile the verdict.
  - Post-AI: we run a consistency check against the upstream module
    scores. The synthesis verdict cannot drift too far from the
    weighted average of upstream scores; if it does we fail with
    `synthesis_inconsistent` so the user sees a clean failed envelope
    instead of a contradictory dashboard.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway, GenerationRequest, get_ai_gateway
from app.ai.telemetry import DBSink
from app.ai.types import (
    ModelTier,
    ProviderError,
    SchemaValidationFailed,
)
from app.config import get_settings
from app.middleware.error_handler import BadRequest, Forbidden, NotFound
from app.modules.case.repository import CaseRepository
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService
from app.modules.resume.repository import ResumeRepository
from app.modules.synthesis.repository import SynthesisRepository
from app.modules.synthesis.schemas import (
    SynthesisDetail,
    SynthesisInputs,
)
from app.observability import log_error, log_event
from app.schemas.envelope import (
    AnalysisEnvelope,
    AnalysisKind,
    AnalysisStatus,
    Assumption,
    EnvelopeMetadata,
    NextAction,
    Risk,
)
from app.schemas.profile import UserProfile
from app.storage.analyses import AnalysesRepository, stable_input_hash

KIND = AnalysisKind.SYNTHESIS.value

# Modules that contribute a score to the synthesis verdict, with weights.
# Visa + finance dominate because they're the hardest to recover from;
# culture and timeline are softer signals.
_SCORING_WEIGHTS: dict[str, float] = {
    "country_comparison": 1.0,
    "jobfit": 1.5,
    "visa": 2.0,
    "family": 1.0,
    "finance": 1.5,
    "documents": 0.8,
    "workflow": 0.6,
    "culture": 0.4,
    "timeline": 0.6,
}

# Thresholds for verdict assignment based on weighted score.
_VERDICT_BANDS: list[tuple[int, str]] = [
    (80, "go"),
    (65, "go_with_conditions"),
    (50, "wait"),
    (35, "reconsider"),
    (0, "blocked"),
]


class _ModelEnvelope(BaseModel):
    status: AnalysisStatus
    score: int = Field(ge=0, le=100)
    summary: str
    reasoning: str
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    assumptions: list[Assumption]
    detail: SynthesisDetail


class SynthesisService:
    PROMPT_NAME = "synthesis"
    PROMPT_VERSION = "v1"

    def __init__(
        self,
        session: AsyncSession,
        *,
        gateway: AIGateway | None = None,
    ) -> None:
        self.session = session
        self.repo = SynthesisRepository(session)
        self.profiles = ProfileService(ProfileRepository(session))
        self.resumes = ResumeRepository(session)
        self.cases = CaseRepository(session)
        if gateway is None:
            base = get_ai_gateway()
            gateway = AIGateway(provider=base.provider, telemetry=DBSink(session))
        self.gateway = gateway
        self._settings = get_settings()

    # ----- read APIs -----

    async def latest(self, *, user_id: str, case_id: str) -> dict | None:
        await self._authz_case(user_id=user_id, case_id=case_id)
        row = await self.repo.latest(case_id)
        return _row_to_response(row)

    async def history(
        self, *, user_id: str, case_id: str, limit: int = 20
    ) -> list[dict]:
        await self._authz_case(user_id=user_id, case_id=case_id)
        rows = await self.repo.history(case_id, limit=limit)
        return [_row_to_response(r) for r in rows if r is not None]  # type: ignore[list-item]

    # ----- generate -----

    async def run(
        self,
        *,
        user_id: str,
        case_id: str,
        body: SynthesisInputs,
    ) -> dict:
        case = await self._authz_case(user_id=user_id, case_id=case_id)
        profile = await self.profiles.get_profile(user_id)

        merged_inputs = _build_inputs(
            profile=profile, case_inputs=case.inputs_snapshot or {}
        )
        if not merged_inputs.get("target_country"):
            raise BadRequest(
                "final-synthesis requires target_country on the profile."
            )

        resume = await self.resumes.latest_for_user(user_id)
        resume_extracted = (
            resume.extracted_json if resume and resume.extracted_json else None
        )
        prior = await _prior_analyses_summary(self.session, case_id)
        if not prior:
            raise BadRequest(
                "final-synthesis requires at least one upstream analysis to be generated first."
            )

        input_payload = {
            "profile": profile.model_dump(mode="json"),
            "resume_extraction": resume_extracted or {},
            "case_inputs": merged_inputs,
            "prior_analyses": prior,
        }
        natural_hash = stable_input_hash(input_payload)

        if not body.force:
            cached = await self.repo.find_cached(case_id, natural_hash)
            if cached is not None and cached.status == "ready":
                log_event(
                    "synthesis.cache_hit",
                    case_id=case_id,
                    user_id=user_id,
                    module_name="final-synthesis",
                    input_hash=natural_hash,
                    analysis_version=cached.analysis_version,
                )
                return _row_to_response(cached)  # type: ignore[return-value]

        previous = await self.repo.latest(case_id)
        version = await self.repo.next_version(case_id)
        input_hash = (
            stable_input_hash({"_natural": natural_hash, "_force_version": version})
            if body.force
            else natural_hash
        )
        # Synthesis is the most reasoning-intensive module — Pro tier.
        model = self._settings.reasoning_model
        prompt_version = self.PROMPT_VERSION

        log_event(
            "synthesis.run_start",
            case_id=case_id,
            user_id=user_id,
            module_name="final-synthesis",
            input_hash=input_hash,
            analysis_version=version,
            prompt_version=prompt_version,
            model=model,
        )
        row = await self.repo.create_generating(
            case_id=case_id,
            input_hash=input_hash,
            analysis_version=version,
            inputs_revision_at_gen=case.inputs_revision,
            model=model,
            prompt_version=prompt_version,
        )

        started = time.perf_counter()
        try:
            req = GenerationRequest(
                kind=KIND,
                prompt_name=self.PROMPT_NAME,
                prompt_version=self.PROMPT_VERSION,
                model_tier=ModelTier.REASONING,
                schema=_ModelEnvelope,
                system="Return one JSON object that satisfies the schema.",
                user=_render_user_message(input_payload),
                case_id=case_id,
                metadata={"user_id": user_id},
            )
            result = await self.gateway.generate(req)

        except SchemaValidationFailed:
            return await _record_failure(
                repo=self.repo,
                row_id=row.id,
                started=started,
                input_hash=input_hash,
                version=version,
                model=model,
                prompt_version=prompt_version,
                case_id=case_id,
                user_id=user_id,
                error_code="schema_validation_failed",
                user_message="The AI response failed validation after retries. Please try again.",
            )
        except ProviderError as e:
            return await _record_failure(
                repo=self.repo,
                row_id=row.id,
                started=started,
                input_hash=input_hash,
                version=version,
                model=model,
                prompt_version=prompt_version,
                case_id=case_id,
                user_id=user_id,
                error_code="provider_error",
                user_message="The AI provider is unavailable right now. Please try again shortly.",
                extra={"detail": str(e)[:240]},
            )

        struct_error = _validate_synthesis_consistency(result.parsed.detail, prior)
        if struct_error:
            return await _record_failure(
                repo=self.repo,
                row_id=row.id,
                started=started,
                input_hash=input_hash,
                version=version,
                model=model,
                prompt_version=prompt_version,
                case_id=case_id,
                user_id=user_id,
                error_code="synthesis_inconsistent",
                user_message="The AI synthesis disagreed with the upstream analyses. Please try again.",
                extra={"reason": struct_error},
            )

        latency_ms = result.metrics.latency_ms or int(
            (time.perf_counter() - started) * 1000
        )
        full_envelope = _assemble_envelope(
            model_envelope=result.parsed,
            input_hash=input_hash,
            version=version,
            model=model,
            prompt_version=prompt_version,
            tokens_in=result.metrics.tokens_in,
            tokens_out=result.metrics.tokens_out,
            latency_ms=latency_ms,
        )
        await self.repo.mark_ready(
            analysis_id=row.id,
            envelope=full_envelope,
            tokens_in=result.metrics.tokens_in,
            tokens_out=result.metrics.tokens_out,
            latency_ms=latency_ms,
            cost_usd=result.metrics.cost_usd,
        )
        if previous is not None and previous.id != row.id:
            await self.repo.supersede(old_id=previous.id, new_id=row.id)

        log_event(
            "synthesis.run_success",
            case_id=case_id,
            user_id=user_id,
            module_name="final-synthesis",
            input_hash=input_hash,
            analysis_version=version,
            prompt_version=prompt_version,
            model=model,
            status="ready",
            stale=False,
            recompute_required=False,
            latency_ms=latency_ms,
            tokens_in=result.metrics.tokens_in,
            tokens_out=result.metrics.tokens_out,
            cost_usd=result.metrics.cost_usd,
            confidence=full_envelope.get("confidence"),
        )

        return {
            "id": row.id,
            "case_id": case_id,
            "kind": KIND,
            "status": "ready",
            "envelope": full_envelope,
            "analysis_version": version,
            "stale": False,
            "recompute_required": False,
            "stale_reason": None,
            "cached": False,
        }

    # ----- streaming SSE -----

    async def run_sse(
        self,
        *,
        user_id: str,
        case_id: str,
        body: SynthesisInputs,
    ) -> AsyncIterator[str]:
        """Yield Server-Sent Events as the synthesis is generated.

        We don't stream tokens from the provider (the gateway returns one
        validated JSON object). Instead we emit progress events as we hit
        each pipeline stage. This is what the frontend's progress UI
        needs to feel responsive while the Pro-tier model takes ~10s.
        """
        import json as _json

        def _event(event: str, data: dict) -> str:
            return f"event: {event}\ndata: {_json.dumps(data)}\n\n"

        yield _event("progress", {"stage": "starting", "pct": 5})
        try:
            yield _event("progress", {"stage": "loading_priors", "pct": 20})
            result = await self.run(user_id=user_id, case_id=case_id, body=body)
            yield _event("progress", {"stage": "ready", "pct": 100})
            yield _event("result", result)
        except (NotFound, Forbidden, BadRequest) as e:
            yield _event("error", {"code": e.__class__.__name__, "message": str(e)})

    # ----- helpers -----

    async def _authz_case(self, *, user_id: str, case_id: str):
        row = await self.cases.get_by_id(case_id)
        if row is None:
            raise NotFound("case not found")
        if row.user_id != user_id:
            raise Forbidden("not your case")
        return row


# ---- pure helpers ----


def _build_inputs(*, profile: UserProfile, case_inputs: dict) -> dict[str, Any]:
    out = {
        "target_country": profile.target_country,
        "target_city": profile.target_city,
        "current_country": profile.current_country,
        "nationality": profile.nationality,
        "current_visa_status": profile.current_visa_status,
        "needs_visa_sponsorship": profile.needs_visa_sponsorship,
        "current_role": profile.current_role,
        "target_role": case_inputs.get("target_role"),
        "industry": profile.industry,
        "years_experience": profile.years_experience,
        "seniority": profile.seniority,
        "move_urgency": profile.move_urgency,
        "current_document_status": profile.current_document_status or {},
    }
    return out


async def _prior_analyses_summary(session: AsyncSession, case_id: str) -> list[dict]:
    """Pull each upstream analysis with score + summary + a slice of detail.

    Synthesis benefits from richer excerpts than a typical module. We
    whitelist the few detail keys per kind that drive the verdict.
    """
    repo = AnalysesRepository(session)
    rows = await repo.list_all_for_case(case_id)
    detail_whitelist: dict[str, list[str]] = {
        "country_comparison": [
            "destination_suitability_score",
            "origin_pressure_score",
            "comparison_summary",
        ],
        "jobfit": [
            "overall_job_fit_score",
            "role_match",
            "key_gaps",
        ],
        "visa": [
            "route_difficulty",
            "primary_route",
            "blockers",
            "legal_disclaimer",
        ],
        "family": [
            "household_complexity_score",
            "mode",
            "headline_finding",
        ],
        "finance": [
            "affordability_score",
            "surplus_or_deficit_monthly",
            "headline_finding",
        ],
        "documents": [
            "readiness_percentage",
            "have_count",
            "need_count",
            "headline_finding",
        ],
        "workflow": [
            "blocked_node_ids",
            "current_stage_node_id",
            "headline_finding",
        ],
        "culture": [
            "headline_finding",
        ],
        "timeline": [
            "estimated_total_weeks_min",
            "estimated_total_weeks_max",
            "earliest_realistic_start_date",
            "headline_finding",
        ],
    }
    out: list[dict] = []
    for r in rows:
        if r.kind == KIND or not r.envelope or r.status != "ready":
            continue
        env = r.envelope
        item = {
            "kind": r.kind,
            "score": env.get("score"),
            "summary": (env.get("summary") or "")[:240],
            "confidence": env.get("confidence"),
        }
        keys = detail_whitelist.get(r.kind, [])
        if keys:
            detail = env.get("detail") or {}
            extracted = {k: detail.get(k) for k in keys if k in detail}
            if extracted:
                item["detail_excerpt"] = extracted
        out.append(item)
    return out


def _render_user_message(payload: dict) -> str:
    import json as _json

    return _json.dumps(payload, sort_keys=True, default=str)


def _weighted_upstream_score(prior: list[dict]) -> tuple[float, float]:
    """Return (weighted_avg, total_weight) using only available kinds."""
    num = 0.0
    den = 0.0
    for p in prior:
        kind = p.get("kind")
        score = p.get("score")
        if kind in _SCORING_WEIGHTS and isinstance(score, (int, float)):
            w = _SCORING_WEIGHTS[kind]
            num += w * float(score)
            den += w
    if den == 0:
        return (0.0, 0.0)
    return (num / den, den)


def _validate_synthesis_consistency(
    detail: SynthesisDetail, prior: list[dict]
) -> str | None:
    """Synthesis verdict must align with upstream module scores.

    Rules:
      1. Every module_score with `available=true` must reference a kind
         that actually appears in `prior`.
      2. Each available module_score's score must match the upstream
         score within ±5 points.
      3. The feasibility_score must be within ±15 of the weighted average
         of upstream module scores (when at least one upstream analysis
         is present).
      4. The verdict must fall within the band that contains the
         feasibility_score.
    """
    prior_by_kind: dict[str, dict] = {p.get("kind"): p for p in prior}

    for ms in detail.module_scores:
        if not ms.available:
            continue
        upstream = prior_by_kind.get(ms.kind)
        if upstream is None:
            return f"module_scores entry {ms.kind!r} not in prior_analyses"
        upstream_score = upstream.get("score")
        if isinstance(upstream_score, (int, float)) and abs(int(upstream_score) - ms.score) > 5:
            return (
                f"module_score for {ms.kind!r} ({ms.score}) drifts from upstream "
                f"({int(upstream_score)}) by more than 5"
            )

    weighted, total_weight = _weighted_upstream_score(prior)
    if total_weight > 0:
        if abs(detail.feasibility_score - weighted) > 15:
            return (
                f"feasibility_score {detail.feasibility_score} drifts from "
                f"weighted upstream {weighted:.1f} by more than 15"
            )
        # Verdict band
        expected_band = next(
            (label for threshold, label in _VERDICT_BANDS if detail.feasibility_score >= threshold),
            "blocked",
        )
        if detail.verdict != expected_band:
            return (
                f"verdict {detail.verdict!r} does not match feasibility_score "
                f"{detail.feasibility_score} band {expected_band!r}"
            )

    return None


def _assemble_envelope(
    *,
    model_envelope: _ModelEnvelope,
    input_hash: str,
    version: int,
    model: str,
    prompt_version: str,
    tokens_in: int | None,
    tokens_out: int | None,
    latency_ms: int | None,
) -> dict:
    metadata = EnvelopeMetadata(
        generated_at=datetime.now(timezone.utc),
        model=model,
        prompt_version=prompt_version,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
    )
    full = AnalysisEnvelope[SynthesisDetail](
        status=model_envelope.status,
        score=model_envelope.score,
        summary=model_envelope.summary,
        reasoning=model_envelope.reasoning,
        risks=model_envelope.risks,
        next_actions=model_envelope.next_actions,
        confidence=model_envelope.confidence,
        metadata=metadata,
        detail=model_envelope.detail,
        analysis_version=version,
        stale=False,
        recompute_required=False,
        stale_reason=None,
        input_hash=input_hash,
        assumptions=model_envelope.assumptions,
    )
    return full.model_dump(mode="json")


async def _record_failure(
    *,
    repo: SynthesisRepository,
    row_id: str,
    started: float,
    input_hash: str,
    version: int,
    model: str,
    prompt_version: str,
    case_id: str,
    user_id: str,
    error_code: str,
    user_message: str,
    extra: dict | None = None,
) -> dict:
    latency_ms = int((time.perf_counter() - started) * 1000)
    envelope = _failed_envelope(
        input_hash=input_hash,
        version=version,
        model=model,
        prompt_version=prompt_version,
        error_code=error_code,
        user_message=user_message,
        extra=extra,
    )
    await repo.mark_failed(
        analysis_id=row_id, error_envelope=envelope, latency_ms=latency_ms
    )
    log_error(
        "synthesis.run_failed",
        case_id=case_id,
        user_id=user_id,
        module_name="final-synthesis",
        input_hash=input_hash,
        analysis_version=version,
        prompt_version=prompt_version,
        model=model,
        status="failed",
        error_code=error_code,
        latency_ms=latency_ms,
    )
    return {
        "id": row_id,
        "case_id": case_id,
        "kind": KIND,
        "status": "failed",
        "envelope": envelope,
        "analysis_version": version,
        "stale": False,
        "recompute_required": False,
        "stale_reason": None,
    }


def _failed_envelope(
    *,
    input_hash: str,
    version: int,
    model: str,
    prompt_version: str,
    error_code: str,
    user_message: str,
    extra: dict | None = None,
) -> dict:
    return {
        "status": "failed",
        "kind": KIND,
        "error_code": error_code,
        "user_message": user_message,
        "metadata": {
            "model": model,
            "prompt_version": prompt_version,
            "input_hash": input_hash,
            "analysis_version": version,
            **(extra or {}),
        },
    }


def _row_to_response(row) -> dict | None:
    if row is None:
        return None
    return {
        "id": row.id,
        "case_id": row.case_id,
        "kind": row.kind,
        "status": row.status,
        "envelope": row.envelope,
        "analysis_version": row.analysis_version,
        "stale": row.stale,
        "recompute_required": row.recompute_required,
        "stale_reason": row.stale_reason,
        "model": row.model,
        "prompt_version": row.prompt_version,
        "input_hash": row.input_hash,
        "tokens_in": row.tokens_in,
        "tokens_out": row.tokens_out,
        "latency_ms": row.latency_ms,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }
