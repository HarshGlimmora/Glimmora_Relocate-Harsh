"""AI call telemetry sink.

Decoupled from the gateway so the gateway works in tests/scripts that don't
hold a DB session. The default sink writes to ai_calls; the noop sink is
used when no session is available.
"""

from __future__ import annotations

from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.types import AICallMetrics
from app.storage.models import AICall


class TelemetrySink(Protocol):
    async def record(
        self,
        *,
        kind: str,
        case_id: str | None,
        prompt_version: str | None,
        metrics: AICallMetrics,
    ) -> None: ...


class NoopSink:
    async def record(
        self,
        *,
        kind: str,
        case_id: str | None,
        prompt_version: str | None,
        metrics: AICallMetrics,
    ) -> None:
        return


class DBSink:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record(
        self,
        *,
        kind: str,
        case_id: str | None,
        prompt_version: str | None,
        metrics: AICallMetrics,
    ) -> None:
        row = AICall(
            case_id=case_id,
            kind=kind,
            model=metrics.model,
            prompt_version=prompt_version or metrics.prompt_version,
            tokens_in=metrics.tokens_in,
            tokens_out=metrics.tokens_out,
            latency_ms=metrics.latency_ms,
            cost_usd=metrics.cost_usd,
            request_id=metrics.request_id,
            success=metrics.success,
            error=metrics.error,
        )
        self.session.add(row)
        await self.session.flush()
