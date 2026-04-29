"""Realistic case fixtures for the workflow & dependencies module."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any


def _far_future_iso(years: int) -> str:
    return (date.today() + timedelta(days=365 * years)).isoformat()


@dataclass
class WorkflowFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


SOLO_MOVER = WorkflowFixture(
    name="solo_mover_clean",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "current_country": "IN",
        "target_country": "DE",
        "target_city": "Berlin",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(5)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "CV": {"has": True},
        },
    },
    run_body={},
)


FAMILY_MOVER = WorkflowFixture(
    name="family_mover",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "current_country": "IN",
        "target_country": "CA",
        "target_city": "Toronto",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(4)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "MARRIAGE_CERT": {"has": True},
            "CHILD_BIRTH_CERT": {"has": True},
        },
    },
    run_body={},
)


VISA_HEAVY = WorkflowFixture(
    name="visa_heavy_case",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "QA Engineer",
        "industry": "SaaS",
        "current_country": "CN",
        "target_country": "US",
        "target_city": "San Francisco",
        "nationality": "CN",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(3)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
        },
    },
    run_body={},
)


DOCUMENT_BLOCKED = WorkflowFixture(
    name="document_blocked_case",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "industry": "Logistics",
        "current_country": "AR",
        "target_country": "GB",
        "target_city": "London",
        "nationality": "AR",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "current_document_status": {
            # Critical: passport not held → upstream blocker
            "PASSPORT": {"has": False},
            "CV": {"has": True},
        },
    },
    run_body={},
)


URGENT_MOVE = WorkflowFixture(
    name="urgent_move_case",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Engineer",
        "industry": "Fintech",
        "current_country": "KR",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "nationality": "KR",
        "needs_visa_sponsorship": True,
        "move_urgency": "asap",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(6)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "CV": {"has": True},
        },
    },
    run_body={},
)


ALL_FIXTURES = [SOLO_MOVER, FAMILY_MOVER, VISA_HEAVY, DOCUMENT_BLOCKED, URGENT_MOVE]
