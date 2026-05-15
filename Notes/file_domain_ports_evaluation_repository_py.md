---
title: evaluation_repository.py (port)
type: File
status: Active
language: python
path: app/domain/ports/evaluation_repository.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - port
  - protocol
  - evaluation
  - consultation
  - repository
related:
  - "[[file_domain_entities_evaluation_py]]"
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_entities_user_py]]"
  - "[[file_domain_ports_checklist_response_repository_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/domain/ports/evaluation_repository.py` — IEvaluationRepository Port

## Context & Purpose

Persistence contract for the [[file_domain_entities_evaluation_py]]
aggregate. Drives the consultation-history and dashboard endpoints, plus
the doctor's daily list of pending evaluations.

## Logic Breakdown

```python
class IEvaluationRepository(Protocol):
    async def get(self, evaluation_id: UUID) -> Evaluation | None: ...
    async def add(self, evaluation: Evaluation) -> Evaluation: ...
    async def update(self, evaluation: Evaluation) -> Evaluation: ...
    async def list_by_patient(
        self, patient_id: UUID
    ) -> list[Evaluation]: ...
    async def list_by_doctor(
        self, doctor_id: UUID, *, limit: int = 50, offset: int = 0,
    ) -> list[Evaluation]: ...
```

Method semantics:

- **`get`** — UUID lookup.
- **`add`** — insert a new consultation record.
- **`update`** — used by the scoring engine when `attach_score` runs,
  and by the doctor when editing notes after the fact.
- **`list_by_patient`** — full chronological history for the patient
  detail screen. Not paginated in v1; a patient is unlikely to have
  more than a few dozen evaluations. If that changes, add pagination
  in a later ADR.
- **`list_by_doctor`** — paginated; powers the doctor's "my
  consultations" screen and the admin dashboard.

## Dependencies
- **Internal:** [[file_domain_entities_evaluation_py]].
- **External:** `typing.Protocol`, `uuid` only.

## Consumers
- Future `OpenEvaluationUseCase`, `CompleteEvaluationUseCase`,
  `GetPatientHistoryUseCase`, `MyConsultationsUseCase`.
- Future infrastructure adapter (SQLAlchemy, owned by [[DBA_Team]]).
- Test fakes (`InMemoryEvaluationRepository`).

## Invariants / Pitfalls
- **An Evaluation is referenced by a `ChecklistResponse` 1:1.** The
  repository does NOT cascade delete to the response; the application
  layer orchestrates it. The Port keeps responsibilities narrow.
- **`list_by_patient` returns chronological order** (oldest first by
  convention). Adapters that change the order must surface that as a
  parameter, not silently.
- **`update` is full replacement.** Field-level patches happen at the
  use-case layer (load, mutate, save).
- **No `delete`.** Same LGPD reasoning as the other ports — clinical
  records are immutable history.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #port #protocol #evaluation #repository
