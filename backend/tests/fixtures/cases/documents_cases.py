"""Realistic case fixtures for the document-checklist module."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any


def _expiring_iso(months_from_now: int) -> str:
    return (date.today() + timedelta(days=30 * months_from_now)).isoformat()


def _far_future_iso(years_from_now: int) -> str:
    return (date.today() + timedelta(days=365 * years_from_now)).isoformat()


@dataclass
class DocumentsFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


SOLO_BASIC = DocumentsFixture(
    name="single_user_basic_docs",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "current_country": "IN",
        "target_country": "DE",
        "target_city": "Berlin",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(5)},
            "CV": {"has": True},
        },
    },
    run_body={},  # rely on profile
)


FAMILY_EXTRA_DOCS = DocumentsFixture(
    name="family_with_extra_documents",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "current_country": "IN",
        "target_country": "CA",
        "target_city": "Toronto",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(4)},
            "MARRIAGE_CERT": {"has": True},
            "CHILD_BIRTH_CERT": {"has": False},
        },
    },
    run_body={
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(4)},
            "MARRIAGE_CERT": {"has": True},
            "CHILD_BIRTH_CERT": {"has": False},
        }
    },
)


PASSPORT_EXPIRING = DocumentsFixture(
    name="passport_expiring_soon",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "current_country": "AR",
        "target_country": "GB",
        "target_city": "London",
        "nationality": "AR",
        "needs_visa_sponsorship": True,
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _expiring_iso(8)},
            "CV": {"has": True},
        },
    },
    run_body={},
)


VISA_DEPENDENT = DocumentsFixture(
    name="visa_dependent_checklist",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "QA Engineer",
        "current_country": "CN",
        "target_country": "US",
        "target_city": "San Francisco",
        "nationality": "CN",
        "needs_visa_sponsorship": True,
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(3)},
        },
    },
    run_body={},
)


PARTIALLY_COMPLETE = DocumentsFixture(
    name="partially_complete_checklist",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Engineer",
        "current_country": "KR",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "nationality": "KR",
        "needs_visa_sponsorship": True,
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(6)},
            "CV": {"has": True},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "EMPLOYMENT_LETTER": {"has": False},
            "BANK_STATEMENT": {"has": True},
            "PHOTOS": {"has": False},
        },
    },
    run_body={},
)


ALL_FIXTURES = [
    SOLO_BASIC,
    FAMILY_EXTRA_DOCS,
    PASSPORT_EXPIRING,
    VISA_DEPENDENT,
    PARTIALLY_COMPLETE,
]
