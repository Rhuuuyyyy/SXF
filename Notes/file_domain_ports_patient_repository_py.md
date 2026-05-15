---
title: patient_repository.py (port)
type: File
status: Active
language: python
path: app/domain/ports/patient_repository.py
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
  - patient
  - repository
  - dba-interface
related:
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_ports_user_repository_py]]"
  - "[[file_domain_ports_evaluation_repository_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/domain/ports/patient_repository.py` — IPatientRepository Port

## Context & Purpose

Persistence contract for the [[file_domain_entities_patient_py]]
aggregate. Critical for two integration tracks:

1. **DBA team** implements this Protocol against PostgreSQL. CPF is
   stored pseudonymised (HMAC); the adapter must hash before
   `get_by_cpf` queries.
2. **Frontend team** sees the *shape* indirectly via response schemas
   that adapt this entity. The `list_by_doctor` paging shape becomes the
   patient-list endpoint contract.

## Logic Breakdown

```python
class IPatientRepository(Protocol):
    async def get(self, patient_id: UUID) -> Patient | None: ...
    async def get_by_cpf(self, cpf: str) -> Patient | None: ...
    async def add(self, patient: Patient) -> Patient: ...
    async def update(self, patient: Patient) -> Patient: ...
    async def list_by_doctor(
        self, doctor_id: UUID, *, limit: int = 50, offset: int = 0,
    ) -> list[Patient]: ...
```

Method semantics:

- **`get`** — primary-key lookup; returns `None` for missing.
- **`get_by_cpf`** — second-most-common access path (incoming
  referrals quote CPF). Adapter MUST pseudonymise the input before
  the query — the column never stores raw CPF; see
  [[006_LGPD_PII_Strategy]].
- **`add`** — insert; uniqueness on CPF is enforced by the persistence
  layer; the use case translates the conflict to `ConflictError`.
- **`update`** — replace mutable fields by `id`.
- **`list_by_doctor`** — paginated, scoped by the registering doctor.
  Doctors see only their own patients in v1 (RBAC; see
  [[009_Authorization_RBAC]] *(planned)*).

## Dependencies
- **Internal:** [[file_domain_entities_patient_py]].
- **External:** `typing.Protocol`, `uuid` only.

## Consumers
- Future `RegisterPatientUseCase`, `GetPatientHistoryUseCase`,
  `ListMyPatientsUseCase`.
- Future infrastructure adapter (SQLAlchemy, owned by [[DBA_Team]]).
- Test fakes (`InMemoryPatientRepository`).

## Invariants / Pitfalls
- **Pseudonymise CPF before query.** Querying by raw CPF defeats the
  pseudonymisation scheme. The adapter contract for `get_by_cpf` is:
  *"hash the input with the configured pepper, then SELECT"*.
- **No `delete`.** LGPD-compliant deletion is pseudonymise +
  archive — implemented in a future use case, not on the Port.
- **Pagination defaults are sensible**, not unbounded. A
  `limit > 200` should raise; that bound lives in the future use case.
- **Doctor scoping is at the Port** intentionally — moving it into the
  use case would let a buggy caller bypass the invariant.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]
- [[009_Authorization_RBAC]] *(planned)*

#file #domain #port #protocol #patient #repository
