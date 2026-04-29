"""Country Comparison service.

Pipeline:
  1. Build the input payload from profile + resume + case + body overrides.
  2. Hash it. If a non-stale row already exists for this hash and `force` is
     false, return it (cache hit).
  3. Otherwise: bump analysis_version, insert a `generating` row, call the
     AI gateway, validate the envelope + detail, write the ready row, and
     supersede the prior current row (if any).
  4. Log every step structured-and-typed for observability.

A failure path produces a `failed` envelope row — never a half-written row.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway, GenerationRequest, get_ai_gateway
from app.ai.telemetry import DBSink
from app.ai.types import (
    ModelTier,
    ProviderError,
    SchemaValidationFailed,
)
from app.config import get_settings
from app.middleware.error_handler import BadRequest, NotFound
from app.modules.case.repository import CaseRepository
from app.modules.country_comparison.repository import CountryComparisonRepository
from app.modules.country_comparison.schemas import (
    CountryComparisonDetail,
    CountryComparisonInputs,
)
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService
from app.modules.resume.repository import ResumeRepository
from app.observability import log_error, log_event, log_warn
from app.schemas.envelope import (
    AnalysisEnvelope,
    AnalysisKind,
    AnalysisStatus,
    Assumption,
    AssumptionSource,
    EnvelopeMetadata,
    NextAction,
    Risk,
)
from app.schemas.profile import UserProfile

KIND = AnalysisKind.COUNTRY_COMPARISON.value


# ---- Structural envelope: what the LLM returns ----
#
# We don't make Gemini fill `analysis_version`, `stale`, `recompute_required`,
# `input_hash` — those are server-managed. The model returns the *creative*
# fields and the gateway-validated `detail`; the service stitches in the
# server-managed bits and then validates the full AnalysisEnvelope before
# persisting.


class _ModelEnvelope(BaseModel):
    status: AnalysisStatus
    score: int = Field(ge=0, le=100)
    summary: str
    reasoning: str
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    assumptions: list[Assumption]
    detail: CountryComparisonDetail


class CountryComparisonService:
    PROMPT_NAME = "country_comparison"
    PROMPT_VERSION = "v1"

    def __init__(
        self,
        session: AsyncSession,
        *,
        gateway: AIGateway | None = None,
    ) -> None:
        self.session = session
        self.repo = CountryComparisonRepository(session)
        self.profiles = ProfileService(ProfileRepository(session))
        self.resumes = ResumeRepository(session)
        self.cases = CaseRepository(session)
        # Bind telemetry to this request's session so ai_calls writes land in
        # the same transaction as the analysis row.
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
        body: CountryComparisonInputs,
    ) -> dict:
        case = await self._authz_case(user_id=user_id, case_id=case_id)
        profile = await self.profiles.get_profile(user_id)

        # Apply body overrides into the profile shape used to build inputs,
        # without mutating the persisted profile (the profile owns its own writes).
        merged_inputs = _build_inputs(profile=profile, case_inputs=case.inputs_snapshot or {}, body=body)
        if not merged_inputs.get("current_country") or not merged_inputs.get("target_country"):
            raise BadRequest(
                "country-comparison requires current_country and target_country on the profile or in the request body."
            )

        # Pull resume context + prior analyses (read-only for prompt grounding).
        resume = await self.resumes.latest_for_user(user_id)
        resume_extracted = resume.extracted_json if resume and resume.extracted_json else None

        prior = await self._prior_analyses_summary(case_id)
        input_payload = _input_payload(
            profile=profile,
            resume_extracted=resume_extracted,
            case_inputs=merged_inputs,
            prior_analyses=prior,
        )
        natural_hash = _hash(input_payload)

        # Cache hit — same inputs, still current, not stale, not forced.
        if not body.force:
            cached = await self.repo.find_cached(case_id, natural_hash)
            if cached is not None and cached.status == "ready":
                log_event(
                    "country_comparison.cache_hit",
                    case_id=case_id,
                    user_id=user_id,
                    module_name=KIND,
                    input_hash=natural_hash,
                    analysis_version=cached.analysis_version,
                )
                return _row_to_response(cached)  # type: ignore[return-value]

        previous = await self.repo.latest(case_id)
        version = await self.repo.next_version(case_id)
        # When forcing a rerun with the same natural inputs, salt the stored
        # hash with the new version so the unique (case, kind, hash) row can
        # land. Cache lookups still use the natural hash for cold reads.
        input_hash = (
            _hash({"_natural": natural_hash, "_force_version": version})
            if body.force
            else natural_hash
        )
        model = self._settings.reasoning_model
        prompt_version = self.PROMPT_VERSION

        log_event(
            "country_comparison.run_start",
            case_id=case_id,
            user_id=user_id,
            module_name=KIND,
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

        except SchemaValidationFailed as e:
            latency_ms = int((time.perf_counter() - started) * 1000)
            envelope = _failed_envelope(
                input_hash=input_hash,
                version=version,
                model=model,
                prompt_version=prompt_version,
                error_code="schema_validation_failed",
                user_message="The AI response failed validation after retries. Please try again.",
            )
            await self.repo.mark_failed(
                analysis_id=row.id,
                error_envelope=envelope,
                latency_ms=latency_ms,
            )
            log_error(
                "country_comparison.run_failed",
                case_id=case_id,
                user_id=user_id,
                module_name=KIND,
                input_hash=input_hash,
                analysis_version=version,
                prompt_version=prompt_version,
                model=model,
                status="failed",
                error_code="schema_validation_failed",
                latency_ms=latency_ms,
            )
            return {
                "id": row.id,
                "case_id": case_id,
                "kind": KIND,
                "status": "failed",
                "envelope": envelope,
                "analysis_version": version,
                "stale": False,
                "recompute_required": False,
                "stale_reason": None,
            }

        except ProviderError as e:
            latency_ms = int((time.perf_counter() - started) * 1000)
            envelope = _failed_envelope(
                input_hash=input_hash,
                version=version,
                model=model,
                prompt_version=prompt_version,
                error_code="provider_error",
                user_message="The AI provider is unavailable right now. Please try again shortly.",
                extra={"detail": str(e)[:240]},
            )
            await self.repo.mark_failed(
                analysis_id=row.id,
                error_envelope=envelope,
                latency_ms=latency_ms,
            )
            log_error(
                "country_comparison.run_failed",
                case_id=case_id,
                user_id=user_id,
                module_name=KIND,
                input_hash=input_hash,
                analysis_version=version,
                prompt_version=prompt_version,
                model=model,
                status="failed",
                error_code="provider_error",
                latency_ms=latency_ms,
            )
            return {
                "id": row.id,
                "case_id": case_id,
                "kind": KIND,
                "status": "failed",
                "envelope": envelope,
                "analysis_version": version,
                "stale": False,
                "recompute_required": False,
                "stale_reason": None,
            }

        # Success — assemble the full server-managed envelope and persist.
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
            "country_comparison.run_success",
            case_id=case_id,
            user_id=user_id,
            module_name=KIND,
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

    # ----- helpers -----

    async def _authz_case(self, *, user_id: str, case_id: str):
        row = await self.cases.get_by_id(case_id)
        if row is None:
            raise NotFound("case not found")
        if row.user_id != user_id:
            from app.middleware.error_handler import Forbidden

            raise Forbidden("not your case")
        return row

    async def _prior_analyses_summary(self, case_id: str) -> list[dict]:
        from app.storage.analyses import AnalysesRepository

        repo = AnalysesRepository(self.session)
        rows = await repo.list_all_for_case(case_id)
        out: list[dict] = []
        for r in rows:
            if r.kind == KIND or not r.envelope:
                continue
            env = r.envelope
            out.append(
                {
                    "kind": r.kind,
                    "score": env.get("score"),
                    "summary": (env.get("summary") or "")[:240],
                    "confidence": env.get("confidence"),
                }
            )
        return out


# ---- pure helpers ----


def _build_inputs(
    *, profile: UserProfile, case_inputs: dict, body: CountryComparisonInputs
) -> dict[str, Any]:
    """Body > case snapshot > profile, in that priority order."""
    body_d = body.model_dump(exclude_unset=True)
    out = {
        "current_country": (
            body_d.get("current_country")
            or case_inputs.get("current_country")
            or profile.current_country
        ),
        "current_city": (
            body_d.get("current_city")
            or case_inputs.get("current_city")
            or profile.current_city
        ),
        "target_country": (
            body_d.get("target_country")
            or case_inputs.get("target_country")
            or profile.target_country
        ),
        "target_city": (
            body_d.get("target_city")
            or case_inputs.get("target_city")
            or profile.target_city
        ),
        "open_to_alternatives": body_d.get(
            "open_to_alternatives", case_inputs.get("open_to_alternatives", False)
        ),
        "alternatives": body_d.get(
            "alternatives", case_inputs.get("alternatives", [])
        ),
        "current_job_situation": body_d.get(
            "current_job_situation", case_inputs.get("current_job_situation")
        ),
        "job_search_status": body_d.get(
            "job_search_status", case_inputs.get("job_search_status")
        ),
        "reason_for_moving": body_d.get(
            "reason_for_moving", case_inputs.get("reason_for_moving")
        ),
        "origin_constraints": body_d.get(
            "origin_constraints", case_inputs.get("origin_constraints")
        ),
    }
    # Normalise codes
    for k in ("current_country", "target_country"):
        if out.get(k):
            out[k] = out[k].upper()
    if out.get("alternatives"):
        out["alternatives"] = [a.upper() for a in out["alternatives"]]
    return out


def _input_payload(
    *,
    profile: UserProfile,
    resume_extracted: dict | None,
    case_inputs: dict,
    prior_analyses: list[dict],
) -> dict[str, Any]:
    return {
        "profile": profile.model_dump(mode="json"),
        "resume_extraction": resume_extracted or {},
        "case_inputs": case_inputs,
        "prior_analyses": prior_analyses,
    }


def _hash(payload: dict) -> str:
    from app.storage.analyses import stable_input_hash

    return stable_input_hash(payload)


def _render_user_message(payload: dict) -> str:
    import json as _json

    return _json.dumps(payload, sort_keys=True, default=str)


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
    """Stitch model output + server-managed fields into a full AnalysisEnvelope JSON."""
    metadata = EnvelopeMetadata(
        generated_at=datetime.now(timezone.utc),
        model=model,
        prompt_version=prompt_version,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
    )
    full = AnalysisEnvelope[CountryComparisonDetail](
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
    """Compact JSON the frontend can render for failed states."""
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
