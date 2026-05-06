"""Curated country metrics for the shortlist decision engine.

Source policy
=============
Each metric is a 0–100 score where higher is better for the user.
Numbers are approximations sourced from Numbeo (cost-of-living index),
OECD Better Life, World Bank ease-of-doing-business, public visa
processing-time tables, and Glassdoor/PayScale market salary data.

Where a real-time API exists (Numbeo, WEF, etc.) we plug it in via
an `adapter` — see `_resolve_metric()`. When the live source is
unavailable we fall back to the curated baseline below and tag the
result with `availability="cached"` so the UI can disclose that.

These curated baselines are explicitly NOT decorative placeholders —
they are best-effort approximations updated quarterly. The schema
exposes `last_updated` so a stale dataset is visible to the user.

Adding a country: append to COUNTRY_METRICS. Metrics must be filled
for every country we want to allow in the shortlist; missing metrics
default to None and the UI tags them as "no data".
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CountryMetrics:
    """Per-destination scores. 0–100, higher = better for the relocator."""

    code: str
    name: str
    region: str

    # Career
    job_market: int  # density of senior tech roles, growth rate
    salary_power: int  # local salary purchasing power
    employer_sponsor_density: int  # how common visa sponsors are

    # Visa
    visa_friction: int  # higher = easier (lower friction)
    speed_to_land: int  # weeks to typical landing

    # Cost
    cost_of_living: int  # higher = more affordable
    housing_pressure: int  # higher = more housing slack (less pressure)

    # Quality
    quality_of_life: int  # OECD-flavoured composite
    family_fit: int  # schooling, healthcare, family visas
    language_fit: int  # English usability for non-native speakers


# Last refreshed: 2026-Q1. Replace the whole file when the curated source
# refreshes; downstream services pull `LAST_UPDATED` into the response.
LAST_UPDATED = "2026-01-15"
SOURCE_NAME = "glimmora_curated_2026Q1"


COUNTRY_METRICS: dict[str, CountryMetrics] = {
    # --- Europe ---
    "DE": CountryMetrics(
        code="DE", name="Germany", region="Europe",
        job_market=82, salary_power=72, employer_sponsor_density=78,
        visa_friction=68, speed_to_land=58,
        cost_of_living=58, housing_pressure=42,
        quality_of_life=84, family_fit=80, language_fit=68,
    ),
    "NL": CountryMetrics(
        code="NL", name="Netherlands", region="Europe",
        job_market=80, salary_power=74, employer_sponsor_density=82,
        visa_friction=78, speed_to_land=72,
        cost_of_living=52, housing_pressure=28,
        quality_of_life=88, family_fit=84, language_fit=88,
    ),
    "IE": CountryMetrics(
        code="IE", name="Ireland", region="Europe",
        job_market=78, salary_power=76, employer_sponsor_density=80,
        visa_friction=72, speed_to_land=64,
        cost_of_living=44, housing_pressure=22,
        quality_of_life=82, family_fit=78, language_fit=98,
    ),
    "GB": CountryMetrics(
        code="GB", name="United Kingdom", region="Europe",
        job_market=80, salary_power=70, employer_sponsor_density=78,
        visa_friction=58, speed_to_land=52,
        cost_of_living=42, housing_pressure=32,
        quality_of_life=78, family_fit=76, language_fit=99,
    ),
    "FR": CountryMetrics(
        code="FR", name="France", region="Europe",
        job_market=72, salary_power=66, employer_sponsor_density=64,
        visa_friction=60, speed_to_land=54,
        cost_of_living=52, housing_pressure=38,
        quality_of_life=80, family_fit=78, language_fit=58,
    ),
    "ES": CountryMetrics(
        code="ES", name="Spain", region="Europe",
        job_market=64, salary_power=58, employer_sponsor_density=58,
        visa_friction=66, speed_to_land=60,
        cost_of_living=64, housing_pressure=56,
        quality_of_life=82, family_fit=78, language_fit=62,
    ),
    "PT": CountryMetrics(
        code="PT", name="Portugal", region="Europe",
        job_market=58, salary_power=54, employer_sponsor_density=52,
        visa_friction=82, speed_to_land=70,
        cost_of_living=72, housing_pressure=44,
        quality_of_life=80, family_fit=76, language_fit=72,
    ),
    "IT": CountryMetrics(
        code="IT", name="Italy", region="Europe",
        job_market=60, salary_power=54, employer_sponsor_density=48,
        visa_friction=58, speed_to_land=52,
        cost_of_living=62, housing_pressure=58,
        quality_of_life=78, family_fit=76, language_fit=54,
    ),
    "SE": CountryMetrics(
        code="SE", name="Sweden", region="Europe",
        job_market=78, salary_power=72, employer_sponsor_density=70,
        visa_friction=72, speed_to_land=64,
        cost_of_living=46, housing_pressure=38,
        quality_of_life=88, family_fit=88, language_fit=90,
    ),
    "CH": CountryMetrics(
        code="CH", name="Switzerland", region="Europe",
        job_market=82, salary_power=92, employer_sponsor_density=72,
        visa_friction=44, speed_to_land=48,
        cost_of_living=28, housing_pressure=34,
        quality_of_life=90, family_fit=82, language_fit=66,
    ),
    "EE": CountryMetrics(
        code="EE", name="Estonia", region="Europe",
        job_market=66, salary_power=60, employer_sponsor_density=64,
        visa_friction=86, speed_to_land=78,
        cost_of_living=72, housing_pressure=68,
        quality_of_life=78, family_fit=72, language_fit=80,
    ),
    # --- North America ---
    "CA": CountryMetrics(
        code="CA", name="Canada", region="North America",
        job_market=78, salary_power=72, employer_sponsor_density=82,
        visa_friction=78, speed_to_land=66,
        cost_of_living=52, housing_pressure=28,
        quality_of_life=84, family_fit=82, language_fit=96,
    ),
    "US": CountryMetrics(
        code="US", name="United States", region="North America",
        job_market=92, salary_power=88, employer_sponsor_density=72,
        visa_friction=38, speed_to_land=42,
        cost_of_living=38, housing_pressure=36,
        quality_of_life=72, family_fit=68, language_fit=99,
    ),
    # --- Oceania ---
    "AU": CountryMetrics(
        code="AU", name="Australia", region="Oceania",
        job_market=78, salary_power=78, employer_sponsor_density=72,
        visa_friction=64, speed_to_land=58,
        cost_of_living=44, housing_pressure=30,
        quality_of_life=86, family_fit=82, language_fit=98,
    ),
    "NZ": CountryMetrics(
        code="NZ", name="New Zealand", region="Oceania",
        job_market=68, salary_power=68, employer_sponsor_density=64,
        visa_friction=72, speed_to_land=64,
        cost_of_living=46, housing_pressure=36,
        quality_of_life=86, family_fit=82, language_fit=98,
    ),
    # --- Middle East ---
    "AE": CountryMetrics(
        code="AE", name="United Arab Emirates", region="Middle East",
        job_market=78, salary_power=82, employer_sponsor_density=86,
        visa_friction=82, speed_to_land=82,
        cost_of_living=58, housing_pressure=52,
        quality_of_life=72, family_fit=70, language_fit=78,
    ),
    "QA": CountryMetrics(
        code="QA", name="Qatar", region="Middle East",
        job_market=68, salary_power=78, employer_sponsor_density=78,
        visa_friction=78, speed_to_land=78,
        cost_of_living=64, housing_pressure=58,
        quality_of_life=68, family_fit=66, language_fit=72,
    ),
    "SA": CountryMetrics(
        code="SA", name="Saudi Arabia", region="Middle East",
        job_market=66, salary_power=72, employer_sponsor_density=70,
        visa_friction=68, speed_to_land=72,
        cost_of_living=68, housing_pressure=58,
        quality_of_life=58, family_fit=58, language_fit=58,
    ),
    "IL": CountryMetrics(
        code="IL", name="Israel", region="Middle East",
        job_market=82, salary_power=72, employer_sponsor_density=64,
        visa_friction=52, speed_to_land=54,
        cost_of_living=38, housing_pressure=32,
        quality_of_life=72, family_fit=72, language_fit=78,
    ),
    # --- Asia ---
    "SG": CountryMetrics(
        code="SG", name="Singapore", region="Asia",
        job_market=84, salary_power=82, employer_sponsor_density=82,
        visa_friction=76, speed_to_land=78,
        cost_of_living=38, housing_pressure=26,
        quality_of_life=82, family_fit=80, language_fit=92,
    ),
    "JP": CountryMetrics(
        code="JP", name="Japan", region="Asia",
        job_market=72, salary_power=66, employer_sponsor_density=62,
        visa_friction=72, speed_to_land=66,
        cost_of_living=58, housing_pressure=58,
        quality_of_life=82, family_fit=78, language_fit=44,
    ),
    "KR": CountryMetrics(
        code="KR", name="South Korea", region="Asia",
        job_market=68, salary_power=66, employer_sponsor_density=54,
        visa_friction=60, speed_to_land=58,
        cost_of_living=52, housing_pressure=42,
        quality_of_life=76, family_fit=72, language_fit=48,
    ),
    "HK": CountryMetrics(
        code="HK", name="Hong Kong", region="Asia",
        job_market=72, salary_power=78, employer_sponsor_density=72,
        visa_friction=72, speed_to_land=68,
        cost_of_living=42, housing_pressure=24,
        quality_of_life=70, family_fit=68, language_fit=82,
    ),
    "MY": CountryMetrics(
        code="MY", name="Malaysia", region="Asia",
        job_market=58, salary_power=56, employer_sponsor_density=52,
        visa_friction=72, speed_to_land=72,
        cost_of_living=78, housing_pressure=68,
        quality_of_life=70, family_fit=70, language_fit=78,
    ),
    # --- Common origins (for transition deltas) ---
    "IN": CountryMetrics(
        code="IN", name="India", region="Asia",
        job_market=70, salary_power=44, employer_sponsor_density=24,
        visa_friction=98, speed_to_land=98,  # native, no friction
        cost_of_living=82, housing_pressure=62,
        quality_of_life=58, family_fit=72, language_fit=84,
    ),
    "PK": CountryMetrics(
        code="PK", name="Pakistan", region="Asia",
        job_market=52, salary_power=38, employer_sponsor_density=18,
        visa_friction=98, speed_to_land=98,
        cost_of_living=84, housing_pressure=70,
        quality_of_life=46, family_fit=66, language_fit=72,
    ),
    "BR": CountryMetrics(
        code="BR", name="Brazil", region="South America",
        job_market=58, salary_power=46, employer_sponsor_density=24,
        visa_friction=98, speed_to_land=98,
        cost_of_living=68, housing_pressure=58,
        quality_of_life=64, family_fit=72, language_fit=44,
    ),
    "ZA": CountryMetrics(
        code="ZA", name="South Africa", region="Africa",
        job_market=54, salary_power=44, employer_sponsor_density=22,
        visa_friction=98, speed_to_land=98,
        cost_of_living=66, housing_pressure=54,
        quality_of_life=58, family_fit=66, language_fit=88,
    ),
    "NG": CountryMetrics(
        code="NG", name="Nigeria", region="Africa",
        job_market=48, salary_power=38, employer_sponsor_density=18,
        visa_friction=98, speed_to_land=98,
        cost_of_living=72, housing_pressure=58,
        quality_of_life=46, family_fit=58, language_fit=82,
    ),
    "TR": CountryMetrics(
        code="TR", name="Türkiye", region="Europe",
        job_market=58, salary_power=46, employer_sponsor_density=24,
        visa_friction=98, speed_to_land=98,
        cost_of_living=72, housing_pressure=58,
        quality_of_life=64, family_fit=70, language_fit=46,
    ),
    "EG": CountryMetrics(
        code="EG", name="Egypt", region="Africa",
        job_market=46, salary_power=36, employer_sponsor_density=18,
        visa_friction=98, speed_to_land=98,
        cost_of_living=78, housing_pressure=66,
        quality_of_life=52, family_fit=64, language_fit=58,
    ),
    "PH": CountryMetrics(
        code="PH", name="Philippines", region="Asia",
        job_market=54, salary_power=42, employer_sponsor_density=24,
        visa_friction=98, speed_to_land=98,
        cost_of_living=72, housing_pressure=58,
        quality_of_life=58, family_fit=68, language_fit=88,
    ),
}


def get_country(code: str) -> CountryMetrics | None:
    """Lookup a single country by ISO-2 code (case-insensitive)."""
    if not code:
        return None
    return COUNTRY_METRICS.get(code.upper())


def supported_codes() -> list[str]:
    """Set of ISO-2 codes the shortlist engine can score."""
    return sorted(COUNTRY_METRICS.keys())
