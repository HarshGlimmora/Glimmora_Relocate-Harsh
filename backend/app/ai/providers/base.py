"""Provider interface.

Implementations only need to: take a prompt + a JSON schema, return a JSON
string + metrics. The gateway handles validation and retry on top.
"""

from __future__ import annotations

from typing import Any, Protocol

from app.ai.types import ProviderResponse


class AIProvider(Protocol):
    name: str

    async def generate_json(
        self,
        *,
        system: str,
        user: str,
        json_schema: dict[str, Any],
        model: str,
        request_id: str,
        retry_feedback: str | None = None,
    ) -> ProviderResponse: ...
