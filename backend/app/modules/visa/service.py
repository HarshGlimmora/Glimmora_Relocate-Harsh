"""Visa Direction service.

Same pipeline shape as country-comparison and job-fit. Requires
target_country + nationality to generate; everything else gracefully falls
back to defaults that the prompt is told to surface as `assumptions`.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

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
from app.modules.visa.repository import VisaRepository
from app.modules.visa.schemas import VisaDirectionDetail, VisaInputs
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

KIND = AnalysisKind.VISA.value


class _ModelEnvelope(BaseModel):
    status: AnalysisStatus
    score: int = Field(ge=0, le=100)
    summary: str
    reasoning: str
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    assumptions: list[Assumption]
    detail: VisaDirectionDetail


class VisaService:
    PROMPT_NAME = "visa_direction"
    PROMPT_VERSION = "v1"

    def __init__(
        self,
        session: AsyncSession,
        *,
        gateway: AIGateway | None = None,
    ) -> None:
        self.session = session
        self.repo = VisaRepository(session)
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
        body: VisaInputs,
    ) -> dict:
        case = await self._authz_case(user_id=user_id, case_id=case_id)
        profile = await self.profiles.get_profile(user_id)

        merged_inputs = _build_inputs(
            profile=profile, case_inputs=case.inputs_snapshot or {}, body=body
        )
        if not merged_inputs.get("target_country"):
            raise BadRequest(
                "visa-direction requires target_country on the profile or in the request body."
            )
        if not merged_inputs.get("nationality"):
            raise BadRequest(
                "visa-direction requires nationality on the profile or in the request body."
            )

        resume = await self.resumes.latest_for_user(user_id)
        resume_extracted = (
            resume.extracted_json if resume and resume.extracted_json else None
        )
        prior = await _prior_analyses_summary(self.session, case_id)

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
                    "visa.cache_hit",
                    case_id=case_id,
                    user_id=user_id,
                    module_name="visa-direction",
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
        model = self._settings.reasoning_model
        prompt_version = self.PROMPT_VERSION

        log_event(
            "visa.run_start",
            case_id=case_id,
            user_id=user_id,
            module_name="visa-direction",
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
            "visa.run_success",
            case_id=case_id,
            user_id=user_id,
            module_name="visa-direction",
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
            raise Forbidden("not your case")
        return row


# ---- pure helpers ----


def _build_inputs(
    *, profile: UserProfile, case_inputs: dict, body: VisaInputs
) -> dict[str, Any]:
    body_d = body.model_dump(exclude_unset=True)
    out = {
        "target_country": (
            body_d.get("target_country")
            or case_inputs.get("target_country")
            or profile.target_country
        ),
        "nationality": (
            body_d.get("nationality")
            or case_inputs.get("nationality")
            or profile.nationality
        ),
        "current_visa_status": (
            body_d.get("current_visa_status")
            or case_inputs.get("current_visa_status")
            or profile.current_visa_status
        ),
        "sponsor_required": _first_present(
            body_d.get("sponsor_required"),
            case_inputs.get("sponsor_required"),
            profile.needs_visa_sponsorship,
        ),
        "employment_status": (
            body_d.get("employment_status")
            or case_inputs.get("employment_status")
        ),
        "family_relocation": _first_present(
            body_d.get("family_relocation"),
            case_inputs.get("family_relocation"),
            False,
        ),
        # Useful destination/career context for the model
        "current_country": profile.current_country,
        "target_city": profile.target_city,
        "current_role": profile.current_role,
        "industry": profile.industry,
        "years_experience": profile.years_experience,
        "expected_salary": profile.expected_salary,
        "salary_currency": profile.salary_currency,
    }
    for k in ("target_country", "nationality"):
        if out.get(k):
            out[k] = out[k].upper()
    if out.get("salary_currency"):
        out["salary_currency"] = out["salary_currency"].upper()
    return out


def _first_present(*values: Any) -> Any:
    for v in values:
        if v is not None:
            return v
    return None


async def _prior_analyses_summary(session: AsyncSession, case_id: str) -> list[dict]:
    repo = AnalysesRepository(session)
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
    metadata = EnvelopeMetadata(
        generated_at=datetime.now(timezone.utc),
        model=model,
        prompt_version=prompt_version,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
    )
    full = AnalysisEnvelope[VisaDirectionDetail](
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
    repo: VisaRepository,
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
        "visa.run_failed",
        case_id=case_id,
        user_id=user_id,
        module_name="visa-direction",
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
