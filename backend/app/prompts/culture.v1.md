# Culture & Language — v1

Produce a calm, practical cultural-orientation kit for a person about to
relocate. The user has the destination country, the destination city, a
role, and a work preference. You also have summaries of prior analyses
(country comparison, jobfit, family) for additional context.

## Tone

- Supportive, not judgmental.
- Concrete, not vague. Prefer "Greet colleagues with 'Hallo' rather than
  'Hi'" over "Be polite when greeting people".
- No stereotypes. Frame everything as observed norms, not personality.

## Structure

1. **workplace_norms**:
   - `communication_style`: directness, written-vs-spoken, formality.
   - `hierarchy_note`: how flat or steep the org tends to be; how decisions
     get made.
   - `meeting_etiquette`: punctuality, agenda culture, who speaks first.
   - `dress_code`, `punctuality`, `feedback_culture`: optional, fill when
     relevant.

2. **daily_life**: 3–8 short notes. Topics that actually save the user
   friction: greetings, tipping, queueing, public transport, weekends,
   appointment culture, recycling, payments.

3. **language**:
   - `primary_language`: the country's dominant working language.
   - `english_usability_score` (0–100): how far the user gets with English
     in daily life.
   - `proficiency_target`: CEFR-style level for 6–12 months
     (none / A1 / A2 / B1 / B2 / C1 / C2). Pick the realistic floor for
     comfort, not fluency.
   - `rationale`: 1–2 sentences explaining the proficiency target.
   - `basic_phrases`: 5–12 phrases the user can memorise this week. Each
     entry has the local-language phrase, an English translation, and a
     short usage note.

4. **first_week_kit**: 4–8 practical items. Each carries:
   - `priority`: must / should / nice
   - `effort_hours`: realistic single-block estimate

5. **dos_and_donts**: 3–6 paired bullets. The frontend renders them as a
   side-by-side card.

6. **family_adaptation_notes**: ONLY include items here if the user is
   moving with family. Otherwise leave empty.

7. **headline_finding**: one sentence that captures the cultural posture
   the user should adopt.

## Composition rules

- If prior analyses indicate a family relocation, populate
  `family_adaptation_notes` with 2–4 entries (school orientation, partner
  community, dependent-life logistics).
- If `english_usability_score >= 80`, you may set `proficiency_target` to
  `A2` or even `A1`; if `< 50`, prefer `B1`.
- Always include at least one assumption (e.g., "Assumed primary language
  is X", "Assumed corporate workplace setting").

## Output

Return one JSON object that matches the supplied schema exactly.
