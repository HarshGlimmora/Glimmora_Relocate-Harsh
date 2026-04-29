"""Workflow schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.workflow.schemas import (
    WorkflowDetail,
    WorkflowEdge,
    WorkflowInputs,
    WorkflowNode,
)


def _node(**overrides) -> WorkflowNode:
    base = dict(
        id="n1",
        label="Node 1",
        category="documents",
        status="not_started",
        owner="user",
        estimated_duration_days_min=1,
        estimated_duration_days_max=3,
    )
    base.update(overrides)
    return WorkflowNode.model_validate(base)


def _edge(**overrides) -> WorkflowEdge:
    base = dict(from_node="n1", to_node="n2", reason="n2 needs n1.")
    base.update(overrides)
    return WorkflowEdge.model_validate(base)


def _detail(**overrides) -> WorkflowDetail:
    sentinel = object()
    nodes = overrides.pop("nodes", sentinel)
    if nodes is sentinel:
        nodes = [
            _node(id="n1", category="documents", status="done"),
            _node(id="n2", category="visa", status="not_started"),
        ]
    edges = overrides.pop("edges", sentinel)
    if edges is sentinel:
        edges = [_edge(from_node="n1", to_node="n2", reason="visa needs docs.")]
    base = dict(
        nodes=nodes,
        edges=edges,
        current_stage_node_id="n2",
        critical_path=["n1", "n2"],
        blocked_node_ids=[],
        total_estimated_days_min=10,
        total_estimated_days_max=20,
        headline_finding="Two-step plan; visa next.",
    )
    base.update(overrides)
    return WorkflowDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.current_stage_node_id == "n2"
    assert d.critical_path == ["n1", "n2"]


def test_status_constrained() -> None:
    with pytest.raises(ValidationError):
        WorkflowNode.model_validate(
            {
                "id": "n",
                "label": "x",
                "category": "documents",
                "status": "lost",
                "owner": "user",
                "estimated_duration_days_min": 1,
                "estimated_duration_days_max": 2,
            }
        )


def test_owner_constrained() -> None:
    with pytest.raises(ValidationError):
        WorkflowNode.model_validate(
            {
                "id": "n",
                "label": "x",
                "category": "documents",
                "status": "done",
                "owner": "alien",
                "estimated_duration_days_min": 1,
                "estimated_duration_days_max": 2,
            }
        )


def test_nodes_must_have_at_least_two() -> None:
    with pytest.raises(ValidationError):
        _detail(nodes=[_node()])


def test_critical_path_min_one() -> None:
    with pytest.raises(ValidationError):
        _detail(critical_path=[])


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        WorkflowInputs.model_validate({"random_key": 1})


def test_edge_reason_required() -> None:
    with pytest.raises(ValidationError):
        WorkflowEdge.model_validate({"from_node": "a", "to_node": "b", "reason": ""})
