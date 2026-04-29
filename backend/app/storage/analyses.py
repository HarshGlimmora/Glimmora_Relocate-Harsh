"""Shared `analyses` table repository.

Owned at the storage layer because every analysis module reads/writes the
same row shape. Module-specific services compose this repo to avoid having
nine copies of the same SQL.

Versioning rule: a rerun produces a NEW row with `analysis_version =
previous + 1`; the previous row's `superseded_by` is set to the new row's
id. Reads of "current" use `superseded_by IS NULL` ordered by version desc.

Cache rule: `(case_id, kind, input_hash)` is unique. If a hash matches and
the row is still current (`superseded_by IS NULL`) and not stale, the
service returns the cached row instead of calling Gemini again.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import Analysis


def stable_input_hash(payload: dict[str, Any]) -> str:
    """Deterministic sha256 over canonical JSON of the input payload."""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class AnalysesRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- reads ---

    async def get_current(self, *, case_id: str, kind: str) -> Analysis | None:
        """Latest non-superseded row for (case, kind)."""
        res = await self.session.execute(
            select(Analysis)
            .where(
                Analysis.case_id == case_id,
                Analysis.kind == kind,
                Analysis.superseded_by.is_(None),
            )
            .order_by(desc(Analysis.analysis_version))
            .limit(1)
        )
        return res.scalar_one_or_none()

    async def find_cached(
        self, *, case_id: str, kind: str, input_hash: str
    ) -> Analysis | None:
        """Look up by the unique (case, kind, hash); useful for cache hits."""
        res = await self.session.execute(
            select(Analysis).where(
                Analysis.case_id == case_id,
                Analysis.kind == kind,
                Analysis.input_hash == input_hash,
            )
        )
        return res.scalar_one_or_none()

    async def history(
        self, *, case_id: str, kind: str, limit: int = 20
    ) -> list[Analysis]:
        res = await self.session.execute(
            select(Analysis)
            .where(Analysis.case_id == case_id, Analysis.kind == kind)
            .order_by(desc(Analysis.analysis_version))
            .limit(limit)
        )
        return list(res.scalars().all())

    async def list_all_for_case(self, case_id: str) -> list[Analysis]:
        res = await self.session.execute(
            select(Analysis).where(
                Analysis.case_id == case_id, Analysis.superseded_by.is_(None)
            )
        )
        return list(res.scalars().all())

    # --- writes ---

    async def create_generating(
        self,
        *,
        case_id: str,
        kind: str,
        input_hash: str,
        analysis_version: int,
        inputs_revision_at_gen: int,
        model: str,
        prompt_version: str,
    ) -> Analysis:
        row = Analysis(
            case_id=case_id,
            kind=kind,
            envelope=None,
            status="generating",
            model=model,
            prompt_version=prompt_version,
            input_hash=input_hash,
            inputs_revision_at_gen=inputs_revision_at_gen,
            analysis_version=analysis_version,
            stale=False,
            recompute_required=False,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def mark_ready(
        self,
        *,
        analysis_id: str,
        envelope: dict,
        tokens_in: int | None,
        tokens_out: int | None,
        latency_ms: int | None,
        cost_usd: float | None,
    ) -> None:
        await self.session.execute(
            update(Analysis)
            .where(Analysis.id == analysis_id)
            .values(
                status="ready",
                envelope=envelope,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                stale=False,
                recompute_required=False,
                stale_reason=None,
            )
        )

    async def mark_failed(
        self, *, analysis_id: str, error_envelope: dict, latency_ms: int | None
    ) -> None:
        await self.session.execute(
            update(Analysis)
            .where(Analysis.id == analysis_id)
            .values(
                status="failed",
                envelope=error_envelope,
                latency_ms=latency_ms,
            )
        )

    async def supersede(self, *, old_id: str, new_id: str) -> None:
        await self.session.execute(
            update(Analysis).where(Analysis.id == old_id).values(superseded_by=new_id)
        )

    async def mark_stale(
        self, *, case_id: str, kinds: list[str], reason: str
    ) -> int:
        """Flip current rows for the given kinds to stale=true.

        Returns count of rows updated. Does not touch envelopes or
        analysis_version — the next rerun creates a new row.
        """
        if not kinds:
            return 0
        result = await self.session.execute(
            update(Analysis)
            .where(
                Analysis.case_id == case_id,
                Analysis.kind.in_(kinds),
                Analysis.superseded_by.is_(None),
                Analysis.stale.is_(False),
            )
            .values(stale=True, recompute_required=True, stale_reason=reason)
        )
        return result.rowcount or 0

    async def next_version(self, *, case_id: str, kind: str) -> int:
        current = await self.get_current(case_id=case_id, kind=kind)
        if current is None:
            # Walk all versions in case the most recent was already superseded.
            res = await self.session.execute(
                select(Analysis.analysis_version)
                .where(Analysis.case_id == case_id, Analysis.kind == kind)
                .order_by(desc(Analysis.analysis_version))
                .limit(1)
            )
            top = res.scalar_one_or_none()
            return (top or 0) + 1
        return current.analysis_version + 1
