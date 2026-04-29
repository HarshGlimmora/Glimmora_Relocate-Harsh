"""AI gateway shared types."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class ModelTier(StrEnum):
    """Two tiers — gateway maps to the configured model id."""

    REASONING = "reasoning"  # Pro-tier, slower, higher quality
    FAST = "fast"  # Flash-tier, cheap structured extraction


@dataclass
class AICallMetrics:
    model: str
    prompt_version: str | None
    tokens_in: int | None
    tokens_out: int | None
    latency_ms: int
    request_id: str | None
    success: bool
    error: str | None = None
    cost_usd: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderResponse:
    """Raw provider output. Always a JSON string the gateway will validate."""

    raw_text: str
    metrics: AICallMetrics


class SchemaValidationFailed(Exception):
    """Raised when provider output cannot be coerced into the requested schema."""

    def __init__(self, message: str, *, raw: str, errors: Any) -> None:
        super().__init__(message)
        self.raw = raw
        self.errors = errors


class ProviderError(Exception):
    """Underlying provider call (network/auth/quota) failed."""
