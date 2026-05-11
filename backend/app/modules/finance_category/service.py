"""Finance Category service — per-category AI deep-dive on the finance page.

One service handles all five categories (housing, utilities, food,
transport, healthcare). The category name is passed in as a parameter and
becomes part of the input payload, the kind string, and the prompt
variables. The shape of the returned envelope is identical across
categories so the React detail page can render any of them.

We pull the user's most recent finance analysis as a hard prerequisite —
without it we have no monthly cost figure to anchor the deep-dive on.
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
from app.modules.finance_category.repository import (
    CATEGORIES,
    FinanceCategoryRepository,
    kind_for,
)
from app.modules.finance_category.schemas import (
    FinanceCategoryDetail,
    FinanceCategoryInputs,
)
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService
from app.observability import log_error, log_event
from app.schemas.envelope import (
    AnalysisEnvelope,
    AnalysisStatus,
    Assumption,
    EnvelopeMetadata,
    NextAction,
    Risk,
)
from app.schemas.profile import UserProfile
from app.storage.analyses import AnalysesRepository, stable_input_hash


class _ModelEnvelope(BaseModel):
    """What we ask the LLM to return — wrapped before persistence."""

    status: AnalysisStatus
    score: int = Field(ge=0, le=100)
    summary: str
    reasoning: str
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    assumptions: list[Assumption]
    detail: FinanceCategoryDetail


class FinanceCategoryService:
    PROMPT_NAME = "finance_category"
    PROMPT_VERSION = "v1"

    def __init__(
        self,
        session: AsyncSession,
        *,
        gateway: AIGateway | None = None,
    ) -> None:
        self.session = session
        self.repo = FinanceCategoryRepository(session)
        self.profiles = ProfileService(ProfileRepository(session))
        self.cases = CaseRepository(session)
        if gateway is None:
            base = get_ai_gateway()
            gateway = AIGateway(provider=base.provider, telemetry=DBSink(session))
        self.gateway = gateway
        self._settings = get_settings()

    # ----- read APIs -----

    async def latest(
        self, *, user_id: str, case_id: str, category: str
    ) -> dict | None:
        _validate_category(category)
        await self._authz_case(user_id=user_id, case_id=case_id)
        row = await self.repo.latest(case_id, category)
        return _row_to_response(row, category) if row else None

    # ----- generate -----

    async def run(
        self,
        *,
        user_id: str,
        case_id: str,
        category: str,
        body: FinanceCategoryInputs,
    ) -> dict:
        _validate_category(category)
        case = await self._authz_case(user_id=user_id, case_id=case_id)
        profile = await self.profiles.get_profile(user_id)

        # The finance analysis is a hard prerequisite — its monthly_cost
        # block is what we deep-dive on.
        finance_envelope = await _get_finance_envelope(self.session, case_id)
        if finance_envelope is None:
            raise BadRequest(
                "Run the finance analysis first; we anchor the deep-dive on its monthly cost figures."
            )

        category_cost = _extract_category_cost(finance_envelope, category)
        if category_cost is None:
            raise BadRequest(
                f"The finance analysis has no '{category}' line item to deep-dive on yet."
            )

        merged_inputs = _build_inputs(
            profile=profile,
            case_inputs=case.inputs_snapshot or {},
            category=category,
            finance_envelope=finance_envelope,
            category_cost=category_cost,
        )
        if not merged_inputs.get("target_country"):
            raise BadRequest("finance-category requires target_country on the profile.")

        input_payload = {
            "profile": profile.model_dump(mode="json"),
            "case_inputs": merged_inputs,
            "category": category,
            "category_cost": category_cost,
            "finance_summary": {
                "monthly_net": finance_envelope.get("detail", {}).get("monthly_net"),
                "monthly_cost": finance_envelope.get("detail", {}).get("monthly_cost"),
                "surplus_or_deficit_monthly": finance_envelope.get("detail", {}).get(
                    "surplus_or_deficit_monthly"
                ),
                "affordability_score": finance_envelope.get("detail", {}).get(
                    "affordability_score"
                ),
                "savings_runway_months": finance_envelope.get("detail", {}).get(
                    "savings_runway_months"
                ),
            },
        }
        natural_hash = stable_input_hash(input_payload)

        if not body.force:
            cached = await self.repo.find_cached(case_id, category, natural_hash)
            if cached is not None and cached.status == "ready":
                log_event(
                    "finance_category.cache_hit",
                    case_id=case_id,
                    user_id=user_id,
                    module_name=f"finance-category-{category}",
                    input_hash=natural_hash,
                    analysis_version=cached.analysis_version,
                )
                return _row_to_response(cached, category)  # type: ignore[return-value]

        previous = await self.repo.latest(case_id, category)
        version = await self.repo.next_version(case_id, category)
        input_hash = (
            stable_input_hash({"_natural": natural_hash, "_force_version": version})
            if body.force
            else natural_hash
        )
        model = self._settings.gemini_model  # FAST tier — focused, structured
        prompt_version = self.PROMPT_VERSION

        log_event(
            "finance_category.run_start",
            case_id=case_id,
            user_id=user_id,
            module_name=f"finance-category-{category}",
            input_hash=input_hash,
            analysis_version=version,
            prompt_version=prompt_version,
            model=model,
        )
        row = await self.repo.create_generating(
            case_id=case_id,
            category=category,
            input_hash=input_hash,
            analysis_version=version,
            inputs_revision_at_gen=case.inputs_revision,
            model=model,
            prompt_version=prompt_version,
        )

        started = time.perf_counter()
        try:
            req = GenerationRequest(
                kind=kind_for(category),
                prompt_name=self.PROMPT_NAME,
                prompt_version=self.PROMPT_VERSION,
                model_tier=ModelTier.FAST,
                schema=_ModelEnvelope,
                system=(
                    "Return one JSON object that satisfies the schema. "
                    f"The category under analysis is '{category}'. "
                    "All numeric values stay in the user's currency. "
                    "Never invent values that contradict the supplied finance figures."
                ),
                user=_render_user_message(input_payload),
                case_id=case_id,
                metadata={"user_id": user_id, "category": category},
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
                category=category,
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
                category=category,
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
            "finance_category.run_success",
            case_id=case_id,
            user_id=user_id,
            module_name=f"finance-category-{category}",
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
            "kind": kind_for(category),
            "status": "ready",
            "envelope": full_envelope,
            "analysis_version": version,
            "stale": False,
            "recompute_required": False,
            "stale_reason": None,
            "cached": False,
            "category": category,
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


def _validate_category(category: str) -> None:
    if category not in CATEGORIES:
        raise BadRequest(
            f"unknown category '{category}'. Must be one of: {', '.join(CATEGORIES)}."
        )


def _build_inputs(
    *,
    profile: UserProfile,
    case_inputs: dict,
    category: str,
    finance_envelope: dict,
    category_cost: dict,
) -> dict[str, Any]:
    return {
        "category": category,
        "category_cost": category_cost,
        "target_country": profile.target_country,
        "target_city": profile.target_city,
        "current_country": profile.current_country,
        "salary_currency": profile.salary_currency,
        "expected_salary": profile.expected_salary,
        "monthly_budget": profile.monthly_budget,
        "savings": profile.savings,
        "rent_expectation": profile.rent_expectation,
        "cost_sensitivity": profile.cost_sensitivity,
        "family_status": profile.family_status,
        "moving_with_family": profile.moving_with_family,
        "children_count": profile.children_count,
    }


async def _get_finance_envelope(
    session: AsyncSession, case_id: str
) -> dict | None:
    """Pull the latest non-superseded `finance` analysis envelope, if any."""
    repo = AnalysesRepository(session)
    rows = await repo.list_all_for_case(case_id)
    for r in rows:
        if r.kind == "finance" and r.envelope:
            return r.envelope
    return None


def _extract_category_cost(
    finance_envelope: dict, category: str
) -> dict | None:
    """Pull the {amount, currency, note} line item for the category, if present."""
    detail = finance_envelope.get("detail") or {}
    monthly_cost = detail.get("monthly_cost") or {}
    line = monthly_cost.get(category)
    if isinstance(line, dict) and "amount" in line:
        return line
    return None


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
    full = AnalysisEnvelope[FinanceCategoryDetail](
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
    repo: FinanceCategoryRepository,
    row_id: str,
    started: float,
    input_hash: str,
    version: int,
    model: str,
    prompt_version: str,
    case_id: str,
    category: str,
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
        category=category,
        error_code=error_code,
        user_message=user_message,
        extra=extra,
    )
    await repo.mark_failed(
        analysis_id=row_id, error_envelope=envelope, latency_ms=latency_ms
    )
    log_error(
        "finance_category.run_failed",
        case_id=case_id,
        user_id=user_id,
        module_name=f"finance-category-{category}",
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
        "kind": kind_for(category),
        "status": "failed",
        "envelope": envelope,
        "analysis_version": version,
        "stale": False,
        "recompute_required": False,
        "stale_reason": None,
        "category": category,
    }


def _failed_envelope(
    *,
    input_hash: str,
    version: int,
    model: str,
    prompt_version: str,
    category: str,
    error_code: str,
    user_message: str,
    extra: dict | None = None,
) -> dict:
    return {
        "status": "failed",
        "kind": kind_for(category),
        "error_code": error_code,
        "user_message": user_message,
        "metadata": {
            "model": model,
            "prompt_version": prompt_version,
            "input_hash": input_hash,
            "category": category,
            **(extra or {}),
        },
    }


def _row_to_response(row: Any, category: str) -> dict | None:
    if row is None:
        return None
    return {
        "id": row.id,
        "case_id": row.case_id,
        "kind": row.kind,
        "status": row.status,
        "envelope": row.envelope or {},
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
        "category": category,
    }
