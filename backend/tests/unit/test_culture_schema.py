"""Culture schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.culture.schemas import (
    BasicPhrase,
    CultureDetail,
    CultureInputs,
    DailyLifeNote,
    DoDont,
    FirstWeekItem,
    LanguageBasics,
    WorkplaceNorms,
)


def _norms(**overrides) -> WorkplaceNorms:
    base = dict(
        communication_style="Direct and concise.",
        hierarchy_note="Flat in tech.",
        meeting_etiquette="Punctual; agendas followed.",
    )
    base.update(overrides)
    return WorkplaceNorms.model_validate(base)


def _language(**overrides) -> LanguageBasics:
    base = dict(
        primary_language="German",
        english_usability_score=70,
        proficiency_target="B1",
        rationale="Helps daily life and accelerates settling in.",
        basic_phrases=[
            {"phrase": "Hallo", "translation": "Hello", "usage": "Greeting"},
            {"phrase": "Danke", "translation": "Thanks", "usage": "Polite"},
            {"phrase": "Bitte", "translation": "Please", "usage": "Polite request"},
        ],
    )
    base.update(overrides)
    return LanguageBasics.model_validate(base)


def _detail(**overrides) -> CultureDetail:
    sentinel = object()
    daily = overrides.pop("daily_life", sentinel)
    if daily is sentinel:
        daily = [
            {"topic": "Sundays", "note": "Most shops closed."},
            {"topic": "Recycling", "note": "Sort carefully."},
            {"topic": "Cash", "note": "Keep some for bakeries."},
        ]
    first_week = overrides.pop("first_week_kit", sentinel)
    if first_week is sentinel:
        first_week = [
            {"label": "Anmeldung", "why": "Mandatory.", "priority": "must", "effort_hours": 2.0},
            {"label": "Bank account", "why": "For payroll.", "priority": "must", "effort_hours": 1.5},
            {"label": "SIM", "why": "Mobile data.", "priority": "should", "effort_hours": 0.5},
        ]
    dos = overrides.pop("dos_and_donts", sentinel)
    if dos is sentinel:
        dos = [
            {"do": "Greet politely.", "dont": "Assume small talk."},
            {"do": "Be on time.", "dont": "No-show."},
        ]
    base = dict(
        workplace_norms=_norms(),
        daily_life=daily,
        language=_language(),
        first_week_kit=first_week,
        dos_and_donts=dos,
        family_adaptation_notes=[],
        headline_finding="Lean into directness.",
    )
    base.update(overrides)
    return CultureDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.language.primary_language == "German"
    assert d.workplace_norms.communication_style.startswith("Direct")


def test_proficiency_target_constrained() -> None:
    with pytest.raises(ValidationError):
        LanguageBasics.model_validate(
            {
                "primary_language": "German",
                "english_usability_score": 70,
                "proficiency_target": "fluent",  # invalid
                "rationale": "x",
                "basic_phrases": [
                    {"phrase": "a", "translation": "b"},
                    {"phrase": "c", "translation": "d"},
                    {"phrase": "e", "translation": "f"},
                ],
            }
        )


def test_first_week_priority_constrained() -> None:
    with pytest.raises(ValidationError):
        FirstWeekItem.model_validate(
            {"label": "x", "why": "y", "priority": "urgent", "effort_hours": 1.0}
        )


def test_basic_phrases_min_three() -> None:
    with pytest.raises(ValidationError):
        LanguageBasics.model_validate(
            {
                "primary_language": "German",
                "english_usability_score": 70,
                "proficiency_target": "B1",
                "rationale": "x",
                "basic_phrases": [{"phrase": "a", "translation": "b"}],
            }
        )


def test_daily_life_min_three() -> None:
    with pytest.raises(ValidationError):
        _detail(daily_life=[{"topic": "a", "note": "b"}])


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        CultureInputs.model_validate({"random": 1})


def test_english_score_bounded() -> None:
    with pytest.raises(ValidationError):
        LanguageBasics.model_validate(
            {
                "primary_language": "German",
                "english_usability_score": 120,
                "proficiency_target": "B1",
                "rationale": "x",
                "basic_phrases": [
                    {"phrase": "a", "translation": "b"},
                    {"phrase": "c", "translation": "d"},
                    {"phrase": "e", "translation": "f"},
                ],
            }
        )
