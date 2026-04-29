"""Documents schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.documents.schemas import (
    ChecklistItem,
    DocumentChecklistDetail,
    DocumentsInputs,
    NextToHandle,
)


def _item(**overrides) -> ChecklistItem:
    base = dict(
        kind="PASSPORT",
        label="Passport",
        status="have",
        urgency="now",
        required_for=["visa", "travel"],
    )
    base.update(overrides)
    return ChecklistItem.model_validate(base)


def _detail(**overrides) -> DocumentChecklistDetail:
    sentinel = object()
    items = overrides.pop("items", sentinel)
    if items is sentinel:
        items = [
            _item(kind="PASSPORT", status="have"),
            _item(kind="CV", label="CV", status="need", urgency="now", required_for=["visa"]),
        ]
    base = dict(
        items=items,
        readiness_percentage=50,
        have_count=1,
        need_count=1,
        expiring_count=0,
        total_count=2,
        missing_items=[i.model_dump() for i in items if i.status == "need"],
        expiring_items=[],
        required_for_summary={"visa": ["PASSPORT", "CV"]},
        next_to_handle=NextToHandle(
            kind="CV", label="CV", why="Required for visa application."
        ),
        headline_finding="Halfway there.",
    )
    base.update(overrides)
    return DocumentChecklistDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.readiness_percentage == 50
    assert d.next_to_handle.kind == "CV"


def test_status_constrained() -> None:
    with pytest.raises(ValidationError):
        ChecklistItem.model_validate(
            {"kind": "X", "label": "X", "status": "lost", "urgency": "now"}
        )


def test_urgency_constrained() -> None:
    with pytest.raises(ValidationError):
        ChecklistItem.model_validate(
            {"kind": "X", "label": "X", "status": "have", "urgency": "soon"}
        )


def test_items_must_be_non_empty() -> None:
    with pytest.raises(ValidationError):
        _detail(items=[])


def test_total_count_min() -> None:
    with pytest.raises(ValidationError):
        _detail(total_count=0)


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        DocumentsInputs.model_validate({"random": 1})


def test_inputs_per_doc_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        DocumentsInputs.model_validate(
            {"current_document_status": {"PASSPORT": {"has": True, "extra": "x"}}}
        )
