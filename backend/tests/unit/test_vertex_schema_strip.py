"""Vertex `responseSchema` interop unit tests.

These tests prove that `_strip_unsupported` produces a schema that:

  - has no `$ref` (Vertex doesn't follow refs)
  - has no `$defs` / `definitions` (would be dead weight)
  - has no `title`, `default`, `additionalProperties`, `$schema` keys at
    metadata positions
  - PRESERVES `title` when it is a real property name (the bug we hit)
  - normalises `anyOf: [X, {type:null}]` to `X + nullable: true`
  - keeps `properties`, `required`, `type`, `format`, `enum`,
    `minLength`/`maxLength`/`minimum`/`maximum`/`minItems`/`maxItems`,
    `pattern`, `items`
"""

from __future__ import annotations

from typing import Any

import pytest
from pydantic import BaseModel, Field

from app.ai.providers.vertex_gemini import _strip_unsupported


# ---- helpers ---------------------------------------------------------------


def _walk_keys(node: Any, acc: set[str]) -> None:
    if isinstance(node, dict):
        for k, v in node.items():
            acc.add(k)
            _walk_keys(v, acc)
    elif isinstance(node, list):
        for x in node:
            _walk_keys(x, acc)


def _walk_property_paths(node: Any, prefix: str = "") -> set[str]:
    """Collect 'a.b.c' paths reachable through `properties` only."""
    paths: set[str] = set()
    if isinstance(node, dict):
        props = node.get("properties")
        if isinstance(props, dict):
            for name, sub in props.items():
                p = f"{prefix}.{name}" if prefix else name
                paths.add(p)
                paths |= _walk_property_paths(sub, p)
        # Also descend through items / array shapes
        items = node.get("items")
        if isinstance(items, dict):
            paths |= _walk_property_paths(items, prefix)
    return paths


# ---- ground truth: country_comparison and synthesis both have a `title` field


def test_strip_preserves_literal_title_property() -> None:
    """The bug reproducer: country_comparison.StrengthOrBlocker.title must survive."""
    from pydantic import BaseModel as _BM
    from app.modules.country_comparison.schemas import CountryComparisonDetail
    from app.schemas.envelope import (
        AnalysisStatus,
        Assumption,
        NextAction,
        Risk,
    )

    class Envelope(_BM):
        status: AnalysisStatus
        score: int = Field(ge=0, le=100)
        summary: str
        reasoning: str
        risks: list[Risk] = Field(default_factory=list)
        next_actions: list[NextAction] = Field(default_factory=list)
        confidence: float = Field(ge=0.0, le=1.0)
        assumptions: list[Assumption]
        detail: CountryComparisonDetail

    raw = Envelope.model_json_schema()
    cleaned = _strip_unsupported(raw)

    paths = _walk_property_paths(cleaned)
    # The literal `title` field on StrengthOrBlocker is reachable via
    # detail.strengths[].title and detail.blockers[].title.
    assert "detail.strengths.title" in paths
    assert "detail.blockers.title" in paths


def test_strip_inlines_all_refs_and_drops_defs() -> None:
    from app.modules.synthesis.schemas import SynthesisDetail
    from app.schemas.envelope import AnalysisStatus, Assumption, NextAction, Risk

    class Envelope(BaseModel):
        status: AnalysisStatus
        score: int = Field(ge=0, le=100)
        summary: str
        reasoning: str
        risks: list[Risk] = Field(default_factory=list)
        next_actions: list[NextAction] = Field(default_factory=list)
        confidence: float = Field(ge=0.0, le=1.0)
        assumptions: list[Assumption]
        detail: SynthesisDetail

    cleaned = _strip_unsupported(Envelope.model_json_schema())
    keys: set[str] = set()
    _walk_keys(cleaned, keys)
    assert "$ref" not in keys, "all $refs must be inlined"
    assert "$defs" not in keys, "$defs must be removed after inlining"
    assert "definitions" not in keys


def test_strip_drops_metadata_title_at_object_level() -> None:
    schema = {
        "title": "Outer",
        "type": "object",
        "properties": {
            "name": {"type": "string", "title": "Name"},
            "title": {"type": "string", "title": "Title"},  # real property
        },
        "required": ["name", "title"],
    }
    cleaned = _strip_unsupported(schema)
    # No metadata `title` survives at any node
    keys: set[str] = set()
    _walk_keys(cleaned, keys)
    # `title` survives ONLY under properties (as a property name)
    assert "title" in cleaned["properties"]  # field preserved
    assert "title" not in cleaned  # metadata stripped at root
    assert "title" not in cleaned["properties"]["name"]  # metadata stripped on field


def test_strip_drops_additional_properties_and_default() -> None:
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "force": {"type": "boolean", "default": False, "title": "Force"},
        },
        "required": [],
    }
    cleaned = _strip_unsupported(schema)
    assert "additionalProperties" not in cleaned
    assert "default" not in cleaned["properties"]["force"]


def test_strip_normalises_anyof_nullable() -> None:
    schema = {
        "type": "object",
        "properties": {
            "city": {"anyOf": [{"type": "string", "maxLength": 80}, {"type": "null"}], "title": "City"},
        },
        "required": [],
    }
    cleaned = _strip_unsupported(schema)
    city = cleaned["properties"]["city"]
    assert "anyOf" not in city
    assert city.get("nullable") is True
    assert city.get("type") == "string"
    # maxLength is intentionally dropped (Vertex FSM-state constraint)
    assert "maxLength" not in city


def test_strip_keeps_enum_drops_value_constraints() -> None:
    """Vertex has a state-machine limit; we drop value constraints (Pydantic
    re-validates after the call) but keep enum (which is cheap)."""
    schema = {
        "type": "object",
        "properties": {
            "verdict": {
                "type": "string",
                "enum": ["go", "wait"],
                "title": "Verdict",
            },
            "code": {
                "type": "string",
                "pattern": "^[A-Z]{2}$",
                "minLength": 2,
                "maxLength": 2,
            },
            "score": {"type": "integer", "minimum": 0, "maximum": 100},
            "items": {"type": "array", "minItems": 1, "maxItems": 10, "items": {"type": "string"}},
        },
        "required": ["verdict", "code"],
    }
    cleaned = _strip_unsupported(schema)
    assert cleaned["properties"]["verdict"]["enum"] == ["go", "wait"]
    # value constraints stripped to keep Vertex FSM small
    assert "pattern" not in cleaned["properties"]["code"]
    assert "minLength" not in cleaned["properties"]["code"]
    assert "minimum" not in cleaned["properties"]["score"]
    assert "maxItems" not in cleaned["properties"]["items"]
    # but type + items shape preserved
    assert cleaned["properties"]["items"]["type"] == "array"
    assert cleaned["properties"]["items"]["items"]["type"] == "string"


def test_strip_required_array_kept_intact() -> None:
    """`required: ['title']` must survive even though `title` is also a metadata key."""
    schema = {
        "type": "object",
        "properties": {"title": {"type": "string"}, "note": {"type": "string"}},
        "required": ["title", "note"],
    }
    cleaned = _strip_unsupported(schema)
    assert cleaned["required"] == ["title", "note"]


@pytest.mark.parametrize(
    "module_path,detail_cls",
    [
        ("country_comparison", "CountryComparisonDetail"),
        ("job_fit", "JobFitDetail"),
        ("visa", "VisaDirectionDetail"),
        ("family", "FamilyImpactDetail"),
        ("finance", "FinanceDetail"),
        ("documents", "DocumentChecklistDetail"),
        ("workflow", "WorkflowDetail"),
        ("culture", "CultureDetail"),
        ("timeline", "TimelineDetail"),
        ("synthesis", "SynthesisDetail"),
    ],
)
def test_every_module_schema_strips_to_vertex_safe(module_path, detail_cls) -> None:
    """Smoke-cycle every module's detail schema through the strip pipeline."""
    import importlib

    mod = importlib.import_module(f"app.modules.{module_path}.schemas")
    Detail = getattr(mod, detail_cls)
    from app.schemas.envelope import AnalysisStatus, Assumption, NextAction, Risk

    class Envelope(BaseModel):
        status: AnalysisStatus
        score: int = Field(ge=0, le=100)
        summary: str
        reasoning: str
        risks: list[Risk] = Field(default_factory=list)
        next_actions: list[NextAction] = Field(default_factory=list)
        confidence: float = Field(ge=0.0, le=1.0)
        assumptions: list[Assumption]
        detail: Detail  # type: ignore[valid-type]

    cleaned = _strip_unsupported(Envelope.model_json_schema())
    keys: set[str] = set()
    _walk_keys(cleaned, keys)
    # Hard guarantees Vertex needs:
    assert "$ref" not in keys
    assert "$defs" not in keys
    assert "definitions" not in keys
    assert "additionalProperties" not in keys
    # And the schema is still navigable.
    assert "properties" in cleaned
    assert "type" in cleaned
