---
title: evaluation.py (entity)
type: File
status: Active
language: python
path: app/domain/entities/evaluation.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - evaluation
  - consultation
  - clinical
  - pydantic
related:
  - "[[file_domain_ports_evaluation_repository_py]]"
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_entities_user_py]]"
  - "[[file_domain_entities_checklist_response_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[009_Scoring_Engine_Design]]"
---

# `app/domain/entities/evaluation.py` — Evaluation Entity

## Context & Purpose

An `Evaluation` represents **one consultation** between a doctor and a
patient. It is the clinical envelope around the qualitative observations
the doctor records and the quantitative outcome derived from the
[[file_domain_entities_checklist_response_py]].

Splitting `Evaluation` from `ChecklistResponse` lets us:

- Keep the consultation envelope visible even before the checklist is
  filled in (a doctor may register the visit and complete the form later).
- Re-score historical evaluations when the catalogue changes
  ([[009_Scoring_Engine_Design]] *(planned)*).
- Model future clinical artefacts (lab orders, follow-up notes) attached
  to the Evaluation without bloating the checklist aggregate.

## Logic Breakdown

Public symbols:

- **`ScoreBand(StrEnum)`** — `low` | `moderate` | `high`. The discrete
  output of the scoring engine; the FE renders it as a colour band on
  the result screen.
- **`Recommendation(StrEnum)`** — `none` | `follow_up` | `genetic_test`
  | `therapy_referral`. Aligns with the clinical decision-support
  outputs described in [[001_Architecture_and_Context]].
- **`Evaluation(BaseModel)`** —
    - `id: UUID`.
    - `patient_id: UUID` — link to [[file_domain_entities_patient_py]].
    - `doctor_id: UUID` — link to [[file_domain_entities_user_py]] with
      role `DOCTOR`.
    - `consultation_date: datetime`.
    - `chief_complaint: str` — ≤2000 chars, optional free text.
    - `clinical_observations: str` — ≤4000 chars, optional free text.
    - `score_value: int | None` — non-negative; nullable until scoring runs.
    - `score_band: ScoreBand | None` — set together with `score_value`.
    - `recommendation: Recommendation` — defaults to `NONE`.
    - `created_at`, `updated_at: datetime` (UTC).

Behaviours:

- `attach_score(value, band, recommendation)` — keyword-only API; the
  scoring service is the *only* legitimate caller. Sets the trio
  atomically and bumps `updated_at`.
- `is_scored: bool` (property) — true iff both `score_value` and
  `score_band` are present. Use this instead of testing `None` ad hoc
  at call sites.

## Dependencies
- **Internal:** none.
- **External:** `pydantic` v2, `enum.StrEnum`, `datetime`, `uuid`.

## Consumers
- [[file_domain_ports_evaluation_repository_py]] — persistence Port.
- [[file_domain_entities_checklist_response_py]] (links via
  `evaluation_id`).
- Future `SubmitEvaluationUseCase`, `ReviewEvaluationUseCase`.
- Future `SymptomScoringService` — calls `attach_score` after computation.

## Invariants / Pitfalls
- **Score trio is atomic.** Setting any of `score_value`, `score_band`,
  `recommendation` outside `attach_score` risks an inconsistent state
  (e.g. value present, band missing). Prefer `attach_score`.
- **`updated_at` is bumped only by `attach_score`.** Future mutations
  (rare) must follow the same pattern or move to a dedicated method.
- **Free-text fields are PII-adjacent.** `chief_complaint` and
  `clinical_observations` may contain sensitive info — same redaction
  rules as [[file_domain_entities_patient_py]] (see
  [[006_LGPD_PII_Strategy]]).
- **Doctor identity is by id**, not embedded. Joins happen in the
  repository or in a use case that needs the User row.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #entity #evaluation #clinical
