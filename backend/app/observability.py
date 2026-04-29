"""Lightweight structured logger.

Wraps stdlib logging with a `bind`/`event` API so we get JSON-friendly
key=value lines without dragging structlog into the import path of every
module. Same shape works locally (text) and on Render/DO (parsed by their
log pipelines).
"""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger("glimmora")


def log_event(event: str, **fields: Any) -> None:
    """Emit a single key=value structured line at INFO."""
    safe = {k: _safe(v) for k, v in fields.items() if v is not None}
    logger.info("%s %s", event, json.dumps(safe, sort_keys=True, default=str))


def log_warn(event: str, **fields: Any) -> None:
    safe = {k: _safe(v) for k, v in fields.items() if v is not None}
    logger.warning("%s %s", event, json.dumps(safe, sort_keys=True, default=str))


def log_error(event: str, **fields: Any) -> None:
    safe = {k: _safe(v) for k, v in fields.items() if v is not None}
    logger.error("%s %s", event, json.dumps(safe, sort_keys=True, default=str))


def _safe(v: Any) -> Any:
    if isinstance(v, (str, int, float, bool)) or v is None:
        return v
    if isinstance(v, (list, dict)):
        return v
    return str(v)
