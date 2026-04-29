"""Culture & Language contracts.

Output is a structured cultural-orientation kit for the destination. The
shape is opinionated:

  - `workplace_norms` block: communication_style, hierarchy_note, meeting
    etiquette, dress code, punctuality, feedback culture.
  - `daily_life` block: greetings, tipping, queueing, transport, weekly
    rhythm — the small-friction stuff.
  - `language` block: primary language, English-usability score, target
    proficiency level (CEFR-style), and 5–15 starter phrases with usage
    notes.
  - `first_week_kit`: 4–10 practical orientation tasks with priority +
    expected effort.
  - `dos_and_donts`: short bullet pairs the frontend can render as a
    side-by-side card.

Soft guidance, not legal advice. The summary/reasoning carry tone; the
detail is built so the frontend can render predictable cards.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class CultureInputs(BaseModel):
    """Body for POST /culture/run.

    No user-facing parameters. Future fields: e.g. `interests` from a
    survey to personalise the daily-life block. Today the analysis is
    derived from profile + case + prior analyses.
    """

    model_config = ConfigDict(extra="forbid")

    force: bool = False


# ----- detail payload -----


class WorkplaceNorms(BaseModel):
    communication_style: str = Field(min_length=1, max_length=400)
    hierarchy_note: str = Field(min_length=1, max_length=400)
    meeting_etiquette: str = Field(min_length=1, max_length=400)
    dress_code: Optional[str] = Field(default=None, max_length=300)
    punctuality: Optional[str] = Field(default=None, max_length=300)
    feedback_culture: Optional[str] = Field(default=None, max_length=300)


class DailyLifeNote(BaseModel):
    topic: str = Field(min_length=1, max_length=80)
    note: str = Field(min_length=1, max_length=400)


class BasicPhrase(BaseModel):
    phrase: str = Field(min_length=1, max_length=120)
    translation: str = Field(min_length=1, max_length=120)
    usage: Optional[str] = Field(
        default=None,
        max_length=200,
        description="when / where to use it",
    )


class LanguageBasics(BaseModel):
    primary_language: str = Field(min_length=1, max_length=60)
    english_usability_score: int = Field(
        ge=0,
        le=100,
        description="how far the user can get on English alone in everyday life",
    )
    proficiency_target: str = Field(
        pattern="^(none|A1|A2|B1|B2|C1|C2)$",
        description="CEFR-style level the user should aim for in 6–12 months",
    )
    rationale: str = Field(min_length=1, max_length=400)
    basic_phrases: list[BasicPhrase] = Field(min_length=3, max_length=20)


class FirstWeekItem(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    why: str = Field(min_length=1, max_length=300)
    priority: str = Field(pattern="^(must|should|nice)$")
    effort_hours: float = Field(ge=0.0, le=40.0)


class DoDont(BaseModel):
    do: str = Field(min_length=1, max_length=200)
    dont: str = Field(min_length=1, max_length=200)


class CultureDetail(BaseModel):
    workplace_norms: WorkplaceNorms
    daily_life: list[DailyLifeNote] = Field(min_length=3, max_length=20)
    language: LanguageBasics
    first_week_kit: list[FirstWeekItem] = Field(min_length=3, max_length=15)
    dos_and_donts: list[DoDont] = Field(min_length=2, max_length=15)
    family_adaptation_notes: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="non-empty only when the user is moving with family",
    )
    headline_finding: str = Field(min_length=1, max_length=400)
