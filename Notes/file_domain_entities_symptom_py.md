---
title: symptom.py (entity)
type: File
status: Active
language: python
path: app/domain/entities/symptom.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - symptom
  - catalogue
  - fxs
  - pydantic
related:
  - "[[file_domain_ports_symptom_repository_py]]"
  - "[[file_domain_entities_checklist_response_py]]"
  - "[[file_domain_entities_evaluation_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[009_Scoring_Engine_Design]]"
---

# `app/domain/entities/symptom.py` — Symptom Catalogue Entity

## Context & Purpose

A `Symptom` is one **catalogue entry** in the FXS anamnesis questionnaire
— a single trait the doctor toggles present/absent on a
[[file_domain_entities_checklist_response_py]]. The catalogue is
**read-mostly**: clinicians introduce new symptoms occasionally; the v1
HTTP surface does not expose creation to end users.

Symptoms are *first-class domain objects*, not magic strings, because:

1. **Versioning.** When a symptom's `weight` changes, every past
   evaluation must remain reproducible. The id pins the rule to a
   specific entity row.
2. **Decision support.** The future `SymptomScoringService` reads the
   catalogue at scoring time; treating symptoms as data avoids hard-
   coding the scientific protocol in code.
3. **Localisation / clinical updates** without redeploys.

## Logic Breakdown

Public symbols:

- **`SymptomCategory(StrEnum)`** — `physical` | `behavioral` |
  `cognitive` | `family_history`. Top-level grouping the FE renders.
- **`AgeRelevance(StrEnum)`** — `pediatric` | `adult` | `any`. The
  applicability cutoff is 18 years (see `applies_to_age`).
- **`Symptom(BaseModel)`** —
    - `id: UUID`.
    - `code: str` — stable external identifier (e.g. `PHYS_001`),
      1–32 chars. Used by clinical literature/cross-references.
    - `name: str` — human-readable label, 2–120 chars.
    - `description: str` — long form (≤2000 chars), defaults to empty.
    - `category: SymptomCategory`.
    - `weight: int` — risk contribution, integer 0–10. Bounded so the
      total score has a deterministic ceiling per evaluation.
    - `age_relevance: AgeRelevance` — defaults to `ANY`.
    - `is_active: bool` — soft-disable; the catalogue keeps history.

Behaviour:

- `applies_to_age(age_years: int) -> bool` — gating helper used by the
  future `SymptomScoringService` so paediatric-only items don't pollute
  adult scores and vice versa.

## Dependencies
- **Internal:** none.
- **External:** `pydantic` v2, `enum.StrEnum`, `uuid`.

## Consumers
- [[file_domain_ports_symptom_repository_py]] — persistence Port.
- [[file_domain_entities_checklist_response_py]] — references symptoms
  by `symptom_id`.
- Future `SymptomScoringService` (domain service).

## Invariants / Pitfalls
- **`weight` is bounded 0–10** by design. Don't loosen the upper bound
  without revisiting the scoring engine's banding thresholds in
  [[009_Scoring_Engine_Design]] *(planned)*.
- **Soft-disable, never hard-delete.** Deleting a symptom would break
  reproducibility of past `Evaluation`s that referenced it. The Port's
  `update` method is the deactivation path.
- **`code` should be considered immutable** once an entry has been used
  in any `ChecklistResponse`. Renaming a code retroactively changes
  meaning of historical answers.
- The age cutoff of 18 is policy, not biology — change it in `applies_to_age`
  and add an ADR if the clinical team asks.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #entity #symptom #catalogue
