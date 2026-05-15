---
title: checklist_response.py (entity)
type: File
status: Active
language: python
path: app/domain/entities/checklist_response.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - checklist
  - anamnesis
  - aggregate
  - pydantic
related:
  - "[[file_domain_ports_checklist_response_repository_py]]"
  - "[[file_domain_entities_evaluation_py]]"
  - "[[file_domain_entities_symptom_py]]"
  - "[[file_domain_entities_user_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[009_Scoring_Engine_Design]]"
---

# `app/domain/entities/checklist_response.py` — ChecklistResponse Entity

## Context & Purpose

A `ChecklistResponse` is the **anamnesis form** filled in during one
[[file_domain_entities_evaluation_py]]: per-symptom answers plus the
computed total score. Modelled as an aggregate that owns its
`ChecklistItem`s so consistency rules (no duplicate symptoms, monotonic
score) live in a single place.

The actual *score computation* belongs to a future domain service
([[009_Scoring_Engine_Design]] *(planned)*) so that the entity stays pure
data + small invariants. This separation lets us re-score retroactively
when the scoring algorithm evolves.

## Logic Breakdown

Public symbols:

- **`ChecklistItem(BaseModel)`** —
    - `symptom_id: UUID` — reference to a
      [[file_domain_entities_symptom_py]] catalogue entry.
    - `is_present: bool`.
    - `notes: str` — ≤500 chars; doctor's qualifier.
- **`ChecklistResponse(BaseModel)`** —
    - `id: UUID`.
    - `evaluation_id: UUID` — link to
      [[file_domain_entities_evaluation_py]].
    - `items: list[ChecklistItem]` — defaults to `[]`.
    - `total_score: int` (≥0) — computed externally; set explicitly.
    - `score_band: ScoreBand | None` — same as on `Evaluation`; both are
      kept for query convenience.
    - `submitted_by_user_id: UUID` — link to
      [[file_domain_entities_user_py]].
    - `submitted_at: datetime` (UTC).

Behaviours:

- `add_item(item)` — appends a `ChecklistItem` and **rejects duplicates**
  by `symptom_id`. Without this guard a doctor could double-count a
  positive symptom and inflate the score.
- `positive_count: int` (property) — number of items with
  `is_present=True`. Cheap O(n); useful for the FE summary card.

## Pydantic configuration

`ChecklistResponse` uses `validate_assignment=True` so the
`total_score >= 0` invariant is re-checked on assignment, not just at
construction.

## Dependencies
- **Internal:** [[file_domain_entities_evaluation_py]] — imports
  `ScoreBand` to keep one definition of the enum.
- **External:** `pydantic` v2, `datetime`, `uuid`.

## Consumers
- [[file_domain_ports_checklist_response_repository_py]] — persistence
  Port.
- Future `SubmitChecklistUseCase`, `ReScoreEvaluationUseCase`.
- Future `SymptomScoringService` reads `items` to compute
  `total_score` and `score_band`, then calls `Evaluation.attach_score`.

## Invariants / Pitfalls
- **No duplicate symptoms.** `add_item` enforces it; do not bypass by
  mutating `items` directly. A future ADR may move to a `dict` keyed
  by `symptom_id` for O(1) duplicate checks.
- **`total_score` is set externally**, never derived inside the entity.
  This keeps the entity scoring-algorithm-agnostic and lets
  [[009_Scoring_Engine_Design]] evolve without touching this file.
- **Re-importing `ScoreBand`** from `evaluation` is intentional — it
  keeps the bands defined in one place. Do not duplicate.
- **Free-text `notes`** can leak PII; the same redaction policy from
  [[file_domain_entities_patient_py]] applies before logging.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #entity #checklist #anamnesis
