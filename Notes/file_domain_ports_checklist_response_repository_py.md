---
title: checklist_response_repository.py (port)
type: File
status: Active
language: python
path: app/domain/ports/checklist_response_repository.py
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
  - checklist
  - anamnesis
  - repository
related:
  - "[[file_domain_entities_checklist_response_py]]"
  - "[[file_domain_entities_evaluation_py]]"
  - "[[file_domain_ports_evaluation_repository_py]]"
  - "[[file_domain_ports_symptom_repository_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[009_Scoring_Engine_Design]]"
---

# `app/domain/ports/checklist_response_repository.py` — IChecklistResponseRepository Port

## Context & Purpose

Persistence contract for the [[file_domain_entities_checklist_response_py]]
aggregate. The smallest of the repository ports because the entity is
1:1 with [[file_domain_entities_evaluation_py]] — there is no listing
endpoint that returns multiple responses; the response is always
fetched via its evaluation.

## Logic Breakdown

```python
class IChecklistResponseRepository(Protocol):
    async def get(self, response_id: UUID) -> ChecklistResponse | None: ...
    async def get_by_evaluation(
        self, evaluation_id: UUID
    ) -> ChecklistResponse | None: ...
    async def add(self, response: ChecklistResponse) -> ChecklistResponse: ...
    async def update(self, response: ChecklistResponse) -> ChecklistResponse: ...
```

Method semantics:

- **`get`** — UUID lookup; rare, mostly admin/audit.
- **`get_by_evaluation`** — the canonical access path; an evaluation
  has exactly one response.
- **`add`** — insert; uniqueness on `evaluation_id` enforced by the
  persistence layer (one response per evaluation).
- **`update`** — replace the items list and recomputed score after
  re-scoring. Not exposed via HTTP in v1; only the scoring engine
  calls it.

## Dependencies
- **Internal:** [[file_domain_entities_checklist_response_py]].
- **External:** `typing.Protocol`, `uuid` only.

## Consumers
- Future `SubmitChecklistUseCase`, `ReScoreEvaluationUseCase`.
- Future `SymptomScoringService` — reads via `get_by_evaluation`,
  writes via `update`.
- Future infrastructure adapter (SQLAlchemy, owned by [[DBA_Team]]).
- Test fakes (`InMemoryChecklistResponseRepository`).

## Invariants / Pitfalls
- **One response per evaluation.** Adapters MUST enforce uniqueness on
  `evaluation_id`; double submission would silently corrupt scoring
  history.
- **No `delete`.** The form is part of the clinical record; deletion is
  done at the evaluation level (and is itself absent from the Port —
  see [[file_domain_ports_evaluation_repository_py]]).
- **`add` is idempotent at the use-case layer**, not the Port — the use
  case decides whether re-submission is treated as `update` or as a
  conflict. The Port stays mechanical.
- **`items` ordering is preserved** by the adapter; the FE renders in
  insertion order. SQL adapters using `JSONB` get this for free; row-
  per-item adapters need an explicit sort column.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #port #protocol #checklist #repository
