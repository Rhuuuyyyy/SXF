---
id: ADR-005
title: "UUID to SERIAL Resolution — criado_por_db_id: int Replaces criado_por: UUID on the Patient Entity"
status: accepted
date: 2026-05-11
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - domain
  - patient
  - uuid
  - serial
  - identity
related:
  - "[[file_domain_entities_patient_py]]"
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# ADR-005 — UUID to SERIAL Resolution: `criado_por_db_id: int` on the Patient Entity

## Status

**Accepted** — 2026-05-11

---

## Context

The initial domain design for `Patient` included a `criado_por: UUID` field
intended to carry the creating doctor's domain identity. This assumed that
the `usuarios` (users/doctors) table used UUID as its primary key.

During Sprint 4, integration work revealed that `tb_usuarios` uses a
PostgreSQL `SERIAL` (integer sequence) primary key, not UUID. The JWT payload
carries `"sub": str(usuario_id)` where `usuario_id` is this integer. The
`get_current_doctor` dependency returns `AuthenticatedDoctor.usuario_id: int`.

The original `criado_por: UUID` field could not be populated from the JWT
without a database lookup to translate integer → UUID, introducing an
unnecessary round-trip and a cross-layer dependency.

---

## Decision

The `Patient` domain entity's creator field is renamed to
**`criado_por_db_id: int`** with a `Field(ge=1)` constraint.

The `_db_id` suffix is a **deliberate naming signal**: it acknowledges that
this field carries a database-infrastructure identity (integer PK) rather than
a domain identity (UUID). Pure domain purists might object; the team accepted
this pragmatic coupling because:

1. The field is write-once (set at construction time, never updated).
2. The domain entity never uses `criado_por_db_id` for domain logic —
   it is only passed through to the repository.
3. The alternative (a UUID layer for doctors) requires a table schema change
   and was out of scope.

```python
# Patient entity
criado_por_db_id: int = Field(ge=1)
```

```python
# RegisterPatientUseCase.execute()
patient = Patient(
    ...
    criado_por_db_id=usuario_db_id,  # directly from AuthenticatedDoctor.usuario_id
)
```

---

## Consequences

**Positive:**

- No database round-trip to resolve creator identity — the integer from the
  JWT is used directly.
- The `_db_id` suffix makes infrastructure coupling visible in code review;
  it cannot be accidentally treated as a domain-pure UUID.
- `Field(ge=1)` ensures the value is a valid positive integer at entity
  construction time; `0` or negative values raise a Pydantic `ValidationError`.

**Negative:**

- The `Patient` domain entity now carries a database-infrastructure primary
  key. This is a deliberate and documented violation of strict hexagonal
  purity.
- If `tb_usuarios` is ever migrated to UUID primary keys, this field and all
  downstream repository queries must be updated. An ADR update will be required.
- Read repositories must join on the integer `criado_por` column, which is
  exposed in repository SQL — `WHERE criado_por = :usuario_id`.

---

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Keep `criado_por: UUID` and resolve int→UUID in the router | Adds a DB lookup per request in the presentation layer; routers must not hit the DB directly. |
| Keep `criado_por: UUID` and resolve in the use case | Adds a `UserRepository` dependency to `RegisterPatientUseCase` solely for ID translation; unnecessary coupling. |
| Migrate `tb_usuarios` to UUID primary key | Schema change, data migration, and JWT payload change all out of Sprint 4 scope. |
| Remove the creator field entirely and set it via a DB trigger | Trigger would need the integer from the session context; feasible but adds another Active DB dependency for what is a simple application concern. |

---

## Implementation Notes

- `Patient` is in `app/domain/entities/patient.py`.
- `RegisterPatientUseCase.execute()` in `app/application/use_cases/register_patient.py`
  receives `usuario_db_id: int` as a parameter (not extracted from JWT
  internally — the router extracts it from `AuthenticatedDoctor` and passes it
  in). This keeps the use case testable without JWT infrastructure.
- Read repositories use `WHERE criado_por = :usuario_id` for RBAC scoping;
  this integer column maps directly to `criado_por_db_id` on the entity.

#adr #domain #patient #uuid #serial #identity
