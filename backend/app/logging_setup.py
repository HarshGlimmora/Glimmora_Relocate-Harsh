"""Mirror WARNING+ logs (including unhandled-exception tracebacks) to a file.

The console (uvicorn terminal) keeps its existing output; this just adds a
rotating file handler on the root logger so the same records also land in
`backend/.logs/errors.log`. Useful when the terminal scrolled past the
traceback you actually need.
"""

from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

_LOG_DIR = Path(__file__).resolve().parent.parent / ".logs"
_LOG_FILE = _LOG_DIR / "errors.log"
_HANDLER_NAME = "glimmora_error_file"


def install() -> None:
    """Attach the file handler to the root logger. Idempotent."""
    root = logging.getLogger()
    for h in root.handlers:
        if getattr(h, "name", None) == _HANDLER_NAME:
            return

    _LOG_DIR.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(
        _LOG_FILE,
        maxBytes=2_000_000,  # 2 MB per file
        backupCount=3,
        encoding="utf-8",
    )
    handler.name = _HANDLER_NAME
    handler.setLevel(logging.WARNING)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s [%(name)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )
    )
    root.addHandler(handler)
