"""Deterministic stub provider.

Used in dev/test until the Vertex Gemini provider is wired in. Behaviour:
  - For `ResumeExtraction` schema: runs simple regex/heuristic parsing on the
    user text so the resume → profile flow has a real, testable path before
    Gemini is configured.
  - For any other schema: returns a minimal valid object built from the
    schema's required fields and types.

Crucially, the stub does NOT cheat: it produces strings, the gateway parses
+ validates them just like a real provider. Schema-failure retry, telemetry,
and the envelope contract all exercise on real code paths.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

from app.ai.types import ProviderResponse, AICallMetrics


class StubProvider:
    name = "stub"

    async def generate_json(
        self,
        *,
        system: str,
        user: str,
        json_schema: dict[str, Any],
        model: str,
        request_id: str,
        retry_feedback: str | None = None,
    ) -> ProviderResponse:
        started = time.perf_counter()

        title = json_schema.get("title") or json_schema.get("$defs", {}).keys()
        # Detect well-known schemas by required fields rather than title.
        # The detail sub-schema lives in $defs / definitions; we discriminate
        # analysis envelopes by which detail fields are present in the schema.
        props = set(json_schema.get("properties", {}).keys())
        detail_props = _detail_required_props(json_schema)

        if {"skills", "experience", "education", "extraction_confidence"} <= props:
            payload = _stub_resume_extraction(user)
        elif {"detail", "summary", "reasoning", "assumptions"} <= props:
            if "overall_job_fit_score" in detail_props:
                payload = _stub_job_fit_envelope(user)
            elif "primary_route" in detail_props:
                payload = _stub_visa_envelope(user)
            elif "household_complexity_score" in detail_props:
                payload = _stub_family_envelope(user)
            elif "affordability_score" in detail_props:
                payload = _stub_finance_envelope(user)
            elif "readiness_percentage" in detail_props:
                payload = _stub_documents_envelope(user)
            elif "current_stage_node_id" in detail_props:
                payload = _stub_workflow_envelope(user)
            elif "workplace_norms" in detail_props:
                payload = _stub_culture_envelope(user)
            elif "phases" in detail_props and "milestones" in detail_props:
                payload = _stub_timeline_envelope(user)
            elif "feasibility_score" in detail_props and "verdict" in detail_props:
                payload = _stub_synthesis_envelope(user)
            else:
                payload = _stub_country_comparison_envelope(user)
        else:
            payload = _minimal_object(json_schema)

        raw = json.dumps(payload)
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        metrics = AICallMetrics(
            model=model,
            prompt_version=None,
            tokens_in=len(user) // 4,  # rough proxy
            tokens_out=len(raw) // 4,
            latency_ms=elapsed_ms,
            request_id=request_id,
            success=True,
            cost_usd=0.0,
            metadata={"provider": self.name, "title_hint": str(title)},
        )
        return ProviderResponse(raw_text=raw, metrics=metrics)


# --- helpers ---


_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE_RE = re.compile(r"\+?\d[\d\s().-]{6,}\d")
_URL_RE = re.compile(
    r"\b(?:https?://|www\.)\S+|\b(?:linkedin\.com|github\.com)/\S+",
    re.I,
)
_YEARS_RE = re.compile(
    r"(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience", re.I,
)
_SENIORITY_TITLE_RE = re.compile(
    r"\b(junior|mid|senior|staff|principal)\b", re.I,
)
# Heuristic for "this looks like a real human name": 2–4 word tokens,
# each Title-Cased letters (allows hyphen + apostrophe), nothing else.
_NAME_TOKEN_RE = re.compile(r"^[A-Z][A-Za-z\-']{1,40}$")


def _strict_name_from_first_lines(text: str) -> str | None:
    """Extract the candidate's name without gluing in phone/email/title.

    Strategy: take the first ~5 non-empty lines, strip emails / phones /
    URLs / common separators from each, then accept the first remaining
    fragment that looks like 2–4 capitalized name tokens. If nothing
    qualifies, return None — never a guess.
    """
    head = [ln.strip() for ln in text.splitlines() if ln.strip()][:5]
    for line in head:
        cleaned = _EMAIL_RE.sub("", line)
        cleaned = _PHONE_RE.sub("", cleaned)
        cleaned = _URL_RE.sub("", cleaned)
        # Common separators between header bits.
        cleaned = re.sub(r"[\|·•,;]+", " ", cleaned)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        if not cleaned:
            continue
        tokens = cleaned.split()
        if 2 <= len(tokens) <= 4 and all(_NAME_TOKEN_RE.match(t) for t in tokens):
            return " ".join(tokens)
    return None


def _stub_resume_extraction(text: str) -> dict[str, Any]:
    """Resume extraction stub — strict, regex-only.

    The contract matches the LLM prompt: extract only what's literally in
    the text. We deliberately do NOT derive seniority from years, and we
    do NOT fabricate years from job dates. If the regex doesn't match, the
    field stays null. Same rule the prompt enforces for Vertex.
    """
    full_name = _strict_name_from_first_lines(text)

    emails = sorted(set(_EMAIL_RE.findall(text)))
    phones = sorted(set(_PHONE_RE.findall(text)))

    # Years of experience: only set when an explicit "N years of experience"
    # phrase is present. No inference from dates, no estimate.
    yrs_match = _YEARS_RE.search(text)
    years_experience = int(yrs_match.group(1)) if yrs_match else None

    # Seniority: only set when one of the canonical title words appears
    # in the resume. Never derived from years.
    seniority = None
    sen_match = _SENIORITY_TITLE_RE.search(text)
    if sen_match:
        seniority = sen_match.group(1).lower()

    # Skills: words after a literal "Skills:" / "Tech Stack:" header.
    skills_block = re.search(
        r"(?:skills?|tech\s*stack|technologies|tools)\s*[:\-]\s*(.+)",
        text,
        re.I,
    )
    skills: list[dict[str, Any]] = []
    if skills_block:
        for raw in re.split(r"[,;|/]", skills_block.group(1)):
            name = raw.strip()
            if 1 <= len(name) <= 80:
                skills.append({"name": name})

    return {
        "full_name": full_name,
        "emails": emails,
        "phones": phones,
        "headline": None,
        "summary": None,
        "current_role": None,
        "current_company": None,
        "years_experience": years_experience,
        "seniority": seniority,
        "skills": skills,
        "experience": [],
        "education": [],
        "certifications": [],
        "languages": [],
        "inferred_industry": None,
        "inferred_job_category": None,
        # Stub is best-effort only; mark accordingly so downstream UIs can
        # de-emphasize stub-derived data and ask the user to confirm.
        "extraction_confidence": 0.3,
    }


def _detail_required_props(schema: dict[str, Any]) -> set[str]:
    """Find the `detail` sub-schema's properties via $defs / definitions."""
    detail = schema.get("properties", {}).get("detail")
    if not detail:
        return set()
    if "$ref" in detail:
        ref = detail["$ref"].split("/")[-1]
        target = (
            schema.get("$defs", {}).get(ref)
            or schema.get("definitions", {}).get(ref)
            or {}
        )
        return set(target.get("properties", {}).keys())
    return set(detail.get("properties", {}).keys())


def _stub_job_fit_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic job-fit envelope keyed off real case inputs.

    Reads the case inputs to produce a response that's recognisably tied to
    the user (target role echo, salary currency, etc.). Skill alignment is
    populated from the resume extraction's skills array if present.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}
    resume = payload.get("resume_extraction") or {}

    target_role = (
        case_inputs.get("target_role")
        or case_inputs.get("current_role")
        or profile.get("current_role")
        or "Software Engineer"
    )
    current_role = case_inputs.get("current_role") or profile.get("current_role") or "Engineer"
    industry = case_inputs.get("preferred_industry") or profile.get("industry") or "Software"
    yrs = (
        case_inputs.get("years_experience")
        or profile.get("years_experience")
        or 5
    )
    needs_visa = bool(case_inputs.get("needs_visa_sponsorship"))
    open_to_role_change = bool(case_inputs.get("open_to_role_change"))
    work_mode = case_inputs.get("work_mode") or "hybrid"

    user_min = int(case_inputs.get("salary_range_min") or 0)
    user_max = int(case_inputs.get("salary_range_max") or user_min or 0)
    if user_min == 0 and user_max == 0:
        user_min, user_max = 60000, 90000
    user_p50 = (user_min + user_max) // 2 if user_max else user_min
    currency = (case_inputs.get("salary_currency") or "EUR").upper()

    # Market estimate: scale with seniority and target country a touch.
    if yrs >= 10:
        market_min, market_max = 95000, 140000
    elif yrs >= 6:
        market_min, market_max = 75000, 115000
    elif yrs >= 3:
        market_min, market_max = 55000, 90000
    else:
        market_min, market_max = 40000, 65000
    market_p50 = (market_min + market_max) // 2
    raw_gap_pct = int(round((user_p50 - market_p50) / market_p50 * 100)) if market_p50 else 0
    # Schema clamps to [-100, 200]; high-currency destinations can blow past that.
    gap_pct = max(-100, min(200, raw_gap_pct))

    salary_realism_score = max(0, min(100, 100 - min(abs(gap_pct), 100)))
    role_match_score = 78 if (current_role.lower() == target_role.lower() or industry) else 60
    visa_score = (
        70 if needs_visa else 88  # users not needing sponsorship score higher
    )
    overall = int(round(0.45 * role_match_score + 0.30 * salary_realism_score + 0.25 * visa_score))

    resume_skills = [s.get("name") for s in (resume.get("skills") or []) if s.get("name")]
    aligned = [
        {"name": s, "why": f"Demonstrated in resume; commonly required for {target_role}."}
        for s in resume_skills[:5]
    ] or [
        {
            "name": "Core engineering",
            "why": "Inferred from current role; resume did not enumerate skills.",
        }
    ]
    missing = [
        {
            "name": "Local-language working proficiency",
            "why": "Hiring managers in the destination often require A2/B1 for non-English roles.",
        },
        {
            "name": "On-call ownership",
            "why": "Senior listings expect 24x7 ownership of a service slice.",
        },
    ]
    transferable = [
        {
            "name": "Cross-functional collaboration",
            "transfers_to": target_role,
            "note": "Maps directly to the destination's flatter team structures.",
        }
    ]

    pathways = [
        {
            "name": "Direct sponsor pipeline",
            "steps": [
                f"List sponsor-friendly employers in {industry}",
                "Tailor resume to destination conventions",
                "Apply to 8–12 anchor postings/week",
                "Run two interview loops in parallel",
            ],
            "time_to_offer_weeks": 12,
            "confidence": 0.65,
        },
        {
            "name": "Internal transfer",
            "steps": [
                "Identify multinationals on current employer's customer list",
                "Pursue an internal transfer to the destination office",
            ],
            "time_to_offer_weeks": 18,
            "confidence": 0.45,
        },
    ]

    alternative_roles = []
    if open_to_role_change:
        alternative_roles = [
            {
                "role": f"Senior {industry} Engineer",
                "fit_score": 80,
                "why": "Adjacent to current role; broadens employer pool.",
            },
            {
                "role": "Solutions Engineer",
                "fit_score": 68,
                "why": "Leverages communication strengths; visa-friendly category.",
            },
        ]

    inferred_roles = [target_role]
    if current_role and current_role.lower() != target_role.lower():
        inferred_roles.append(current_role)

    return {
        "status": "ready",
        "score": overall,
        "summary": (
            f"Solid fit for {target_role} in {industry}; salary expectations are "
            f"{'high' if gap_pct > 10 else 'low' if gap_pct < -10 else 'in line with market'}."
        ),
        "reasoning": (
            f"With {yrs} years in {industry} and a {work_mode} preference, the user maps cleanly "
            f"onto {target_role}-style listings. Salary midpoint {user_p50} {currency} sits "
            f"{gap_pct:+d}% versus a market p50 of {market_p50} {currency}. "
            f"Visa-sponsorship density for this role is {'medium' if needs_visa else 'high'}."
        ),
        "risks": [
            {
                "severity": "medium" if needs_visa else "low",
                "label": "Sponsor-pool concentration",
                "detail": "A small set of employers drive the majority of sponsorship slots; competition is high in Q1.",
            }
        ],
        "next_actions": [
            {
                "label": "Build a sponsor-employer shortlist",
                "urgency": "this week",
                "why": "Anchors application volume to high-conversion targets.",
            },
            {
                "label": "Calibrate resume to destination norms",
                "urgency": "this week",
                "why": "One-page CV + measurable outcomes lifts response rates 2x.",
            },
            {
                "label": "Run a salary benchmark for the target city",
                "urgency": "next week",
                "why": "Closes the gap between user expectation and market p50.",
            },
        ],
        "confidence": 0.7,
        "assumptions": [
            {
                "label": f"Salary assumed in {currency}",
                "detail": "Currency taken from case inputs / profile; convert if displaying elsewhere.",
                "source": "user" if case_inputs.get("salary_currency") else "default",
                "confidence": 0.7,
            },
            {
                "label": "Target role inferred from current role + case inputs",
                "source": "inferred",
                "confidence": 0.6,
            },
        ],
        "detail": {
            "overall_job_fit_score": overall,
            "role_match": {
                "score": role_match_score,
                "target_role_inferred": target_role,
                "confidence": 0.7,
                "rationale": (
                    f"Profile titles, seniority, and {industry} alignment support {target_role}."
                ),
            },
            "salary_realism": {
                "score": salary_realism_score,
                "user_expectation": {
                    "min": user_min,
                    "p50": user_p50,
                    "max": user_max or user_p50,
                    "currency": currency,
                },
                "market_estimate": {
                    "min": market_min,
                    "p50": market_p50,
                    "max": market_max,
                    "currency": currency,
                },
                "gap_pct": gap_pct,
                "note": (
                    "Expectation is broadly in band."
                    if abs(gap_pct) <= 10
                    else (
                        "Expectation is above market p50; expect more friction at offer stage."
                        if gap_pct > 0
                        else "Expectation is below market p50; aim higher in negotiation."
                    )
                ),
            },
            "visa_employability": {
                "score": visa_score,
                "sponsor_friendly_employer_density": "high" if not needs_visa else "medium",
                "typical_sponsor_titles": [
                    target_role,
                    f"Senior {target_role}",
                    f"Lead {target_role}",
                ],
                "note": (
                    "User does not require sponsorship — very wide hiring pool."
                    if not needs_visa
                    else "Sponsor-friendly tier exists; targeting the right employer matters."
                ),
            },
            "skill_alignment": {
                "aligned": aligned,
                "missing": missing,
                "transferable": transferable,
            },
            "inferred_target_roles": inferred_roles[:5],
            "alternative_roles": alternative_roles,
            "pathways": pathways,
            "estimated_time_to_offer_weeks": pathways[0]["time_to_offer_weeks"],
            "key_gaps": [
                {
                    "label": "Local-language proficiency",
                    "severity": "medium",
                    "fixable_in_weeks": 24,
                    "detail": "Most large employers run in English, but mid-size shops prefer local-language fluency.",
                }
            ],
        },
    }


def _stub_documents_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic document-checklist envelope.

    Composes the checklist from:
      - always-include core docs
      - +visa-route docs (police clearance + apostille on high-difficulty
        routes; otherwise a leaner set)
      - +family docs based on the prior family analysis summary if present
      - +arrival-logistics docs

    Honours `current_document_status` (per-doc has/expires_at/notes) and
    flags expiring items based on a 12-month horizon.
    """
    import json as _json
    from datetime import date, timedelta

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}
    prior = payload.get("prior_analyses") or []

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    needs_visa = bool(case_inputs.get("needs_visa_sponsorship"))
    status_map: dict[str, dict[str, Any]] = (
        case_inputs.get("current_document_status") or {}
    )

    # Heuristic: scan prior summaries for family signals.
    has_family_signal = False
    has_high_visa_difficulty = False
    for p in prior:
        kind = p.get("kind")
        text = (p.get("summary") or "").lower()
        if kind == "family" and ("spouse" in text or "child" in text or "parent" in text):
            has_family_signal = True
        if kind == "visa" and ("high" in text or "very high" in text):
            has_high_visa_difficulty = True

    today = date.today()
    horizon = today + timedelta(days=365)

    def parse_date(value: Any) -> date | None:
        if not value:
            return None
        if isinstance(value, date):
            return value
        try:
            return date.fromisoformat(str(value))
        except Exception:
            return None

    def make_item(
        kind: str,
        label: str,
        required_for: list[str],
        urgency: str,
    ) -> dict[str, Any]:
        s = status_map.get(kind) or status_map.get(kind.lower()) or {}
        has = s.get("has")
        expires_at = parse_date(s.get("expires_at"))
        if has and expires_at and expires_at <= horizon:
            status = "expiring"
        elif has is True:
            status = "have"
        elif has is False:
            status = "need"
        else:
            status = "unknown"
        return {
            "kind": kind,
            "label": label,
            "status": status,
            "urgency": urgency,
            "required_for": required_for,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "notes": s.get("notes"),
        }

    items: list[dict[str, Any]] = [
        make_item("PASSPORT", "Passport (12+ months validity)", ["visa", "travel"], "now"),
        make_item("CV", "CV / Resume", ["visa", "job_search"], "now"),
        make_item("EDUCATION_TRANSCRIPTS", "Education transcripts", ["visa"], "30d"),
        make_item("EMPLOYMENT_LETTER", "Employment letter", ["visa"], "30d"),
        make_item("PROOF_OF_ADDRESS", "Proof of address (origin)", ["visa", "tax_registration"], "30d"),
        make_item("BANK_STATEMENT", "Bank statement (3 months)", ["visa"], "30d"),
        make_item("PHOTOS", "Passport photos (recent)", ["visa", "arrival"], "30d"),
    ]

    if has_high_visa_difficulty:
        items.append(make_item(
            "POLICE_CLEARANCE",
            "Police clearance certificate",
            ["visa"],
            "90d",
        ))
        items.append(make_item(
            "APOSTILLE",
            "Apostilled supporting documents",
            ["visa"],
            "90d",
        ))

    if has_family_signal:
        items.append(make_item(
            "MARRIAGE_CERT",
            "Marriage certificate",
            ["family_visa"],
            "30d",
        ))
        items.append(make_item(
            "CHILD_BIRTH_CERT",
            "Child birth certificate(s)",
            ["family_visa", "school_admission"],
            "30d",
        ))
        items.append(make_item(
            "SCHOOL_TRANSCRIPTS",
            "School transcripts (children)",
            ["school_admission"],
            "90d",
        ))
        items.append(make_item(
            "VACCINATION_RECORDS",
            "Vaccination records",
            ["school_admission", "health_registration"],
            "90d",
        ))

    if needs_visa or has_high_visa_difficulty:
        items.append(make_item(
            "LANGUAGE_TEST",
            "Language proficiency test",
            ["visa"],
            "6m",
        ))

    items.append(make_item(
        "MEDICAL_RECORDS",
        "Personal medical records",
        ["health_registration"],
        "later",
    ))

    # Counts
    have_count = sum(1 for it in items if it["status"] == "have")
    need_count = sum(1 for it in items if it["status"] in ("need", "unknown"))
    expiring_count = sum(1 for it in items if it["status"] == "expiring")
    total_count = len(items)
    readiness = round((have_count / total_count) * 100) if total_count else 0

    missing_items = [it for it in items if it["status"] == "need"]
    expiring_items = [it for it in items if it["status"] == "expiring"]

    # required_for_summary
    required_for_summary: dict[str, list[str]] = {}
    for it in items:
        for purpose in it["required_for"]:
            required_for_summary.setdefault(purpose, []).append(it["kind"])

    # Pick next_to_handle: first expiring item; else first missing item with
    # highest-blast-radius (most required_for entries); else passport.
    if expiring_items:
        chosen = expiring_items[0]
        why = "Expiring within 12 months — handle before any other application work."
    elif missing_items:
        missing_items.sort(key=lambda it: -len(it["required_for"]))
        chosen = missing_items[0]
        why = (
            f"Missing — gates {', '.join(chosen['required_for'])}; "
            "every downstream step depends on it."
        )
    else:
        chosen = items[0]
        why = "Verify validity early; everything else stacks on this."

    next_to_handle = {
        "kind": chosen["kind"],
        "label": chosen["label"],
        "why": why,
    }

    headline = (
        f"Readiness {readiness}% ({have_count}/{total_count} ready). "
        f"Next: {chosen['label']}."
    )

    return {
        "status": "ready",
        "score": readiness,
        "summary": (
            f"You're {readiness}% document-ready for {target_country}. "
            f"{'Your most urgent item is ' + chosen['label'] + '.' if missing_items or expiring_items else 'Nothing pressing — verify validity windows.'}"
        ),
        "reasoning": (
            f"Composition reflects a {'family-included' if has_family_signal else 'solo'} move "
            f"to {target_country}, "
            f"{'with high-difficulty visa documents added' if has_high_visa_difficulty else 'using the standard skilled-worker baseline'}. "
            f"{have_count} document(s) reported present, {need_count} missing or unknown, "
            f"and {expiring_count} expiring within 12 months."
        ),
        "risks": [
            {
                "severity": "high" if expiring_count > 0 else "medium" if need_count > 4 else "low",
                "label": "Document gaps gate the timeline",
                "detail": (
                    "Expiring documents must be renewed before submission; "
                    "missing core documents add 4–8 weeks per item."
                ),
            }
        ],
        "next_actions": [
            {
                "label": f"Handle: {chosen['label']}",
                "urgency": "now",
                "why": why,
            },
            {
                "label": "Order apostilles in batch",
                "urgency": "this_month",
                "why": "Notary throughput is the rate-limiting step for most cases.",
            },
            {
                "label": "Scan and back up every document to encrypted cloud",
                "urgency": "this_month",
                "why": "Lost originals are the most common cause of timeline slips.",
            },
        ],
        "confidence": 0.7 + (0.1 if has_high_visa_difficulty else 0) + (0.1 if has_family_signal else 0),
        "assumptions": [
            {
                "label": f"Destination assumed {target_country}",
                "detail": "Echoed from profile / case inputs.",
                "source": "user",
                "confidence": 0.9,
            },
            {
                "label": (
                    "Visa route assumed (high-difficulty)"
                    if has_high_visa_difficulty
                    else "Visa route assumed (skilled-worker baseline)"
                ),
                "detail": (
                    "Picked up from prior visa-direction analysis."
                    if has_high_visa_difficulty
                    else "Used the common skilled-worker baseline since no high-difficulty signal was present."
                ),
                "source": "inferred",
                "confidence": 0.65,
            },
            {
                "label": (
                    "Family-related documents included"
                    if has_family_signal
                    else "Family-related documents excluded"
                ),
                "detail": "Based on the prior family-relocation summary.",
                "source": "inferred",
                "confidence": 0.65,
            },
            {
                "label": "Expiring window: documents valid <12 months are flagged",
                "source": "default",
                "confidence": 0.85,
            },
        ],
        "detail": {
            "items": items,
            "readiness_percentage": readiness,
            "have_count": have_count,
            "need_count": need_count,
            "expiring_count": expiring_count,
            "total_count": total_count,
            "missing_items": [it for it in items if it["status"] == "need"],
            "expiring_items": expiring_items,
            "required_for_summary": required_for_summary,
            "next_to_handle": next_to_handle,
            "headline_finding": headline,
        },
    }


def _stub_finance_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic finance envelope with arithmetic that ties out.

    The schema requires:
      - take_home + tax = gross
      - sum(seven cost lines) = total_monthly
      - surplus = take_home - total_monthly
      - affordability_score banded against surplus / take_home
      - savings_runway_months = floor(savings / abs(surplus)) when deficit, else 0
      - salary_to_expense_ratio = take_home / total_monthly
    """
    import json as _json
    import math

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    target_city = case_inputs.get("target_city") or profile.get("target_city") or "Berlin"

    # Currency: prefer salary_currency from inputs; otherwise pick a default per
    # destination country.
    currency_in = case_inputs.get("salary_currency") or case_inputs.get(
        "current_currency"
    )
    default_currency = {
        "DE": "EUR", "NL": "EUR", "FR": "EUR", "IE": "EUR", "ES": "EUR",
        "PT": "EUR", "AT": "EUR", "BE": "EUR", "FI": "EUR", "IT": "EUR",
        "GB": "GBP", "CA": "CAD", "AU": "AUD", "AE": "AED", "US": "USD",
        "JP": "JPY", "SG": "SGD", "CH": "CHF",
    }.get(target_country, "USD")
    currency = (currency_in or default_currency).upper()

    expected_salary = int(case_inputs.get("expected_salary") or 0)
    current_salary = int(case_inputs.get("current_salary") or 0)
    annual_gross = expected_salary or current_salary
    if annual_gross <= 0:
        annual_gross = 60_000

    family_size = int(case_inputs.get("family_size") or 1)
    family_size = max(1, min(12, family_size))
    rent_expectation = case_inputs.get("rent_expectation")
    monthly_budget = case_inputs.get("monthly_budget")
    savings = int(case_inputs.get("savings") or 0)
    cost_sensitivity = case_inputs.get("cost_sensitivity") or "medium"

    # Tax bracket per destination — directional only.
    tax_pct = {
        "DE": 38, "NL": 36, "FR": 34, "IE": 32, "ES": 33,
        "PT": 30, "AT": 38, "BE": 42, "FI": 35, "IT": 36,
        "GB": 30, "CA": 28, "AU": 30, "AE": 0, "US": 28,
        "JP": 25, "SG": 18, "CH": 22, "IN": 25, "AR": 30,
        "PK": 22, "CN": 25, "KR": 24, "NG": 22,
    }.get(target_country, 28)

    gross_monthly = annual_gross // 12
    estimated_tax_monthly = (gross_monthly * tax_pct) // 100
    take_home_monthly = gross_monthly - estimated_tax_monthly

    # Cost-of-living p50 rough magnitude per destination (one-person, monthly).
    base_cost_per_person = {
        "DE": 1900, "NL": 2100, "FR": 2050, "IE": 2200, "ES": 1500,
        "PT": 1450, "AT": 1850, "BE": 1900, "FI": 1800, "IT": 1700,
        "GB": 2300, "CA": 2200, "AU": 2300, "AE": 2400, "US": 2800,
        "JP": 1800, "SG": 2400, "CH": 3200, "IN": 600, "CN": 1200,
        "KR": 1700, "NG": 700, "PK": 500, "AR": 700,
    }.get(target_country, 1700)

    # Family scaling: each additional household member adds 0.6× the base.
    cost_multiplier = 1.0 + 0.6 * (family_size - 1)
    if cost_sensitivity == "low":
        cost_multiplier *= 1.10
    elif cost_sensitivity == "high":
        cost_multiplier *= 0.90
    base_total = int(round(base_cost_per_person * cost_multiplier))

    # Allocate the base across categories.
    if rent_expectation and rent_expectation > 0:
        housing = int(rent_expectation)
    else:
        # Housing is ~42% of base in most destinations; nudge for high-cost cities.
        housing_pct = 0.45 if target_country in {"GB", "US", "AU", "CH", "AE", "SG"} else 0.40
        housing = int(round(base_total * housing_pct))

    utilities = int(round(base_total * 0.07))
    food = int(round(base_total * 0.18 * (0.7 + 0.3 * family_size)))
    transport = int(round(base_total * 0.07))
    healthcare = int(round(base_total * 0.05 * (0.7 + 0.3 * family_size)))
    childcare = (
        int(round(base_total * 0.10 * max(0, family_size - 1)))
        if family_size > 1
        else 0
    )
    other = max(0, base_total - housing - utilities - food - transport - healthcare - childcare)
    if other < 0:
        other = 0

    total_monthly = housing + utilities + food + transport + healthcare + childcare + other

    surplus = take_home_monthly - total_monthly
    surplus_pct_of_take_home = (
        round((surplus / take_home_monthly) * 100) if take_home_monthly else 0
    )

    if surplus >= 0 and take_home_monthly > 0 and surplus / take_home_monthly >= 0.30:
        affordability = 92
    elif surplus >= 0 and take_home_monthly > 0 and surplus / take_home_monthly >= 0.10:
        affordability = 78
    elif surplus >= 0:
        affordability = 60
    elif take_home_monthly > 0 and abs(surplus) / take_home_monthly < 0.15:
        affordability = 42
    else:
        affordability = 22

    runway = 0
    if surplus < 0:
        deficit = abs(surplus)
        if savings > 0 and deficit > 0:
            runway = min(600, math.floor(savings / deficit))
        else:
            runway = 0

    if total_monthly > 0:
        ratio = round(min(10.0, take_home_monthly / total_monthly), 2)
    else:
        ratio = 0.0

    rent_share_pct = round((housing / take_home_monthly) * 100) if take_home_monthly else 0

    # FX direction: weakens when destination is a clearly higher-cost-base than origin
    origin_country = (profile.get("current_country") or "").upper()
    origin_base = {
        "IN": 600, "CN": 1200, "PK": 500, "NG": 700, "AR": 700, "BR": 900,
        "DE": 1900, "GB": 2300, "US": 2800, "CA": 2200, "AU": 2300, "JP": 1800,
        "KR": 1700, "AE": 2400,
    }.get(origin_country)
    fx_direction = "unknown"
    if origin_base is not None:
        if base_cost_per_person > origin_base * 1.35:
            fx_direction = "weakens_buying_power"
        elif base_cost_per_person * 1.35 < origin_base:
            fx_direction = "strengthens_buying_power"
        else:
            fx_direction = "broadly_neutral"
    origin_currency = (case_inputs.get("current_currency") or "USD").upper()
    fx_pair = f"{origin_currency}/{currency}"

    risk_flags: list[dict[str, Any]] = []
    if surplus < 0:
        risk_flags.append(
            {
                "severity": "high" if affordability < 30 else "medium",
                "label": "Monthly deficit",
                "detail": f"Estimated deficit of {abs(surplus)} {currency}/month against take-home {take_home_monthly} {currency}.",
            }
        )
    if rent_share_pct >= 40:
        risk_flags.append(
            {
                "severity": "medium",
                "label": "High rent share of take-home",
                "detail": f"Housing is {rent_share_pct}% of take-home; sustainable bands are typically below 35%.",
            }
        )
    if surplus < 0 and runway < 6:
        risk_flags.append(
            {
                "severity": "high",
                "label": "Short runway",
                "detail": f"Savings cover only {runway} month(s) at the projected deficit; rebuild cash buffer before move.",
            }
        )
    if fx_direction == "weakens_buying_power":
        risk_flags.append(
            {
                "severity": "medium",
                "label": "FX drag",
                "detail": f"Buying power tends to weaken when moving from {origin_currency} to {currency}; budget conservatively.",
            }
        )
    if monthly_budget is not None and total_monthly > int(monthly_budget) * 1.15:
        risk_flags.append(
            {
                "severity": "medium",
                "label": "Over user-set budget",
                "detail": f"Estimated total cost of {total_monthly} {currency} exceeds the user's monthly_budget by >15%.",
            }
        )

    if surplus >= 0:
        verdict = (
            f"Workable in {target_city}: take-home {take_home_monthly} {currency} clears the "
            f"estimated household cost of {total_monthly} {currency} with a {surplus_pct_of_take_home}% surplus."
        )
    else:
        verdict = (
            f"Tight in {target_city}: estimated cost {total_monthly} {currency} exceeds take-home "
            f"{take_home_monthly} {currency} by {abs(surplus_pct_of_take_home)}%. Runway: {runway} month(s)."
        )

    return {
        "status": "ready",
        "score": affordability,
        "summary": verdict,
        "reasoning": (
            f"Annual gross {annual_gross} {currency} converts to a monthly take-home of "
            f"{take_home_monthly} {currency} after an estimated {tax_pct}% effective tax. "
            f"Household-of-{family_size} costs in {target_city} estimate at {total_monthly} {currency} "
            f"per month (housing {housing}, food {food}, other lines accounted). "
            f"That leaves a monthly {('surplus' if surplus >= 0 else 'deficit')} of {abs(surplus)} {currency}. "
            f"Affordability score: {affordability}/100."
        ),
        "risks": [
            {
                "severity": rf["severity"],
                "label": rf["label"],
                "detail": rf["detail"],
            }
            for rf in risk_flags[:3]
        ]
        or [
            {
                "severity": "low",
                "label": "Estimate volatility",
                "detail": "Tax and cost-of-living estimates are directional; treat as ±15% bands.",
            }
        ],
        "next_actions": [
            {
                "label": "Validate the rent estimate locally",
                "urgency": "this_week",
                "why": "Housing is the largest line and most variable across districts.",
            },
            {
                "label": "Lock a 6-month savings buffer before move-in",
                "urgency": "this_month",
                "why": "Covers tax-residency surprises and deposit-stacking on housing.",
            },
            {
                "label": "Scenario-test salary at +/-10%",
                "urgency": "later",
                "why": "Negotiation outcomes shift the affordability band materially.",
            },
        ],
        "confidence": 0.7,
        "assumptions": [
            {
                "label": f"Destination currency assumed {currency}",
                "detail": "Echoed from inputs or default for the destination country.",
                "source": "user" if currency_in else "default",
                "confidence": 0.85,
            },
            {
                "label": "Individual taxation assumed",
                "detail": "No treaty-credit or joint-filing modelling applied.",
                "source": "model",
                "confidence": 0.55,
            },
            {
                "label": f"Cost-of-living based on {target_city} city p50 estimates",
                "detail": "Districts and lifestyles can vary by 30%+ either way.",
                "source": "default",
                "confidence": 0.6,
            },
            {
                "label": f"Family size used: {family_size}",
                "detail": "Pulled from inputs; affects food / healthcare / childcare scaling.",
                "source": "user" if case_inputs.get("family_size") else "default",
                "confidence": 0.7,
            },
        ],
        "detail": {
            "monthly_net": {
                "gross_monthly": gross_monthly,
                "estimated_tax_monthly": estimated_tax_monthly,
                "take_home_monthly": take_home_monthly,
                "currency": currency,
                "effective_tax_rate_pct": tax_pct,
                "note": (
                    f"Effective rate ~{tax_pct}% reflects a single-filer, no-deductions baseline; "
                    "actual rate will vary with deductions and treaty credits."
                ),
            },
            "monthly_cost": {
                "housing": {
                    "label": "Housing",
                    "amount": housing,
                    "note": (
                        f"User-provided rent expectation of {rent_expectation} {currency}."
                        if rent_expectation
                        else f"Estimated p50 for a household of {family_size} in {target_city}."
                    ),
                },
                "utilities": {"label": "Utilities", "amount": utilities, "note": None},
                "food": {
                    "label": "Food",
                    "amount": food,
                    "note": "Scales with household size; assumes mostly home-cooked.",
                },
                "transport": {"label": "Transport", "amount": transport, "note": None},
                "healthcare": {
                    "label": "Healthcare",
                    "amount": healthcare,
                    "note": "Includes premium + typical out-of-pocket; varies by system.",
                },
                "childcare_or_education": {
                    "label": "Childcare or education",
                    "amount": childcare,
                    "note": (
                        "Not applicable for a household of one."
                        if family_size <= 1
                        else "Estimate assumes mid-band childcare / public schooling."
                    ),
                },
                "other": {"label": "Other (clothing, leisure, misc.)", "amount": other, "note": None},
                "total_monthly": total_monthly,
                "currency": currency,
            },
            "surplus_or_deficit_monthly": surplus,
            "affordability_score": affordability,
            "salary_to_expense_ratio": ratio,
            "savings_runway_months": runway,
            "fx_note": {
                "pair": fx_pair,
                "direction": fx_direction,
                "note": (
                    f"Cross-rate exposure between {origin_currency} and {currency} typically "
                    f"{fx_direction.replace('_', ' ')} for moves of this profile; budget conservatively."
                ),
            },
            "risk_flags": risk_flags,
            "headline_finding": verdict,
        },
    }


def _stub_family_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic family-relocation envelope.

    Honours the solo vs with_family mode hint computed in the service. In
    solo mode the artifact is short but valid. In family mode it walks the
    spouse / children / parents inputs to populate per-member outlooks.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    target_city = case_inputs.get("target_city") or profile.get("target_city") or "Berlin"
    moving_with_family = bool(case_inputs.get("moving_with_family"))

    spouse_in = case_inputs.get("spouse") or {}
    children_in = case_inputs.get("children") or []
    parents_in = case_inputs.get("parents") or {}
    housing_req = case_inputs.get("housing_requirement")
    budget_impact = case_inputs.get("family_budget_impact") or "medium"

    # ---- solo mode ---------------------------------------------------------
    if not moving_with_family:
        return {
            "status": "ready",
            "score": 90,
            "summary": (
                f"You're moving alone to {target_country}; the family-impact picture is simple."
            ),
            "reasoning": (
                f"No spouse, children, or dependent parents are relocating with you. "
                f"Household complexity is low and the destination's family infrastructure "
                f"isn't a relevant constraint for this move."
            ),
            "risks": [],
            "next_actions": [
                {
                    "label": "Document next-of-kin contact in destination",
                    "urgency": "this_month",
                    "why": "Useful for emergency services and visa paperwork even when moving alone.",
                }
            ],
            "confidence": 0.85,
            "assumptions": [
                {
                    "label": f"Destination assumed {target_country}",
                    "detail": "Echoed from profile / case inputs.",
                    "source": "user",
                    "confidence": 0.9,
                },
                {
                    "label": "Solo mode based on moving_with_family=false",
                    "source": "user",
                    "confidence": 0.95,
                },
            ],
            "detail": {
                "mode": "solo",
                "household_complexity_score": 10,
                "family_friendly_destination_fit": 90,
                "spouse": {
                    "moving": False,
                    "career_outlook": "not_applicable",
                    "visa_pathway": "Not applicable — no spouse relocating.",
                    "language_pressure": "low",
                    "support_needs": [],
                    "note": "Moving alone; no spouse considerations.",
                },
                "children": [],
                "parents": {
                    "moving": False,
                    "dependency_level": "none",
                    "healthcare_fit": "not_applicable",
                    "visa_options": [],
                    "care_recommendations": [],
                    "note": "No dependent parents relocating.",
                },
                "housing_fit": {
                    "pressure": "low",
                    "recommendation": (
                        f"For a single occupant in {target_city}, a 1BR or shared rental is "
                        "the most cost-effective starting point; expect 2–4 weeks to secure."
                    ),
                    "typical_lead_time_weeks": 4,
                },
                "warnings": [],
                "suggestions": [
                    {
                        "label": "Set up an emergency contact in destination",
                        "detail": "Useful for paperwork and unexpected events when family is far.",
                        "urgency": "this_month",
                    }
                ],
            },
        }

    # ---- with_family mode --------------------------------------------------
    spouse_moving = bool(spouse_in.get("moving"))
    spouse_has_career = bool(spouse_in.get("has_career"))
    spouse_profession = spouse_in.get("profession")

    parents_moving = bool(parents_in.get("moving"))
    parents_dep = parents_in.get("dependency_level") or "none"
    parents_health = parents_in.get("healthcare_sensitivity") or "low"

    n_children = len([c for c in children_in if c])

    # complexity scoring (0–100 — higher = more complex)
    complexity = 25
    if spouse_moving:
        complexity += 15 if spouse_has_career else 10
    complexity += min(40, 12 * n_children)
    if parents_moving:
        complexity += {"none": 0, "low": 8, "medium": 15, "high": 25, "full_dependency": 35}.get(
            parents_dep, 10
        )
    if budget_impact == "high":
        complexity += 8
    complexity = max(0, min(100, complexity))

    # destination friendliness scoring (0–100 — higher = more family-friendly)
    eu_family_friendly = {"DE", "NL", "DK", "FI", "SE", "AT", "BE", "IE", "PT", "ES", "FR", "IT"}
    if target_country in eu_family_friendly:
        friendly = 78
    elif target_country in {"CA", "AU", "GB", "JP"}:
        friendly = 72
    elif target_country in {"US"}:
        friendly = 65
    elif target_country in {"AE", "SG"}:
        friendly = 60
    else:
        friendly = 60
    if parents_moving and parents_dep in ("high", "full_dependency"):
        friendly -= 15  # dependent parents are universally hard
    if n_children >= 2:
        friendly -= 5
    friendly = max(20, min(100, friendly))

    # spouse outlook
    if spouse_moving:
        if spouse_has_career:
            career_outlook = "tight" if spouse_in.get("work_visa_required") else "workable"
            spouse_visa = (
                "Most skilled-worker routes admit dependents on a spouse visa with limited "
                "or full work rights, depending on the destination."
            )
            language_pressure = "medium"
            support_needs = [
                "Local recruiter introductions",
                "Credential recognition path" if spouse_profession else "Profession scoping session",
                "Spouse-network meetup",
            ]
            note = (
                f"Your spouse{(' (' + spouse_profession + ')') if spouse_profession else ''} "
                f"will need a parallel job pipeline; treat it as a co-equal track."
            )
        else:
            career_outlook = "strong"
            spouse_visa = (
                "Dependent visa is straightforward; full residence rights typically follow the principal."
            )
            language_pressure = "low"
            support_needs = ["Local-language taster", "Settlement orientation"]
            note = "Your spouse is moving without a career constraint; integration is the main focus."
    else:
        career_outlook = "not_applicable"
        spouse_visa = "Not applicable — spouse not relocating with this move."
        language_pressure = "low"
        support_needs = []
        note = "Your spouse is not relocating; consider visit-frequency planning instead."

    spouse_outlook = {
        "moving": spouse_moving,
        "career_outlook": career_outlook,
        "visa_pathway": spouse_visa,
        "language_pressure": language_pressure,
        "support_needs": support_needs,
        "note": note,
    }

    # children outlooks
    children_out: list[dict[str, Any]] = []
    for c in children_in:
        if not c:
            continue
        age = int(c.get("age") or 0)
        need = c.get("schooling_need") or "primary"
        if age <= 4:
            rec = "Daycare or preschool with English/local-language mix; expect 4–8 week waitlist."
            options = ["International daycare", "Bilingual preschool"]
            integration = 6
        elif age <= 11:
            rec = (
                f"Bilingual or international primary near {target_city}; "
                "expect 6–12 week admissions process."
            )
            options = ["International school", "Bilingual public", "Local public + tutor"]
            integration = 9
        elif age <= 17:
            rec = (
                f"International or IB programme near {target_city} for continuity; "
                "private intake windows close 4–6 months ahead."
            )
            options = ["IB programme", "British curriculum", "American curriculum"]
            integration = 12
        else:
            rec = "Tertiary track — confirm institution recognition for transcripts and entry."
            options = ["Public university", "Private university"]
            integration = 6

        if need == "special_needs":
            rec = (
                "Special-needs schooling requires advance liaison with the destination's "
                "education authority — start 6+ months early."
            )
            options = ["State special-needs programme", "Private specialist school"]
            integration = max(integration, 12)

        children_out.append(
            {
                "age": age,
                "schooling_recommendation": rec,
                "school_options": options,
                "language_pressure": "high" if age >= 6 else "medium",
                "integration_estimate_months": integration,
                "notes": c.get("notes"),
            }
        )

    # parents outlook
    if parents_moving:
        healthcare_fit = (
            "tight" if parents_health == "high" else "workable" if parents_health == "medium" else "strong"
        )
        visa_opts = ["Dependent / family-reunion visa", "Long-term visit visa (rolling)"]
        care = [
            "Identify a GP within 2 km of housing",
            "Confirm chronic-medication availability locally",
        ]
        if parents_dep in ("high", "full_dependency"):
            care.append("Engage a home-care service to assess needs on arrival")
        parents_note = (
            f"Dependent parents bring the highest healthcare burden — prioritise a GP-near-housing "
            f"strategy and confirm specialist availability."
            if parents_dep in ("high", "full_dependency")
            else f"Parents moving with {parents_dep} dependency; focus on routine-care continuity."
        )
    else:
        healthcare_fit = "not_applicable"
        visa_opts = []
        care = []
        parents_note = "Parents are not relocating with this move."

    parents_outlook = {
        "moving": parents_moving,
        "dependency_level": parents_dep,
        "healthcare_fit": healthcare_fit,
        "visa_options": visa_opts,
        "care_recommendations": care,
        "note": parents_note,
    }

    # housing
    if n_children >= 2 or parents_moving:
        housing_pressure = "high"
        housing_lead = 10
        housing_rec = (
            f"Family-sized rentals in {target_city} are tight; budget 8–12 weeks lead time and consider "
            "interim furnished housing for the first 6 weeks."
        )
    elif n_children == 1 or spouse_moving:
        housing_pressure = "medium"
        housing_lead = 6
        housing_rec = (
            f"A 2–3 bedroom near schools and transit in {target_city}; expect 4–8 weeks to secure."
        )
    else:
        housing_pressure = "low"
        housing_lead = 4
        housing_rec = f"A 1–2 bedroom in {target_city} is achievable in 2–4 weeks."

    # warnings + suggestions
    warnings: list[dict[str, Any]] = []
    if n_children >= 1:
        warnings.append(
            {
                "severity": "medium",
                "label": "School admissions windows",
                "detail": "Most international schools cap admissions 3–6 months before term start.",
                "affects": "children",
            }
        )
    if parents_moving and parents_dep in ("high", "full_dependency"):
        warnings.append(
            {
                "severity": "high",
                "label": "Dependent parent care continuity",
                "detail": "Specialist appointments may take 6–12 weeks to establish on arrival.",
                "affects": "parents",
            }
        )
    if spouse_moving and spouse_has_career and spouse_in.get("work_visa_required"):
        warnings.append(
            {
                "severity": "medium",
                "label": "Spouse work-visa pacing",
                "detail": "Some dependent visas grant work rights only after registration formalities.",
                "affects": "spouse",
            }
        )
    if housing_pressure == "high":
        warnings.append(
            {
                "severity": "medium",
                "label": "Family-housing scarcity",
                "detail": "3-bed-plus rentals in central districts are the tightest segment.",
                "affects": "housing",
            }
        )
    if budget_impact == "high":
        warnings.append(
            {
                "severity": "medium",
                "label": "Family budget strain",
                "detail": "User flagged budget impact as high; prioritise schooling fee planning.",
                "affects": "finance",
            }
        )

    suggestions: list[dict[str, Any]] = [
        {
            "label": "Pre-register schools and daycare",
            "detail": "Submit applications 4–6 months before move for choice of catchments.",
            "urgency": "this_month",
        },
        {
            "label": "Book interim furnished housing",
            "detail": "Buys 6–8 weeks of flexibility while you secure long-term housing.",
            "urgency": "this_month",
        },
    ]
    if spouse_moving and spouse_has_career:
        suggestions.append(
            {
                "label": "Start spouse job pipeline in parallel",
                "detail": "Treat the spouse's role search as a co-equal track from week one.",
                "urgency": "this_week",
            }
        )
    if parents_moving:
        suggestions.append(
            {
                "label": "Map healthcare options near target neighbourhood",
                "detail": "Anchor housing search to GPs and specialists, not just transit.",
                "urgency": "this_week",
            }
        )

    summary_bits = []
    if spouse_moving:
        summary_bits.append("spouse")
    if n_children:
        summary_bits.append(f"{n_children} child" + ("ren" if n_children > 1 else ""))
    if parents_moving:
        summary_bits.append("parents")
    bits_text = ", ".join(summary_bits) or "household"

    return {
        "status": "ready",
        "score": friendly,
        "summary": (
            f"Moving with {bits_text} to {target_country}; household complexity is "
            f"{('low' if complexity < 35 else 'moderate' if complexity < 65 else 'high')}, "
            f"and {target_country} sits at {friendly}/100 on family fit."
        ),
        "reasoning": (
            f"Your household includes {bits_text}. {target_country} scores {friendly}/100 on "
            f"family-friendliness with {('strong' if friendly > 75 else 'workable' if friendly > 60 else 'tight')} "
            f"infrastructure for schooling, healthcare, and family housing in {target_city}. "
            f"Complexity is driven primarily by "
            f"{('dependent parents' if parents_moving and parents_dep in ('high', 'full_dependency') else 'children and schooling' if n_children else 'spouse career planning' if spouse_moving and spouse_has_career else 'household setup')}."
        ),
        "risks": [
            {
                "severity": "high" if complexity > 65 else "medium",
                "label": "Move complexity compounds delays",
                "detail": "Family moves have more dependencies; one delay (visa, school, housing) cascades.",
            }
        ],
        "next_actions": [
            {
                "label": "Lock the school strategy first",
                "urgency": "this_week" if n_children else "this_month",
                "why": "School admissions drive housing location and timeline; everything else fits around them.",
            },
            {
                "label": "Confirm dependent visa pathways for everyone moving",
                "urgency": "this_week",
                "why": "Avoids surprises late in the application process.",
            },
            {
                "label": "Plan a 6-week interim-housing buffer",
                "urgency": "this_month",
                "why": "Long-term family rentals routinely take 8–12 weeks to secure.",
            },
        ],
        "confidence": 0.7,
        "assumptions": [
            {
                "label": f"Destination assumed {target_country}",
                "detail": "Echoed from profile / case inputs.",
                "source": "user",
                "confidence": 0.9,
            },
            {
                "label": "Schooling system assumed (international + bilingual public)",
                "detail": "Specific catchment areas and waitlists vary; confirm before locking housing.",
                "source": "default",
                "confidence": 0.6,
            },
            {
                "label": "Healthcare fit is directional, not booked",
                "detail": "Specific provider availability requires on-the-ground confirmation.",
                "source": "model",
                "confidence": 0.55,
            },
            {
                "label": "Housing requirement assumed from household composition",
                "detail": (housing_req or "Inferred from spouse + children + parents counts."),
                "source": "user" if housing_req else "inferred",
                "confidence": 0.65,
            },
        ],
        "detail": {
            "mode": "with_family",
            "household_complexity_score": complexity,
            "family_friendly_destination_fit": friendly,
            "spouse": spouse_outlook,
            "children": children_out,
            "parents": parents_outlook,
            "housing_fit": {
                "pressure": housing_pressure,
                "recommendation": housing_rec,
                "typical_lead_time_weeks": housing_lead,
            },
            "warnings": warnings,
            "suggestions": suggestions,
        },
    }


def _stub_visa_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic visa-direction envelope keyed off real case inputs.

    Picks a plausible primary route per (nationality, target_country) family
    and modulates difficulty based on whether the user already holds a visa
    or needs sponsorship. Designed so tests that lock in the contract pass
    deterministically while production will swap to Vertex.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}

    target = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    nationality = (
        case_inputs.get("nationality") or profile.get("nationality") or "IN"
    ).upper()
    current_visa = case_inputs.get("current_visa_status") or profile.get(
        "current_visa_status"
    )
    sponsor_required = bool(case_inputs.get("sponsor_required"))
    family = bool(case_inputs.get("family_relocation"))
    employment_status = case_inputs.get("employment_status") or "employed"
    industry = profile.get("industry") or "Software"

    # Route map per common destination clusters. Not authoritative — this is
    # only the deterministic stub used in tests.
    eu = {"DE", "NL", "FR", "IE", "ES", "PT", "AT", "BE", "DK", "FI", "SE", "IT"}
    if target in eu:
        route_name = "EU Blue Card"
        code = "Directive 2009/50/EC"
        proc_min, proc_max = 8, 14
        family_friendly = True
    elif target == "GB":
        route_name = "Skilled Worker visa"
        code = "Tier 2 (Skilled Worker)"
        proc_min, proc_max = 3, 8
        family_friendly = True
    elif target == "CA":
        route_name = "Express Entry — Federal Skilled Worker"
        code = "Express Entry"
        proc_min, proc_max = 16, 28
        family_friendly = True
    elif target == "AU":
        route_name = "Skilled Independent visa (subclass 189)"
        code = "189"
        proc_min, proc_max = 24, 52
        family_friendly = True
    elif target == "AE":
        route_name = "Standard Employment (Work) Permit"
        code = "MoHRE Work Permit"
        proc_min, proc_max = 4, 8
        family_friendly = False
    elif target == "US":
        route_name = "H-1B Specialty Occupation"
        code = "H-1B"
        proc_min, proc_max = 12, 36
        family_friendly = True
    else:
        route_name = "General Skilled Worker route"
        code = None
        proc_min, proc_max = 8, 20
        family_friendly = True

    # Difficulty: starts medium; drops a notch if the user already holds a
    # local visa, climbs a notch for US/AU/AE, and climbs a notch when
    # sponsorship is required without an offer in hand.
    difficulty_levels = ["low", "medium", "high", "very_high"]

    def shift(idx: int, delta: int) -> int:
        return max(0, min(len(difficulty_levels) - 1, idx + delta))

    base_idx = 1  # medium
    if current_visa:
        base_idx = shift(base_idx, -1)
    if target in {"US", "AU", "AE"}:
        base_idx = shift(base_idx, +1)
    if sponsor_required and employment_status != "employed":
        base_idx = shift(base_idx, +1)
    difficulty = difficulty_levels[base_idx]

    score_for_difficulty = {"low": 88, "medium": 70, "high": 52, "very_high": 35}[difficulty]

    requirements = [
        {
            "label": "Valid passport (12+ months remaining)",
            "detail": "Most authorities require >=12 months of passport validity at submission.",
            "user_meets": "unknown",
        },
        {
            "label": "Recognised qualifications or equivalent experience",
            "detail": "A bachelor's degree or 5+ years of relevant experience is the typical bar.",
            "user_meets": "yes" if (profile.get("years_experience") or 0) >= 5 else "partial",
        },
        {
            "label": "Salary threshold meeting the route's minimum",
            "detail": "Most skilled-worker routes have a national or sector-specific salary floor.",
            "user_meets": "yes"
            if (profile.get("expected_salary") or 0) >= 45000
            else "unknown",
        },
    ]
    if sponsor_required:
        requirements.append(
            {
                "label": "Job offer from a sponsor-licensed employer",
                "detail": "Offer letter on the destination's licensed-sponsor list is the gating item.",
                "user_meets": "no",
            }
        )

    blockers: list[dict[str, Any]] = []
    if sponsor_required:
        blockers.append(
            {
                "label": "No employer offer in hand",
                "severity": "high",
                "detail": "The route is sponsor-driven; offer is the long-pole item.",
                "fixable": True,
                "fixable_in_weeks": 16,
            }
        )
    if not current_visa and target == "US":
        blockers.append(
            {
                "label": "H-1B annual cap and lottery exposure",
                "severity": "high",
                "detail": "Annual cap means the timing is partly out of the user's control.",
                "fixable": False,
                "fixable_in_weeks": None,
            }
        )
    if family:
        blockers.append(
            {
                "label": "Dependent visas add documentation surface",
                "severity": "medium",
                "detail": "Spouse and dependent visas require additional financial-proof and accommodation evidence.",
                "fixable": True,
                "fixable_in_weeks": 6,
            }
        )

    fixable = [b for b in blockers if b["fixable"]]

    dependencies: list[dict[str, Any]] = [
        {
            "requirement": "Apostilled education certificates",
            "depends_on": "Notary + apostille office turnaround in origin country",
            "status": "unknown",
        },
        {
            "requirement": "English/local-language test (where required)",
            "depends_on": "Test booking availability",
            "status": "unknown",
        },
    ]
    if sponsor_required:
        dependencies.append(
            {
                "requirement": "Sponsor offer letter",
                "depends_on": "Job-fit pipeline outcome",
                "status": "need",
                "note": "This is the long-pole item.",
            }
        )

    alternatives: list[dict[str, Any]] = []
    if target in eu:
        alternatives.append(
            {
                "name": "National skilled-worker visa (non-Blue-Card)",
                "difficulty": "medium",
                "why_consider": "Lower salary threshold; broader eligibility for non-degree holders.",
            }
        )
    if target in {"NL", "DE", "PT"}:
        alternatives.append(
            {
                "name": "Highly Skilled Migrant scheme",
                "difficulty": "low",
                "why_consider": "Faster processing if the employer is on the IND/equivalent register.",
            }
        )
    if target == "US":
        alternatives.append(
            {
                "name": "O-1 Extraordinary Ability",
                "difficulty": "high",
                "why_consider": "Avoids the H-1B lottery for users with strong evidence of distinction.",
            }
        )

    proc_label = f"{proc_min}–{proc_max} weeks"

    risk_severity = "high" if difficulty in ("high", "very_high") else "medium" if sponsor_required else "low"

    return {
        "status": "ready",
        "score": score_for_difficulty,
        "summary": (
            f"{route_name} is the most realistic direction for a {nationality} national moving to {target}; "
            f"difficulty: {difficulty.replace('_', ' ')}."
        ),
        "reasoning": (
            f"Given nationality ({nationality}), destination ({target}), and "
            f"{'an existing local visa status' if current_visa else 'no current visa status'}, "
            f"the typical pathway for {industry} workers is the {route_name}. "
            f"Sponsorship is {'required' if sponsor_required else 'not strictly required'}; "
            f"family relocation is {'in scope' if family else 'not requested'}. "
            f"Processing window is roughly {proc_label} once the application is filed."
        ),
        "risks": [
            {
                "severity": risk_severity,
                "label": "Programme criteria can change",
                "detail": "Visa rules update frequently; plan for a 4–8 week buffer.",
            }
        ],
        "next_actions": [
            {
                "label": "Verify passport validity (12+ months)",
                "urgency": "this week",
                "why": "Universal gating item across nearly every route.",
            },
            {
                "label": "Map sponsor-licensed employers in target country",
                "urgency": "this week" if sponsor_required else "next month",
                "why": "Anchors the rest of the application timeline.",
            },
            {
                "label": "Consult a licensed immigration adviser",
                "urgency": "before submitting",
                "why": "Confirms the route choice and reviews edge cases for your situation.",
            },
        ],
        "confidence": 0.7,
        "assumptions": [
            {
                "label": f"Nationality assumed as {nationality}",
                "detail": "Echoed from profile / case inputs.",
                "source": "user" if case_inputs.get("nationality") else "default",
                "confidence": 0.8,
            },
            {
                "label": "Visa route inferred, not confirmed",
                "detail": "Direction only; not legal advice.",
                "source": "model",
                "confidence": 0.55,
            },
            {
                "label": "Family relocation default",
                "detail": "Defaulted to false when not provided.",
                "source": "default" if case_inputs.get("family_relocation") is None else "user",
                "confidence": 0.6,
            },
        ],
        "detail": {
            "primary_route": {
                "name": route_name,
                "code": code,
                "difficulty": difficulty,
                "typical_processing_weeks_min": proc_min,
                "typical_processing_weeks_max": proc_max,
                "sponsor_required": sponsor_required,
                "family_friendly": family_friendly,
                "requirements": requirements,
                "rationale": (
                    f"This route is the highest-volume pathway for {nationality} nationals into {target} "
                    f"in {industry}-adjacent roles; programme details should be confirmed with an adviser."
                ),
            },
            "route_difficulty": difficulty,
            "typical_processing_time_label": proc_label,
            "alternative_routes": alternatives,
            "blockers": blockers,
            "fixable_blockers": fixable,
            "dependencies": dependencies,
            "legal_disclaimer": (
                "This is directional guidance, not legal advice. Visa rules change "
                "frequently and depend on your specific situation. Consult a licensed "
                "immigration adviser before making decisions or submitting applications."
            ),
        },
    }


def _stub_country_comparison_envelope(user_text: str) -> dict[str, Any]:
    """Build a deterministic, schema-valid country-comparison envelope.

    Reads the actual `current_country` / `target_country` out of the input
    payload so the response is recognisably tied to the case.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
        case_inputs = payload.get("case_inputs") or {}
    except Exception:
        case_inputs = {}

    origin_country = (case_inputs.get("current_country") or "IN").upper()
    origin_city = case_inputs.get("current_city") or "Bengaluru"
    dest_country = (case_inputs.get("target_country") or "DE").upper()
    dest_city = case_inputs.get("target_city") or "Berlin"
    alternatives = [a.upper() for a in (case_inputs.get("alternatives") or [])][:3]

    def paired(o: int, d: int, note: str) -> dict[str, Any]:
        return {"origin": o, "destination": d, "delta": d - o, "note": note}

    return {
        "status": "ready",
        "score": 72,
        "summary": (
            f"{dest_country} looks materially stronger than {origin_country} for this user "
            "given the visa-friendly job market and salary uplift, with housing as the chief friction."
        ),
        "reasoning": (
            f"The user's role and experience map to in-demand titles in {dest_country}, where the "
            "destination's job-market score (78) clearly beats the origin's (55). Visa access is "
            "easier under the destination's skilled-worker route, and language fit is a soft blocker "
            "rather than a hard one. Cost-of-living is higher but salary uplift dominates."
        ),
        "risks": [
            {
                "severity": "medium",
                "label": "Housing pressure in capital",
                "detail": "Capital city rentals are tight; expect 6–10 weeks to secure a longer-term lease.",
            }
        ],
        "next_actions": [
            {
                "label": "Confirm visa route eligibility",
                "urgency": "now",
                "why": "Anchors the rest of the plan and unblocks the document checklist.",
            },
            {
                "label": "Run a salary-realism check for the target city",
                "urgency": "this week",
                "why": "Validates the financial assumption underpinning the comparison.",
            },
        ],
        "confidence": 0.72,
        "assumptions": [
            {
                "label": "Destination city defaulted to capital",
                "detail": "No `target_city` was supplied; capital used as a representative reference.",
                "source": "default",
                "confidence": 0.6,
            },
            {
                "label": "Visa route inferred, not confirmed",
                "detail": "Direction only; not legal advice.",
                "source": "model",
                "confidence": 0.55,
            },
        ],
        "detail": {
            "origin": {"country": origin_country, "city": origin_city},
            "destination": {"country": dest_country, "city": dest_city},
            "overall_comparison_score": 72,
            "destination_suitability_score": 75,
            "origin_pressure_score": 60,
            "access_points": {
                "job_market_access": paired(55, 78, f"More open roles for this profile in {dest_country}."),
                "visa_access": paired(40, 70, "Skilled-worker route is well-trodden for this profile."),
                "housing_pressure": paired(60, 45, "Capital rentals are tighter than origin city."),
                "healthcare_access": paired(55, 80, "Public+private mix in destination is broader."),
                "schooling_access": paired(60, 70, "International schools available; waitlists vary."),
                "cultural_fit": paired(70, 65, "Workplace norms differ but adaptation is well-mapped."),
                "language_fit": paired(85, 50, "Destination requires basic local-language effort."),
            },
            "strengths": [
                {
                    "title": "Strong job-market uplift",
                    "detail": "Destination has materially more open roles for this seniority and skill set.",
                    "side": "destination",
                },
                {
                    "title": "Visa route is well-mapped",
                    "detail": "Profile fits the destination's primary skilled-worker pathway.",
                    "side": "destination",
                },
            ],
            "blockers": [
                {
                    "title": "Language fit gap",
                    "detail": "Day-to-day life is reachable with English; long-term integration benefits from A2/B1.",
                    "side": "destination",
                }
            ],
            "comparison_summary": (
                f"Compared to {origin_country}, {dest_country} offers a stronger job market for this "
                "user's profile and a clearer visa pathway, while the cost of living is higher and "
                "language is a soft blocker rather than a hard one. Origin pressure is moderate: "
                "the user is employable at home but compensation and growth ceiling are lower. "
                "Net of trade-offs, the destination wins on the dimensions the user has prioritised."
            ),
            "alternatives_considered": [
                {
                    "country": alt,
                    "headline": f"{alt} is a viable alternative on cost; lower job-density.",
                    "fit_score": 60,
                }
                for alt in alternatives
            ],
        },
    }


def _stub_workflow_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic workflow graph keyed off the case + prior analyses.

    Composes a believable DAG:
      - Always-include core: passport_check → visa_route_decide → visa_application
        → flight_booking → arrival_registration → bank_account
      - Documents: cv_polish, education_apostille (gates visa_application when
        the user reports missing transcripts)
      - Jobs: job_search → job_offer (skipped if needs_visa_sponsorship is
        false AND no jobfit prior).
      - Family: family_visa_application + school_admission when family signals
        appear in profile or prior analyses.
      - Finance: fx_transfer when financial-feasibility prior had risk.

    Status flows from `current_document_status` (PASSPORT done if present,
    blocked otherwise) and from prior_analyses summaries.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}
    prior = payload.get("prior_analyses") or []

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    nationality = (
        case_inputs.get("nationality") or profile.get("nationality") or "IN"
    ).upper()
    needs_sponsor = bool(
        case_inputs.get("needs_visa_sponsorship")
        if case_inputs.get("needs_visa_sponsorship") is not None
        else profile.get("needs_visa_sponsorship")
    )
    move_urgency = case_inputs.get("move_urgency") or profile.get("move_urgency") or "flex"
    docs = case_inputs.get("current_document_status") or profile.get("current_document_status") or {}

    def _has(kind: str) -> bool:
        item = docs.get(kind) if isinstance(docs, dict) else None
        return bool(item and item.get("has"))

    has_passport = _has("PASSPORT")
    has_transcripts = _has("EDUCATION_TRANSCRIPTS")
    has_marriage = _has("MARRIAGE_CERT")

    # Detect family / financial signals from prior analyses summaries.
    prior_kinds = {p.get("kind") for p in prior}
    family_summary = next(
        (p for p in prior if p.get("kind") == "family"), {}
    )
    finance_summary = next(
        (p for p in prior if p.get("kind") == "finance"), {}
    )
    visa_summary = next(
        (p for p in prior if p.get("kind") == "visa"), {}
    )
    moving_with_family = (
        bool(family_summary)
        and ("with family" in (family_summary.get("summary") or "").lower()
             or "household" in (family_summary.get("summary") or "").lower())
    ) or has_marriage

    finance_risky = bool(finance_summary) and (finance_summary.get("score") or 100) < 60
    visa_hard = bool(visa_summary) and (visa_summary.get("score") or 100) < 55

    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    blocked: list[str] = []

    def add_node(
        nid: str,
        label: str,
        category: str,
        status: str,
        owner: str,
        d_min: int,
        d_max: int,
        description: str,
        blocked_reason: str | None = None,
    ) -> None:
        n: dict[str, Any] = {
            "id": nid,
            "label": label,
            "category": category,
            "status": status,
            "owner": owner,
            "estimated_duration_days_min": d_min,
            "estimated_duration_days_max": d_max,
            "description": description,
        }
        if blocked_reason is not None:
            n["blocked_reason"] = blocked_reason
        nodes.append(n)
        if status == "blocked":
            blocked.append(nid)

    def add_edge(a: str, b: str, reason: str, hard: bool = True) -> None:
        edges.append({"from_node": a, "to_node": b, "reason": reason, "hard": hard})

    # --- documents column ---
    add_node(
        "passport_check",
        "Verify passport validity",
        "documents",
        "done" if has_passport else "blocked",
        "user",
        1, 7,
        "Confirm passport has at least 12 months validity beyond planned arrival.",
        blocked_reason=None if has_passport else "User does not yet hold a valid passport.",
    )
    add_node(
        "cv_polish",
        "Polish CV for target market",
        "documents",
        "in_progress",
        "user",
        3, 10,
        f"Tailor CV to {target_country} formatting conventions and job-market norms.",
    )
    if not has_transcripts:
        add_node(
            "education_apostille",
            "Apostille / attest education transcripts",
            "documents",
            "blocked",
            "user",
            14, 45,
            "Get academic transcripts apostilled and translated where required.",
            blocked_reason="Education transcripts not yet collected from the issuing institution.",
        )

    # --- visa column ---
    add_node(
        "visa_route_decide",
        "Confirm primary visa route",
        "visa",
        "in_progress" if visa_summary else "not_started",
        "adviser",
        7, 21,
        f"Confirm the most realistic route for a {nationality} national moving to {target_country}.",
    )
    add_node(
        "visa_application",
        "File visa application",
        "visa",
        "not_started",
        "user",
        28, 84 if not visa_hard else 120,
        "Submit the application package and pay government fees.",
    )
    add_edge("passport_check", "visa_application", "Visa packet requires a valid passport.", True)
    add_edge("visa_route_decide", "visa_application", "Cannot file before route is confirmed.", True)
    if not has_transcripts:
        add_edge(
            "education_apostille",
            "visa_application",
            "Most skilled-worker routes require apostilled education docs.",
            True,
        )

    # --- jobs column ---
    if needs_sponsor or "jobfit" in prior_kinds:
        add_node(
            "job_search",
            "Search sponsor-licensed employers",
            "jobs",
            "in_progress",
            "user",
            30, 120,
            "Map sponsor-licensed employers and apply for relevant roles.",
        )
        add_node(
            "job_offer",
            "Secure job offer",
            "jobs",
            "not_started",
            "employer",
            14, 60,
            "Negotiate salary and obtain a signed contract.",
        )
        add_edge("cv_polish", "job_search", "Job search needs a market-ready CV.", True)
        add_edge("job_search", "job_offer", "Offer follows interviews.", True)
        add_edge(
            "job_offer",
            "visa_application",
            "Sponsorship-based visas require a confirmed offer.",
            True,
        )

    # --- family column ---
    if moving_with_family:
        add_node(
            "family_visa_application",
            "File dependent visa applications",
            "family",
            "not_started",
            "user",
            21, 63,
            "Prepare and file dependent / family-reunification applications.",
        )
        add_edge(
            "visa_application",
            "family_visa_application",
            "Dependent applications usually attach to the principal's case.",
            True,
        )
        add_node(
            "school_admission",
            "Secure school admission",
            "family",
            "not_started",
            "user",
            30, 120,
            "Apply to schools in the destination city; expect waitlists.",
        )
        add_edge(
            "family_visa_application",
            "school_admission",
            "Schools usually require visa proof to confirm admission.",
            False,
        )

    # --- finance column ---
    if finance_risky:
        add_node(
            "fx_transfer",
            "Plan FX transfer & runway",
            "finance",
            "not_started",
            "user",
            7, 30,
            "Build a 2–3 month runway in the destination currency to cover deposits and gaps.",
        )
        add_edge(
            "visa_application",
            "fx_transfer",
            "Time the transfer to the visa decision to avoid currency exposure.",
            False,
        )

    # --- logistics + arrival ---
    add_node(
        "flight_booking",
        "Book flights & temporary stay",
        "logistics",
        "not_started",
        "user",
        1, 14,
        "Book one-way flights and 30-day temporary accommodation.",
    )
    add_edge(
        "visa_application",
        "flight_booking",
        "Don't book one-way travel before the visa is granted.",
        False,
    )
    add_node(
        "arrival_registration",
        "Register address on arrival",
        "arrival",
        "not_started",
        "government",
        1, 21,
        "Register your address with local authorities within the legal window.",
    )
    add_edge(
        "flight_booking",
        "arrival_registration",
        "Address registration happens after physical arrival.",
        True,
    )
    add_node(
        "bank_account",
        "Open local bank account",
        "arrival",
        "not_started",
        "user",
        1, 14,
        "Open a local bank account; salary credit is usually contingent on this.",
    )
    add_edge(
        "arrival_registration",
        "bank_account",
        "Most banks require proof of address registration.",
        True,
    )

    node_ids = {n["id"] for n in nodes}

    # Critical path: roughly the longest dependency chain by max duration.
    # Walk forward from passport_check toward bank_account, picking the
    # heaviest path. We do a small DP since the graph is tiny.
    adj: dict[str, list[tuple[str, int]]] = {nid: [] for nid in node_ids}
    dur_max = {n["id"]: n["estimated_duration_days_max"] for n in nodes}
    for e in edges:
        adj[e["from_node"]].append((e["to_node"], dur_max[e["to_node"]]))

    # Compute longest path ending at each node via memoised DFS.
    memo: dict[str, tuple[int, list[str]]] = {}

    def best(nid: str) -> tuple[int, list[str]]:
        if nid in memo:
            return memo[nid]
        best_len = 0
        best_path: list[str] = []
        for nxt, _ in adj[nid]:
            sub_len, sub_path = best(nxt)
            if sub_len > best_len:
                best_len = sub_len
                best_path = sub_path
        result = (dur_max[nid] + best_len, [nid, *best_path])
        memo[nid] = result
        return result

    # Find the global longest path.
    longest_len = 0
    critical_path: list[str] = [nodes[0]["id"]]
    for n in nodes:
        length, path = best(n["id"])
        if length > longest_len:
            longest_len = length
            critical_path = path

    # Current stage: first non-blocked, not-done node on the critical path.
    current_stage = critical_path[0]
    for nid in critical_path:
        n = next(n for n in nodes if n["id"] == nid)
        if n["status"] in ("not_started", "in_progress"):
            current_stage = nid
            break

    total_min = sum(n["estimated_duration_days_min"] for n in nodes if n["id"] in critical_path)
    total_max = sum(n["estimated_duration_days_max"] for n in nodes if n["id"] in critical_path)

    urgency_note = (
        "User flagged the move as urgent; consider compressing soft-edge gaps."
        if move_urgency in ("urgent", "now", "asap")
        else "Move urgency is flexible; sequence tasks conservatively."
    )

    return {
        "status": "ready",
        "score": 70 if not blocked else 55,
        "summary": (
            f"The relocation plan to {target_country} centres on a {len(nodes)}-step workflow; "
            f"{len(blocked)} blocking item(s) need clearing before the visa application can proceed."
        ),
        "reasoning": (
            f"For a {nationality} national targeting {target_country}, the critical path runs through "
            f"{', '.join(critical_path)}. {urgency_note} "
            f"Sponsorship is {'required' if needs_sponsor else 'not required'}, which "
            f"{'pulls the job search forward' if needs_sponsor else 'frees the visa decision from employer timing'}. "
            f"Family relocation is {'in scope' if moving_with_family else 'not in scope'}, "
            f"and finance is {'flagged for FX planning' if finance_risky else 'not currently a critical path driver'}."
        ),
        "risks": [
            {
                "severity": "high" if blocked else "medium",
                "label": "Document blockers gate the visa filing",
                "detail": (
                    "Any incomplete document on the critical path will push the entire plan back "
                    "by the documents-prep duration."
                ),
            },
            {
                "severity": "medium",
                "label": "Soft edges hide risk if pulled forward",
                "detail": (
                    "Booking flights or arranging shipping before the visa decision can lose money "
                    "if the timeline slips."
                ),
            },
        ],
        "next_actions": [
            {
                "label": "Clear the next blocker on the critical path",
                "urgency": "this week",
                "why": "The visa application cannot start until upstream documents are in hand.",
            },
            {
                "label": "Confirm the visa route with a licensed adviser",
                "urgency": "this week",
                "why": "Locks the rest of the workflow's assumptions.",
            },
        ],
        "confidence": 0.7,
        "assumptions": [
            {
                "label": f"Target country assumed as {target_country}",
                "detail": "Echoed from profile / case inputs.",
                "source": "user" if case_inputs.get("target_country") else "default",
                "confidence": 0.9,
            },
            {
                "label": (
                    "Family relocation in scope" if moving_with_family else "Solo relocation assumed"
                ),
                "detail": (
                    "Inferred from prior family analysis or profile signals."
                    if moving_with_family
                    else "No spouse / children signals detected; defaulted to solo."
                ),
                "source": "inferred",
                "confidence": 0.6,
            },
            {
                "label": (
                    "Finance flagged FX risk" if finance_risky else "Finance not on critical path"
                ),
                "detail": "Derived from the financial-feasibility analysis score, if available.",
                "source": "inferred",
                "confidence": 0.55,
            },
        ],
        "detail": {
            "nodes": nodes,
            "edges": edges,
            "current_stage_node_id": current_stage,
            "critical_path": critical_path,
            "blocked_node_ids": blocked,
            "total_estimated_days_min": total_min,
            "total_estimated_days_max": total_max,
            "headline_finding": (
                f"The plan spans roughly {total_min}–{total_max} days end-to-end; "
                f"{'clear blockers first' if blocked else 'visa route confirmation is the next gate'}."
            ),
        },
    }


def _stub_culture_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic culture envelope keyed off destination country / city.

    A small lookup table covers the destinations our test fixtures use.
    Anything outside the table falls back to a neutral "international city"
    template so the schema still validates and tests on unseen countries
    don't fail.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}
    prior = payload.get("prior_analyses") or []

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    target_city = (
        case_inputs.get("target_city") or profile.get("target_city") or ""
    )
    work_pref = (
        case_inputs.get("work_preference") or profile.get("work_preference") or "hybrid"
    )

    # Family signal: scan prior analyses summaries for "family" or "with family".
    moving_with_family = any(
        (p.get("kind") == "family"
         and ("with family" in (p.get("summary") or "").lower()
              or "household" in (p.get("summary") or "").lower()))
        for p in prior
    )

    # --- Per-country profiles ---
    PROFILES: dict[str, dict[str, Any]] = {
        "DE": {
            "primary_language": "German",
            "english_usability_score": 70,
            "proficiency_target": "B1",
            "phrases": [
                ("Guten Tag", "Good day", "Daytime greeting in shops, offices."),
                ("Danke schön", "Thank you very much", "Used after small favours."),
                ("Entschuldigung", "Excuse me / sorry", "Apologise or get attention."),
                ("Tschüss", "Bye", "Casual farewell."),
                ("Sprechen Sie Englisch?", "Do you speak English?", "Polite opener."),
            ],
            "communication_style": (
                "Direct, low-context. People say what they mean; politeness is in the structure, not in softening."
            ),
            "hierarchy_note": (
                "Titles matter in formal settings, but day-to-day decision-making is consultative within teams."
            ),
            "meeting_etiquette": (
                "Start on time; agendas are followed; arrive five minutes early as a habit."
            ),
            "dress_code": "Business casual in offices; smart casual is fine in tech.",
            "punctuality": "Punctuality is a sign of respect; late by more than five minutes warrants a quick message.",
            "feedback_culture": "Feedback is direct and specific; it isn't personal.",
            "daily_life": [
                ("Sundays", "Most shops close on Sundays — plan groceries on Saturday."),
                ("Recycling", "Bottle deposits ('Pfand') and colour-coded bins are taken seriously."),
                ("Cash", "Smaller restaurants and bakeries may still prefer cash."),
                ("Public transport", "Buy tickets before boarding; checks are random but strict."),
            ],
            "first_week": [
                ("Anmeldung (address registration)", "Mandatory within ~14 days of arrival.", "must", 2.0),
                ("Open a German bank account", "Salary credit usually requires a local IBAN.", "must", 2.0),
                ("Get a SIM card", "Public Wi-Fi coverage is patchy.", "should", 1.0),
                ("Join a local language meetup", "Builds soft network and accelerates practice.", "nice", 2.0),
            ],
            "dos_donts": [
                ("Greet with 'Guten Tag' in shops and offices.", "Don't expect small talk before business."),
                ("Confirm appointments by email.", "Don't drop by unannounced — even socially."),
                ("Sort recycling carefully.", "Don't put glass with general waste."),
            ],
            "headline": (
                "Lean into the directness — it's not coldness, it's clarity. Show up on time, sort the trash, "
                "and start practising basic German before arrival."
            ),
        },
        "NL": {
            "primary_language": "Dutch",
            "english_usability_score": 92,
            "proficiency_target": "A2",
            "phrases": [
                ("Hallo", "Hello", "Universal greeting."),
                ("Dank je wel", "Thank you", "Daily."),
                ("Sorry", "Sorry / excuse me", "Same as English usage."),
                ("Spreekt u Engels?", "Do you speak English?", "Polite opener."),
                ("Tot ziens", "Goodbye", "Formal farewell."),
            ],
            "communication_style": (
                "Famously direct — feedback is delivered plainly. Politeness lives in tone, not in hedging."
            ),
            "hierarchy_note": (
                "Workplaces are flat; juniors are expected to challenge ideas in meetings."
            ),
            "meeting_etiquette": (
                "Start on time, end on time, decisions made by consensus ('polderen')."
            ),
            "dress_code": "Smart casual, very rarely formal except in finance.",
            "punctuality": "Punctual culture; tardiness reads as lack of preparation.",
            "feedback_culture": "Direct, often blunt — it's about the work, not the person.",
            "daily_life": [
                ("Cycling", "Bikes have priority over cars in most city centres."),
                ("Birthday rounds", "It's normal to congratulate every family member of a birthday person."),
                ("Lunch", "A modest sandwich at the desk is the norm — long lunches are rare."),
                ("Payments", "Tap-to-pay is universal; some places do not accept Mastercard."),
            ],
            "first_week": [
                ("BSN registration with municipality", "Required for nearly every formal interaction.", "must", 2.0),
                ("Open a Dutch bank account", "Many systems accept iDEAL only.", "must", 1.5),
                ("Buy a second-hand bike", "Cycling is the fastest way to feel local.", "should", 2.0),
                ("Sign up for a Dutch class", "Even A2 dramatically improves daily life.", "nice", 1.5),
            ],
            "dos_donts": [
                ("Be direct in meetings.", "Don't soften feedback so much that the point is lost."),
                ("Cycle defensively but assertively.", "Don't walk in bike lanes."),
                ("Schedule everything — even coffee.", "Don't expect spontaneous social plans."),
            ],
            "headline": (
                "English will carry you, but Dutch directness is the cultural skeleton. Schedule things, cycle "
                "everywhere, and don't take blunt feedback personally."
            ),
        },
        "JP": {
            "primary_language": "Japanese",
            "english_usability_score": 35,
            "proficiency_target": "B1",
            "phrases": [
                ("こんにちは (Konnichiwa)", "Hello", "Daytime greeting."),
                ("ありがとうございます (Arigatou gozaimasu)", "Thank you (formal)", "Default polite thanks."),
                ("すみません (Sumimasen)", "Excuse me / sorry", "Use liberally."),
                ("英語を話せますか (Eigo o hanasemasu ka?)", "Do you speak English?", "Polite opener."),
                ("お願いします (Onegaishimasu)", "Please", "Asking for service."),
            ],
            "communication_style": (
                "High-context, indirect; what's not said matters as much as what is. Disagreement is signalled softly."
            ),
            "hierarchy_note": (
                "Hierarchy is observed; juniors defer publicly even when they disagree privately."
            ),
            "meeting_etiquette": (
                "Decisions are pre-aligned before meetings ('nemawashi'); the meeting confirms consensus."
            ),
            "dress_code": "Conservative; suit and tie still common in legacy industries.",
            "punctuality": "Arrive 5–10 minutes early; lateness is a serious signal.",
            "feedback_culture": "Indirect — read tone and pauses. Direct critique in public is rare.",
            "daily_life": [
                ("Trains", "Quiet zones, no calls; rush hour is intense."),
                ("Cash", "Cash is still common in older shops; carry small bills."),
                ("Tipping", "Not customary; can be perceived as awkward."),
                ("Recycling", "Categorisation rules vary by ward — read the local guide."),
            ],
            "first_week": [
                ("Register at the city ward office", "Mandatory for residency, health insurance, and bank.", "must", 3.0),
                ("Get a hanko (personal seal)", "Many bank and contract processes require one.", "must", 1.5),
                ("Set up an IC transit card", "Suica/Pasmo make daily transit much easier.", "should", 0.5),
                ("Take a beginner Japanese class", "Even basic kana opens up daily life.", "should", 2.0),
            ],
            "dos_donts": [
                ("Bow slightly when greeting and thanking.", "Don't initiate handshakes."),
                ("Be quiet on trains and in elevators.", "Don't take phone calls in public transit."),
                ("Sort recycling per ward instructions.", "Don't mix burnable and PET bottles."),
            ],
            "headline": (
                "Plan for a steeper cultural learning curve — politeness is the protocol layer. Pre-align decisions, "
                "speak softly in public, and start basic Japanese before arrival."
            ),
        },
        "GB": {
            "primary_language": "English",
            "english_usability_score": 100,
            "proficiency_target": "none",
            "phrases": [
                ("Hello", "Hello", "Universal."),
                ("Cheers", "Thanks / bye", "Casual."),
                ("Sorry", "Sorry / excuse me", "Used liberally even when not at fault."),
                ("Right then", "Okay, moving on", "Conversation transition."),
                ("How are you?", "Greeting, not a real question", "Reply: 'Good, thanks, you?'"),
            ],
            "communication_style": (
                "Polite, indirect; feedback is wrapped in softeners ('it might be worth considering…')."
            ),
            "hierarchy_note": (
                "Visible hierarchy is light; informal authority still runs through senior managers."
            ),
            "meeting_etiquette": "Punctual; agendas exist but small talk frames the start.",
            "dress_code": "Smart casual in tech; formal in finance and legal.",
            "punctuality": "Aim to be on time; 5 minutes late warrants a quick apology.",
            "feedback_culture": "Indirect; learn to read 'I'm not sure that's quite right' as 'no'.",
            "daily_life": [
                ("Pubs", "Round buying is a social ritual — track whose round it is."),
                ("Queues", "Queue discipline is real; jumping is socially serious."),
                ("Weather small talk", "Common opener with strangers."),
                ("Tipping", "10–12% in restaurants if service isn't included."),
            ],
            "first_week": [
                ("Apply for an NI number", "Required before payroll runs cleanly.", "must", 1.5),
                ("Open a UK bank account", "Some still need proof of address.", "must", 2.0),
                ("Register with a GP", "Locks you into NHS coverage.", "should", 1.0),
                ("Get an Oyster card / contactless transit", "Cheaper than buying paper tickets.", "should", 0.3),
            ],
            "dos_donts": [
                ("Apologise often, even when not at fault.", "Don't push to the front of queues."),
                ("Mind your tone in feedback.", "Don't take 'fine' literally — context matters."),
                ("Buy your round.", "Don't drink for free without reciprocating."),
            ],
            "headline": (
                "Language is not the barrier — interpretation is. Read the softeners, queue politely, and learn "
                "the round-buying rhythm at the pub."
            ),
        },
        "CA": {
            "primary_language": "English",
            "english_usability_score": 95,
            "proficiency_target": "A1",
            "phrases": [
                ("Hello", "Hello", "Universal."),
                ("Thanks", "Thanks", "Daily."),
                ("Sorry", "Sorry", "Heavily used; cultural marker."),
                ("Bonjour", "Hello (Quebec)", "Use in QC; not required elsewhere."),
                ("Eh?", "Right? / yeah?", "Casual conversational tag."),
            ],
            "communication_style": "Polite, low-confrontation, slightly indirect.",
            "hierarchy_note": "Generally flat in tech and creative industries.",
            "meeting_etiquette": "Punctual, agenda-driven, decisions usually consensus.",
            "dress_code": "Casual to smart casual.",
            "punctuality": "On-time culture; 5 minutes late is fine if announced.",
            "feedback_culture": "Soft and constructive; specifics matter.",
            "daily_life": [
                ("Tipping", "15–20% is standard in restaurants."),
                ("Winters", "Plan for serious winter clothing in most provinces."),
                ("Healthcare", "Provincial health card application starts on arrival."),
                ("Distances", "Cities are spread out; transit varies wildly by city."),
            ],
            "first_week": [
                ("Apply for a Social Insurance Number (SIN)", "Required for payroll.", "must", 1.0),
                ("Open a Canadian bank account", "Many banks have newcomer packages.", "must", 1.5),
                ("Apply for the provincial health card", "Up to 3-month wait for OHIP/RAMQ.", "must", 1.0),
                ("Set up provincial driver's licence transfer", "Time-limited window in most provinces.", "should", 1.5),
            ],
            "dos_donts": [
                ("Tip 15–20% in restaurants.", "Don't assume tips are included."),
                ("Be on time.", "Don't no-show; reschedule politely."),
                ("Layer up for winter.", "Don't underestimate −20°C — it's normal."),
            ],
            "headline": (
                "Canada is friendly and forgiving culturally; the operational lift is provincial paperwork on "
                "week one — SIN, bank, health card."
            ),
        },
    }

    fallback = {
        "primary_language": "Local language",
        "english_usability_score": 60,
        "proficiency_target": "A2",
        "phrases": [
            ("Hello", "Hello", "Universal greeting."),
            ("Thank you", "Thank you", "Polite acknowledgement."),
            ("Excuse me", "Excuse me", "Get attention politely."),
            ("Do you speak English?", "Do you speak English?", "Opener."),
            ("Goodbye", "Goodbye", "Farewell."),
        ],
        "communication_style": "International workplaces tend toward neutral, agenda-driven communication.",
        "hierarchy_note": "Default to respectful formal address until invited otherwise.",
        "meeting_etiquette": "Be punctual, prepare an agenda, summarise actions in writing afterwards.",
        "dress_code": "Smart casual is a safe default until you observe local norms.",
        "punctuality": "On-time arrival is universally a safe signal.",
        "feedback_culture": "Calibrate to local indirectness in the first month.",
        "daily_life": [
            ("Greetings", "Match the formality of who greets you first."),
            ("Tipping", "Check local norms — cap at the locally expected band."),
            ("Public transport", "Buy/validate tickets correctly to avoid fines."),
        ],
        "first_week": [
            ("Register your address locally", "Required in most countries.", "must", 2.0),
            ("Open a local bank account", "Required for salary credit.", "must", 2.0),
            ("Get a local SIM", "Mobile data and 2FA are essential.", "should", 0.5),
        ],
        "dos_donts": [
            ("Observe before you act in the first week.", "Don't generalise from one interaction."),
            ("Ask local colleagues for tips.", "Don't assume English-speaking norms apply."),
        ],
        "headline": (
            "Approach the first month as observation mode — match local rhythms before optimising."
        ),
    }

    p = PROFILES.get(target_country, fallback)

    workplace_norms = {
        "communication_style": p["communication_style"],
        "hierarchy_note": p["hierarchy_note"],
        "meeting_etiquette": p["meeting_etiquette"],
        "dress_code": p.get("dress_code"),
        "punctuality": p.get("punctuality"),
        "feedback_culture": p.get("feedback_culture"),
    }

    daily_life = [{"topic": t, "note": n} for (t, n) in p["daily_life"]]
    basic_phrases = [
        {"phrase": ph, "translation": tr, "usage": us}
        for (ph, tr, us) in p["phrases"]
    ]
    first_week_kit = [
        {"label": lbl, "why": why, "priority": prio, "effort_hours": hrs}
        for (lbl, why, prio, hrs) in p["first_week"]
    ]
    dos_donts = [{"do": d, "dont": dn} for (d, dn) in p["dos_donts"]]

    family_notes: list[str] = []
    if moving_with_family:
        family_notes = [
            (
                f"Plan a school orientation visit in {target_city or target_country} during the first month — "
                "international and bilingual options vary by neighbourhood."
            ),
            (
                "Carve out parent-friendly community time early; loneliness for the trailing partner is the "
                "single most common derailer of relocations."
            ),
            (
                "Map the nearest paediatric clinic and after-hours pharmacy before you need them."
            ),
        ]

    score = 75 if p["english_usability_score"] >= 80 else 65 if p["english_usability_score"] >= 50 else 55
    if work_pref == "remote":
        score += 5

    return {
        "status": "ready",
        "score": min(95, score),
        "summary": (
            f"{target_country} settles in cleanly when you respect the local rhythm of "
            f"{p['primary_language']} and adapt your communication style; the first week is mostly admin."
        ),
        "reasoning": (
            f"Daily life in {target_city or target_country} runs on {p['primary_language']} "
            f"(English usability ~{p['english_usability_score']}/100). "
            f"Workplace norms favour the communication style described, and the first week's logistics "
            f"are dominated by registration, banking, and a SIM card. "
            f"{'Family notes are included since prior analyses indicate a household relocation.' if moving_with_family else 'Solo move — family notes are intentionally empty.'}"
        ),
        "risks": [
            {
                "severity": "low" if p["english_usability_score"] >= 80 else "medium",
                "label": "Language friction in services",
                "detail": (
                    "Government and medical services may be local-language-only; "
                    "carry a translator app for the first 90 days."
                ),
            },
            {
                "severity": "low",
                "label": "Cultural calibration period",
                "detail": "Expect 4–8 weeks before workplace norms feel intuitive.",
            },
        ],
        "next_actions": [
            {
                "label": (
                    f"Memorise the 5 basic phrases" if p["english_usability_score"] < 100
                    else "Skim the dos-and-donts before week one"
                ),
                "urgency": "this week",
                "why": "Removes the smallest daily-life friction in the first month.",
            },
            {
                "label": "Read the workplace-norms section before your first standup",
                "urgency": "before arrival",
                "why": "Reduces missteps in the first week of the new role.",
            },
        ],
        "confidence": 0.7,
        "assumptions": [
            {
                "label": f"Primary language assumed as {p['primary_language']}",
                "detail": "Inferred from target country.",
                "source": "inferred",
                "confidence": 0.85,
            },
            {
                "label": (
                    f"Corporate / hybrid workplace assumed ({work_pref})"
                ),
                "detail": "Default workplace assumption; tone changes for remote-only.",
                "source": "default",
                "confidence": 0.6,
            },
            {
                "label": (
                    "Family relocation in scope" if moving_with_family else "Solo relocation assumed"
                ),
                "detail": "Inferred from prior family analysis if available.",
                "source": "inferred",
                "confidence": 0.6,
            },
        ],
        "detail": {
            "workplace_norms": workplace_norms,
            "daily_life": daily_life,
            "language": {
                "primary_language": p["primary_language"],
                "english_usability_score": p["english_usability_score"],
                "proficiency_target": p["proficiency_target"],
                "rationale": (
                    f"Aim for {p['proficiency_target']} within 6–12 months; "
                    f"English usability is ~{p['english_usability_score']}/100, so this level "
                    "covers daily life without aiming for fluency."
                ),
                "basic_phrases": basic_phrases,
            },
            "first_week_kit": first_week_kit,
            "dos_and_donts": dos_donts,
            "family_adaptation_notes": family_notes,
            "headline_finding": p["headline"],
        },
    }


def _stub_timeline_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic timeline envelope that fuses prior analyses.

    Behaviour:
      - Reads `prior_analyses` for visa difficulty, document readiness,
        family complexity, and workflow blocked nodes; uses the
        `detail_excerpt` whitelist that the timeline service injects.
      - Compresses pre-application phase if move_urgency=asap.
      - Adds blockers when the user reports a missing passport or
        documents readiness < 50% (from documents prior).
      - Bumps total weeks for visa-heavy cases.
      - earliest_realistic_start_date = today + (weeks-to-clear-blockers).
    """
    import json as _json
    from datetime import date, timedelta

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}
    prior = payload.get("prior_analyses") or []

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    target_city = (
        case_inputs.get("target_city") or profile.get("target_city") or ""
    )
    move_urgency = case_inputs.get("move_urgency") or profile.get("move_urgency") or "exploring"
    docs = case_inputs.get("current_document_status") or profile.get("current_document_status") or {}
    has_passport = bool(
        isinstance(docs, dict) and docs.get("PASSPORT") and docs["PASSPORT"].get("has")
    )

    # Mine prior analyses.
    prior_by_kind: dict[str, dict] = {}
    for p in prior:
        prior_by_kind[p.get("kind")] = p
    visa_p = prior_by_kind.get("visa", {})
    docs_p = prior_by_kind.get("documents", {})
    family_p = prior_by_kind.get("family", {})
    workflow_p = prior_by_kind.get("workflow", {})

    visa_excerpt = visa_p.get("detail_excerpt") or {}
    docs_excerpt = docs_p.get("detail_excerpt") or {}
    family_excerpt = family_p.get("detail_excerpt") or {}
    workflow_excerpt = workflow_p.get("detail_excerpt") or {}

    visa_difficulty = (visa_excerpt.get("route_difficulty") or "medium").lower()
    docs_readiness = int(docs_excerpt.get("readiness_percentage") or 50)
    docs_need = int(docs_excerpt.get("need_count") or 0)
    family_complexity = int(family_excerpt.get("household_complexity_score") or 0)
    blocked_node_ids = workflow_excerpt.get("blocked_node_ids") or []

    # Phase week ranges. Compress when urgent.
    urgent = move_urgency in ("asap", "now", "urgent")

    if urgent:
        pre_min, pre_max = 0, 3
    elif docs_readiness < 50 or not has_passport:
        pre_min, pre_max = 4, 10
    else:
        pre_min, pre_max = 2, 6

    # Visa application + processing
    if visa_difficulty in ("high", "very_high"):
        proc_min, proc_max = 12, 24
    elif visa_difficulty == "medium":
        proc_min, proc_max = 8, 16
    else:
        proc_min, proc_max = 4, 10

    app_min, app_max = pre_max, pre_max + 2  # 1-2 weeks to file once prepared
    proc_start_min = app_max
    proc_start_max = app_max + 1
    proc_end_min = proc_start_min + proc_min
    proc_end_max = proc_start_max + proc_max

    travel_min = proc_end_min + 1
    travel_max = proc_end_max + 2
    arrival_min = travel_max
    arrival_max = travel_max + 4
    settle_min = arrival_max
    settle_max = arrival_max + (8 if family_complexity > 50 else 4)

    phases = [
        {
            "id": "pre_application",
            "label": "Document & route preparation",
            "category": "pre_application",
            "start_week": pre_min,
            "end_week": pre_max,
            "description": (
                f"Confirm the visa route, gather documents, and polish a market-ready CV "
                f"for {target_country}."
            ),
        },
        {
            "id": "application",
            "label": "File visa application",
            "category": "application",
            "start_week": app_min,
            "end_week": app_max,
            "description": "Submit the application package and pay government fees.",
        },
        {
            "id": "processing",
            "label": "Government processing",
            "category": "processing",
            "start_week": proc_start_min,
            "end_week": proc_end_max,
            "description": (
                f"Visa difficulty for {target_country} is {visa_difficulty}; "
                f"typical window is {proc_min}–{proc_max} weeks."
            ),
        },
        {
            "id": "travel",
            "label": "Travel & shipping",
            "category": "travel",
            "start_week": travel_min,
            "end_week": travel_max,
            "description": "Book flights, ship belongings, line up temporary housing.",
        },
        {
            "id": "arrival",
            "label": "First 30 days in-country",
            "category": "arrival",
            "start_week": arrival_min,
            "end_week": arrival_max,
            "description": "Address registration, banking, SIM card, first day at work.",
        },
        {
            "id": "settlement",
            "label": "Settlement & integration",
            "category": "settlement",
            "start_week": settle_min,
            "end_week": settle_max,
            "description": (
                "Long-term housing, school admission, and cultural settling-in."
                if family_complexity > 50
                else "Long-term housing and cultural settling-in."
            ),
        },
    ]

    milestones = [
        {
            "id": "passport_verified",
            "label": "Passport validity verified",
            "phase_id": "pre_application",
            "target_week": max(0, pre_min),
            "depends_on": [],
            "why": "Required for the visa application packet.",
        },
        {
            "id": "documents_complete",
            "label": "Documents complete",
            "phase_id": "pre_application",
            "target_week": pre_max,
            "depends_on": ["passport_verified"],
            "why": "All apostilled and translated documents in hand.",
        },
        {
            "id": "visa_filed",
            "label": "Visa application filed",
            "phase_id": "application",
            "target_week": app_max,
            "depends_on": ["documents_complete"],
            "why": "Locks the start of the processing window.",
        },
        {
            "id": "visa_decision",
            "label": "Visa decision received",
            "phase_id": "processing",
            "target_week": proc_end_min,
            "depends_on": ["visa_filed"],
            "why": "Gates flight booking and shipping.",
        },
        {
            "id": "departure",
            "label": "Departure flight",
            "phase_id": "travel",
            "target_week": travel_max,
            "depends_on": ["visa_decision"],
            "why": "Cannot depart before the visa is granted.",
        },
        {
            "id": "address_registration",
            "label": "Address registered locally",
            "phase_id": "arrival",
            "target_week": arrival_min + 1,
            "depends_on": ["departure"],
            "why": "Required for banking, payroll, and most services.",
        },
        {
            "id": "first_day_work",
            "label": "First day in role",
            "phase_id": "arrival",
            "target_week": arrival_min + 2,
            "depends_on": ["address_registration"],
            "why": "Salary credit usually depends on registration + bank account.",
        },
    ]
    if family_complexity > 50:
        milestones.append(
            {
                "id": "school_admission",
                "label": "Children admitted to school",
                "phase_id": "settlement",
                "target_week": settle_max - 2,
                "depends_on": ["address_registration"],
                "why": "Schools usually require visa proof and local address.",
            }
        )

    blockers: list[dict] = []
    weeks_to_unblock = 0
    if not has_passport:
        blockers.append(
            {
                "label": "Passport not yet held",
                "detail": "Without a valid passport, the visa application cannot be filed.",
                "severity": "high",
                "blocks_phase_id": "application",
                "estimated_unblock_weeks": 6,
            }
        )
        weeks_to_unblock = max(weeks_to_unblock, 6)
    if docs_readiness < 50 and docs_need >= 2:
        blockers.append(
            {
                "label": "Documents not ready",
                "detail": (
                    f"Document readiness is at {docs_readiness}%; "
                    "several required documents are still missing."
                ),
                "severity": "medium" if docs_readiness >= 30 else "high",
                "blocks_phase_id": "pre_application",
                "estimated_unblock_weeks": 4 if docs_readiness >= 30 else 8,
            }
        )
        weeks_to_unblock = max(weeks_to_unblock, 4 if docs_readiness >= 30 else 8)
    if blocked_node_ids:
        blockers.append(
            {
                "label": "Workflow shows upstream blockers",
                "detail": (
                    f"{len(blocked_node_ids)} blocked workflow node(s) gate the visa filing."
                ),
                "severity": "medium",
                "blocks_phase_id": "pre_application",
                "estimated_unblock_weeks": 4,
            }
        )
        weeks_to_unblock = max(weeks_to_unblock, 4)

    start_anchor = "earliest_realistic_start" if blockers else "today"
    earliest_start_date = (date.today() + timedelta(weeks=weeks_to_unblock)).isoformat()

    total_min = settle_min  # min: arrival is the user's "moved" point
    total_max = settle_max

    critical_milestones = [
        "passport_verified",
        "documents_complete",
        "visa_filed",
        "visa_decision",
        "departure",
        "address_registration",
    ]

    score = 75
    if visa_difficulty in ("high", "very_high"):
        score -= 10
    if blockers:
        score -= 10 if any(b["severity"] == "high" for b in blockers) else 5
    if urgent and blockers:
        score -= 5
    score = max(30, min(95, score))

    return {
        "status": "ready",
        "score": score,
        "summary": (
            f"End-to-end timeline to {target_country}{(' (' + target_city + ')') if target_city else ''} "
            f"runs about {total_min}–{total_max} weeks; "
            f"{'clear blockers first' if blockers else 'no upstream blockers'}."
        ),
        "reasoning": (
            f"Visa difficulty is {visa_difficulty}, processing window {proc_min}–{proc_max} weeks. "
            f"Documents readiness sits at {docs_readiness}%. "
            f"{'Family complexity adds settlement time.' if family_complexity > 50 else 'No major family-driven settlement extension.'} "
            f"{'Move urgency is high — soft buffers compressed.' if urgent else 'Urgency is flexible; conservative buffers retained.'}"
        ),
        "risks": [
            {
                "severity": "high" if visa_difficulty in ("high", "very_high") else "medium",
                "label": "Processing window can stretch",
                "detail": "Government delays are the single biggest source of timeline drift.",
            },
            {
                "severity": "medium",
                "label": "Document delays compound",
                "detail": "A missing apostille can push the entire plan back by 2–6 weeks.",
            },
        ],
        "next_actions": [
            {
                "label": (
                    "Clear the highest-severity blocker"
                    if blockers
                    else "Pin a target arrival date and book the visa appointment"
                ),
                "urgency": "this week",
                "why": (
                    "Blockers anchor every other estimate."
                    if blockers
                    else "An anchored date drives the rest of the plan."
                ),
            },
            {
                "label": "Confirm the visa route and processing window with an adviser",
                "urgency": "this week",
                "why": "Locks the realism of the processing phase.",
            },
        ],
        "confidence": 0.7 if not blockers else 0.6,
        "assumptions": [
            {
                "label": (
                    "Start anchor is today" if start_anchor == "today" else "Start anchor is the earliest realistic start"
                ),
                "detail": (
                    "No blockers detected, so week 0 is today."
                    if start_anchor == "today"
                    else "Blockers are present; week 0 is the earliest date the user can cleanly begin."
                ),
                "source": "inferred",
                "confidence": 0.75,
            },
            {
                "label": f"Visa difficulty assumed as {visa_difficulty}",
                "detail": "Echoed from the prior visa-direction analysis where available.",
                "source": "inferred",
                "confidence": 0.7,
            },
            {
                "label": (
                    "Family settlement time included" if family_complexity > 50
                    else "Solo settlement time used"
                ),
                "detail": "Inferred from the prior family-impact household_complexity_score.",
                "source": "inferred",
                "confidence": 0.6,
            },
        ],
        "detail": {
            "start_anchor": start_anchor,
            "earliest_realistic_start_date": earliest_start_date,
            "phases": phases,
            "milestones": milestones,
            "blockers": blockers,
            "estimated_total_weeks_min": total_min,
            "estimated_total_weeks_max": total_max,
            "critical_milestones": critical_milestones + (["school_admission"] if family_complexity > 50 else []),
            "headline_finding": (
                f"Plan for ~{total_min}–{total_max} weeks; "
                f"{'visa processing is the longest leg' if visa_difficulty in ('high', 'very_high') else 'pre-application prep is the next gate'}."
            ),
        },
    }


def _stub_synthesis_envelope(user_text: str) -> dict[str, Any]:
    """Deterministic synthesis envelope keyed off real prior analyses.

    Composes a verdict that respects the consistency rules enforced in
    `synthesis/service.py::_validate_synthesis_consistency`:
      - module_scores mirror upstream scores within ±5.
      - feasibility_score is within ±15 of the weighted average.
      - verdict matches the band of feasibility_score.

    We compute the weighted score in stub the same way the validator
    does, then pick the band exactly. That way the stub never drifts
    out of the consistency window.
    """
    import json as _json

    try:
        payload = _json.loads(user_text)
    except Exception:
        payload = {}

    case_inputs = payload.get("case_inputs") or {}
    profile = payload.get("profile") or {}
    prior = payload.get("prior_analyses") or []

    target_country = (
        case_inputs.get("target_country") or profile.get("target_country") or "DE"
    ).upper()
    target_city = (
        case_inputs.get("target_city") or profile.get("target_city") or None
    )
    target_role = (
        case_inputs.get("target_role")
        or profile.get("current_role")
        or "Software Engineer"
    )
    industry = case_inputs.get("industry") or profile.get("industry")

    # Same weights as the service validator. Synced manually — if you
    # change one, change both.
    weights = {
        "country_comparison": 1.0,
        "jobfit": 1.5,
        "visa": 2.0,
        "family": 1.0,
        "finance": 1.5,
        "documents": 0.8,
        "workflow": 0.6,
        "culture": 0.4,
        "timeline": 0.6,
    }
    bands = [
        (80, "go"),
        (65, "go_with_conditions"),
        (50, "wait"),
        (35, "reconsider"),
        (0, "blocked"),
    ]

    pretty_label = {
        "country_comparison": "Country comparison",
        "jobfit": "Job fit",
        "visa": "Visa direction",
        "family": "Family relocation",
        "finance": "Financial feasibility",
        "documents": "Documents",
        "workflow": "Workflow",
        "culture": "Culture & language",
        "timeline": "Timeline",
    }

    prior_by_kind: dict[str, dict] = {p.get("kind"): p for p in prior}

    # Build module_scores (only for kinds we actually have priors for, since
    # the validator requires available=true entries to map to a prior).
    module_scores: list[dict[str, Any]] = []
    summaries: dict[str, str] = {}
    num = 0.0
    den = 0.0
    for kind, weight in weights.items():
        p = prior_by_kind.get(kind)
        if p is None or not isinstance(p.get("score"), (int, float)):
            continue
        score = int(p["score"])
        confidence = (
            float(p["confidence"]) if isinstance(p.get("confidence"), (int, float)) else 0.6
        )
        summary = (p.get("summary") or "").strip() or f"{pretty_label[kind]} analysis available."
        module_scores.append(
            {
                "kind": kind,
                "label": pretty_label[kind],
                "score": score,
                "confidence": confidence,
                "summary": summary[:400],
                "available": True,
            }
        )
        summaries[kind] = summary[:400]
        num += weight * score
        den += weight

    # If no upstream is available we still need at least one entry to satisfy
    # min_length=1 on module_scores. Use a placeholder for country_comparison.
    if not module_scores:
        module_scores.append(
            {
                "kind": "country_comparison",
                "label": "Country comparison",
                "score": 50,
                "confidence": 0.4,
                "summary": "Run this module for a complete picture.",
                "available": False,
            }
        )
        summaries["country_comparison"] = "Run this module for a complete picture."

    weighted = (num / den) if den > 0 else 50.0
    feasibility_score = max(0, min(100, int(round(weighted))))
    verdict = next(
        (label for threshold, label in bands if feasibility_score >= threshold),
        "blocked",
    )

    # Top blockers: pull from prior analyses whose summary contains "block",
    # "missing", "blocker", or whose score is < 50 — synthesise into TopBlocker.
    top_blockers: list[dict[str, Any]] = []
    for p in prior:
        kind = p.get("kind")
        score = p.get("score")
        summary = (p.get("summary") or "").lower()
        if kind in ("visa", "documents", "workflow", "finance") and (
            (isinstance(score, (int, float)) and score < 60)
            or "block" in summary
            or "missing" in summary
        ):
            severity = "high" if isinstance(score, (int, float)) and score < 45 else "medium"
            top_blockers.append(
                {
                    "label": f"{pretty_label.get(kind, kind)} signals risk",
                    "detail": (p.get("summary") or f"{pretty_label.get(kind, kind)} score is below the comfort band.")[:400],
                    "severity": severity,
                    "source_module": kind,
                }
            )
    # Sort by severity (high first), keep at most 5
    top_blockers.sort(key=lambda b: 0 if b["severity"] == "high" else 1)
    top_blockers = top_blockers[:5]

    # Next best actions: a small canon plus visa/finance/documents nudges.
    nbas: list[dict[str, Any]] = [
        {
            "label": "Confirm the visa route with a licensed adviser",
            "why": "Locks the most expensive assumption underpinning the verdict.",
            "urgency": "this week",
            "effort_hours": 2.0,
        },
        {
            "label": "Close the highest-severity blocker",
            "why": "Each blocker pushes the realistic start date back.",
            "urgency": "this week",
            "effort_hours": 4.0,
        },
        {
            "label": "Verify the financial runway covers the first 3 months",
            "why": "Salary credit usually lags arrival by 3–6 weeks.",
            "urgency": "this month",
            "effort_hours": 1.0,
        },
    ]
    if any(p.get("kind") == "documents" for p in prior):
        nbas.append(
            {
                "label": "Complete the document checklist",
                "why": "Documents readiness gates the visa filing.",
                "urgency": "this week",
                "effort_hours": 3.0,
            }
        )

    rec_dest = {
        "country": target_country[:2],
        "city": target_city,
        "confidence": 0.8 if verdict in ("go", "go_with_conditions") else 0.6,
        "rationale": (
            f"{target_country} remains the user's stated destination and the upstream "
            f"signals support it." if verdict in ("go", "go_with_conditions")
            else f"{target_country} is the stated destination but upstream signals suggest tightening the plan first."
        ),
    }
    rec_job = {
        "title": target_role,
        "industry": industry,
        "confidence": 0.7,
        "rationale": (
            "Echoed from profile / case inputs; refine after job-fit analysis is final."
        ),
    }

    headline = (
        f"{verdict.replace('_', ' ').title()} on {target_country}: feasibility {feasibility_score}/100."
    )
    one_line = (
        f"{verdict.replace('_', ' ').title()} — the upstream analyses converge at {feasibility_score}/100 "
        f"for {target_country}."
    )

    explanation = (
        f"Across {len(module_scores)} upstream analyses, the case scores {feasibility_score}/100 on a weighted "
        f"average that emphasises visa, jobfit, and finance. {len(top_blockers)} blocker(s) currently affect the "
        f"realistic start date. The recommended next move is to close the highest-severity blocker and confirm "
        f"the visa route — together they unlock the largest downstream cascade. Each module's individual score is "
        f"surfaced as a separate dashboard tile so the user can drill in. The verdict (`{verdict}`) is anchored to "
        f"the band that contains the feasibility score, not adjusted ad-hoc."
    )

    return {
        "status": "ready",
        "score": feasibility_score,
        "summary": (
            f"{target_country}: feasibility {feasibility_score}/100, verdict `{verdict}`. "
            f"{len(top_blockers)} blocker(s) currently in the way."
        ),
        "reasoning": (
            f"Weighted upstream score is {weighted:.1f}, which falls in the {verdict!r} band. "
            f"Visa, jobfit, and finance carry the most weight; culture and workflow are softer signals. "
            f"Synthesis preserves the upstream module scores rather than re-judging them, so the dashboard "
            f"stays consistent with the per-module pages."
        ),
        "risks": [
            {
                "severity": "medium",
                "label": "Upstream coverage may be partial",
                "detail": (
                    f"Only {len(module_scores)} of {len(weights)} possible analyses were available; "
                    "running the missing modules will sharpen the verdict."
                ),
            },
            {
                "severity": "medium",
                "label": "Verdict is a snapshot",
                "detail": "Re-run after fresh inputs (visa, finance) to keep the dashboard honest.",
            },
        ],
        "next_actions": [
            {"label": a["label"], "urgency": a["urgency"], "why": a["why"]}
            for a in nbas[:3]
        ],
        "confidence": 0.75,
        "assumptions": [
            {
                "label": "Verdict weights",
                "detail": "Visa 2×, jobfit 1.5×, finance 1.5×; culture 0.4× was the lightest weight.",
                "source": "default",
                "confidence": 0.9,
            },
            {
                "label": (
                    f"Coverage: {len(module_scores)}/{len(weights)} modules available"
                ),
                "detail": "Missing modules were treated as not-yet-run rather than zero scores.",
                "source": "inferred",
                "confidence": 0.7,
            },
        ],
        "detail": {
            "feasibility_score": feasibility_score,
            "verdict": verdict,
            "one_line_reasoning": one_line[:240],
            "recommended_destination": rec_dest,
            "recommended_job_path": rec_job,
            "module_scores": module_scores,
            "module_summaries": summaries,
            "top_blockers": top_blockers,
            "next_best_actions": nbas[:5],
            "explanation": explanation,
            "headline_finding": headline,
        },
    }


def _minimal_object(schema: dict[str, Any]) -> dict[str, Any]:
    """Build a minimal-valid object for any pydantic-emitted schema."""
    if schema.get("type") != "object":
        return {}
    out: dict[str, Any] = {}
    required = set(schema.get("required", []))
    for name, sub in schema.get("properties", {}).items():
        if name not in required:
            continue
        out[name] = _minimal_value(sub, schema)
    return out


def _minimal_value(sub: dict[str, Any], root: dict[str, Any]) -> Any:
    if "$ref" in sub:
        ref = sub["$ref"].split("/")[-1]
        target = root.get("$defs", {}).get(ref) or root.get("definitions", {}).get(ref) or {}
        return _minimal_value(target, root)
    if "anyOf" in sub:
        for opt in sub["anyOf"]:
            if opt.get("type") == "null":
                return None
        return _minimal_value(sub["anyOf"][0], root)
    t = sub.get("type")
    if t == "string":
        return sub.get("default", "stub")
    if t in ("integer", "number"):
        return sub.get("default", 0)
    if t == "boolean":
        return sub.get("default", False)
    if t == "array":
        return []
    if t == "object":
        return _minimal_object(sub)
    return None
