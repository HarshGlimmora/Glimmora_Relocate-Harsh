"""Profile merge logic tests."""

from __future__ import annotations

from app.modules.profile.merge import (
    apply_user_patch,
    merge_resume_into_profile,
    required_missing,
    with_completion,
)
from app.schemas.profile import (
    Education,
    FieldSource,
    ResumeExtraction,
    Skill,
    UserProfile,
)


def _empty_profile() -> UserProfile:
    return UserProfile()


def _resume() -> ResumeExtraction:
    return ResumeExtraction(
        full_name="Ada Lovelace",
        current_role="Engineer",
        years_experience=12,
        seniority="staff",
        skills=[Skill(name="Python"), Skill(name="Math")],
        inferred_industry="Software",
        education=[Education(school="King's College")],
    )


def test_resume_fills_empty_fields_and_marks_source_resume() -> None:
    profile = _empty_profile()
    new, delta = merge_resume_into_profile(profile=profile, extraction=_resume())
    assert new.full_name == "Ada Lovelace"
    assert new.current_role == "Engineer"
    assert new.years_experience == 12
    assert new.field_sources["full_name"] == FieldSource.RESUME.value
    assert delta["full_name"] == FieldSource.RESUME


def test_resume_does_not_overwrite_user_value() -> None:
    profile = _empty_profile()
    profile, _ = apply_user_patch(profile=profile, patch_values={"full_name": "Hopper"})
    new, delta = merge_resume_into_profile(profile=profile, extraction=_resume())
    assert new.full_name == "Hopper"
    assert new.field_sources["full_name"] == FieldSource.USER.value
    assert "full_name" not in delta


def test_user_patch_overrides_resume_value() -> None:
    profile = _empty_profile()
    profile, _ = merge_resume_into_profile(profile=profile, extraction=_resume())
    assert profile.field_sources["full_name"] == FieldSource.RESUME.value

    profile, changed = apply_user_patch(profile=profile, patch_values={"full_name": "Grace"})
    assert profile.full_name == "Grace"
    assert profile.field_sources["full_name"] == FieldSource.USER.value
    assert changed == {"full_name"}


def test_completion_increases_with_data() -> None:
    p = _empty_profile()
    assert p.completion_percentage == 0
    p, _ = apply_user_patch(
        profile=p,
        patch_values={
            "full_name": "X",
            "current_role": "R",
            "industry": "Tech",
            "years_experience": 5,
            "seniority": "senior",
        },
    )
    assert p.completion_percentage > 0


def test_required_missing_detects_gaps() -> None:
    p = _empty_profile()
    missing = required_missing(p)
    assert "current_country" in missing
    assert "target_country" in missing


def test_with_completion_pure() -> None:
    p = UserProfile(full_name="X")
    out = with_completion(p)
    assert out.completion_percentage > 0
