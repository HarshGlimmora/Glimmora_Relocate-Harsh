"""Prompt loader.

Prompts live as plain text files in `app/prompts/`, named
`<name>.<version>.md` (e.g., `resume_extraction.v1.md`). Loaded once at
process boot and cached. Version string is what's recorded in telemetry.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class PromptNotFound(Exception):
    pass


@lru_cache(maxsize=128)
def load_prompt(name: str, version: str) -> str:
    path = PROMPTS_DIR / f"{name}.{version}.md"
    if not path.exists():
        raise PromptNotFound(f"prompt {name}.{version} not found at {path}")
    return path.read_text(encoding="utf-8")


def list_prompts() -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    if not PROMPTS_DIR.exists():
        return out
    for p in PROMPTS_DIR.glob("*.md"):
        stem = p.stem  # name.version
        if "." in stem:
            name, version = stem.rsplit(".", 1)
            out.append((name, version))
    return sorted(out)
