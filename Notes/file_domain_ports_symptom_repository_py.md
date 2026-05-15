---
title: symptom_repository.py (port)
type: File
status: Active
language: python
path: app/domain/ports/symptom_repository.py
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
  - symptom
  - catalogue
  - repository
related:
  - "[[file_domain_entities_symptom_py]]"
  - "[[file_domain_entities_checklist_response_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[009_Scoring_Engine_Design]]"
---

# `app/domain/ports/symptom_repository.py` — ISymptomRepository Port

## Context & Purpose

Persistence contract for the [[file_domain_entities_symptom_py]]
catalogue. Different from the per-patient ports in two ways:

1. **Read-mostly.** The catalogue is loaded once per process and
   refreshed when an admin updates it; latency is dominated by reads,
   not writes. Adapters are encouraged (but not required) to memoise.
2. **No PII.** Symptoms describe traits, not people, so the security
   posture is much lighter than for [[file_domain_ports_patient_repository_py]].

## Logic Breakdown

```python
class ISymptomRepository(Protocol):
    async def get(self, symptom_id: UUID) -> Symptom | None: ...
    async def get_by_code(self, code: str) -> Symptom | None: ...
    async def list_active(self) -> list[Symptom]: ...
    async def list_by_category(
        self, category: SymptomCategory
    ) -> list[Symptom]: ...
    async def add(self, symptom: Symptom) -> Symptom: ...
    async def update(self, symptom: Symptom) -> Symptom: ...
```

Method semantics:

- **`get`** — UUID lookup.
- **`get_by_code`** — clinical literature cross-reference path; the
  catalogue's `code` is the stable external identifier
  (e.g. `PHYS_001`).
- **`list_active`** — used to render the anamnesis form on the FE; only
  active items.
- **`list_by_category`** — used to group items in the UI.
- **`add` / `update`** — admin paths; v1 may not expose these via
  HTTP (catalogue managed by migrations or a CLI). The Port keeps the
  shape so future admin endpoints don't require a Port revision.

## Dependencies
- **Internal:** [[file_domain_entities_symptom_py]] (entity + enums).
- **External:** `typing.Protocol`, `uuid` only.

## Consumers
- Future `LoadAnamnesisFormUseCase`, `ListCatalogueUseCase`.
- Future `SymptomScoringService` — reads the catalogue at scoring
  time (or the use case loads it once and passes to the service).
- Future infrastructure adapter (SQLAlchemy, owned by [[DBA_Team]]).
- Test fakes (`InMemorySymptomRepository`).

## Invariants / Pitfalls
- **`is_active` filtering is the adapter's job** for `list_active`.
  Don't push it into use cases — that scatters the policy.
- **Caching is allowed but invisible.** If the adapter caches, it must
  invalidate on `add`/`update`. The Port itself says nothing about
  caching — it's an implementation detail.
- **Codes are case-sensitive** by convention (`PHYS_001`, not
  `phys_001`). The adapter MUST NOT normalise case silently.
- **No `delete`.** Use `update(symptom)` with `is_active=False` to
  preserve historical references from past `ChecklistResponse`s.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #port #protocol #symptom #catalogue
