---
title: patient_repository.py
type: File
status: Active
language: python
path: app/interfaces/repositories/patient_repository.py
created_date: 2026-05-03
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - patient
  - sqlalchemy
  - adapter
related:
  - "[[file_domain_entities_patient_py]]"
  - "[[file_db_database_py]]"
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/interfaces/repositories/patient_repository.py` — Patient Persistence Adapter

## Context & Purpose

Concrete adapter that persists `Patient` entities via the `pacientes` DB view.
Uses `sqlalchemy.text()` exclusively — no ORM models for views. CPF is stored
only as SHA-256 hash; raw CPF never reaches the DB (LGPD compliance).

## Logic Breakdown

**`PatientRepository.__init__(session)`** — receives the request-scoped `AsyncSession`.

**`add(patient) -> Patient`**
- INSERT into `pacientes` with all demographic fields.
- `criado_por`: `patient.criado_por_db_id` (integer, FK to `usuarios.id`).
- CPF stored as `patient.cpf.sha256_hex` or `None`.
- Returns the same entity (id was set on entity creation).

**`get_by_id(entity_id) -> Patient | None`**
- SELECT all columns from `pacientes WHERE id = :id`.
- Returns `None` if not found; calls `_row_to_patient`.

**`get_by_cpf(cpf) -> Patient | None`**
- SELECT via `cpf_hash = :cpf_hash` — uses SHA-256 hash for lookup.

**`_row_to_patient(row) -> Patient`**
- Maps `RowMapping` to `Patient` entity.
- `cpf = None` (SHA-256 is one-way; cannot reconstruct original).
- `criado_por_db_id = cast(int, r["criado_por"])` — integer FK.

## Sprint 4 change
`criado_por_db_id: int` replaces the former `criado_por: UUID` field.
The `pacientes` table stores an integer FK to `usuarios.id` (SERIAL),
not a UUID. The domain entity now explicitly models this as a Foreign Key Value.

## Dependencies
- **External:** `sqlalchemy[asyncio]`.
- **Internal:** [[file_domain_entities_patient_py]], [[file_domain_value_objects_cpf_py]].

## Consumers
- [[file_application_use_cases_register_patient_py]]
- [[file_presentation_routers_patients_py]]

## Invariants / Pitfalls
- `sqlalchemy.text()` only — no ORM models.
- CPF query always hashes before comparison — never query raw CPF.
- `_row_to_patient` always sets `cpf=None`; CPF is write-only at this layer.
- The `pacientes` target is a view; INSERT must be directed to the underlying
  table or a writable view.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]

#file #interfaces #repository #patient #adapter
