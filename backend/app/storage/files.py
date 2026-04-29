"""Pluggable resume file storage.

Local filesystem for dev/test. GCS implementation will land alongside the
real Vertex provider — the interface stays the same.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Protocol

from app.config import get_settings


class FileStorage(Protocol):
    async def write(self, *, user_id: str, filename: str, mime_type: str, data: bytes) -> str:
        """Persist bytes; return a uri the parser can later read."""
        ...

    async def read(self, uri: str) -> bytes: ...


class LocalFileStorage:
    def __init__(self, root_dir: str) -> None:
        self.root = Path(root_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    async def write(self, *, user_id: str, filename: str, mime_type: str, data: bytes) -> str:
        user_dir = self.root / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        # Preserve original filename for debugging by appending it after a uuid.
        safe = "".join(c for c in filename if c.isalnum() or c in "._-") or "resume"
        path = user_dir / f"{uuid.uuid4()}__{safe}"
        path.write_bytes(data)
        return f"file://{path.resolve()}"

    async def read(self, uri: str) -> bytes:
        if not uri.startswith("file://"):
            raise ValueError(f"LocalFileStorage cannot read {uri!r}")
        return Path(uri[len("file://") :]).read_bytes()


def get_file_storage() -> FileStorage:
    s = get_settings()
    if s.resume_storage_backend == "local":
        return LocalFileStorage(s.resume_storage_local_dir)
    raise NotImplementedError(
        f"Storage backend {s.resume_storage_backend!r} is not implemented in this phase."
    )
