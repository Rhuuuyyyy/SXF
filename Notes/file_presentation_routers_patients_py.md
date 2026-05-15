---
title: patients.py (router)
type: File
status: Active
language: python
path: app/presentation/api/v1/routers/patients.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - patient
  - lgpd
related:
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[file_presentation_schemas_patient_py]]"
  - "[[file_db_database_py]]"
  - "[[file_root_main_py]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/routers/patients.py` — Patient Registration & Listing Router

## Context & Purpose

Exposes `POST /api/v1/pacientes` (registration) and `GET /api/v1/pacientes`
(listing) for patient records. Both require a valid Bearer JWT. Wires use cases
with concrete repository adapters.

## Logic Breakdown

**`GET /api/v1/pacientes`** — `list_patients` (Sprint 6):
1. Authenticates via `Depends(get_current_doctor)`.
2. Accepts optional query params: `nome` (ILIKE partial), `cpf` (raw digits),
   `limit` (1–200, default 50), `offset` (default 0).
3. Builds `GetPatientListUseCase` with `PatientReadRepository`.
4. Use case hashes `cpf` internally; passes `cpf_hash_filter` to repo.
5. Returns `PatientListResponse` with HTTP 200.

**`POST /api/v1/pacientes`** — `register_patient`:
1. Receives `PatientCreateRequest` payload.
2. Authenticates via `Depends(get_current_doctor)` — HTTP 401 if missing/invalid token.
3. Builds `RegisterPatientUseCase` with `PatientRepository` + `AcompanhanteRepository`.
4. Calls `use_case.execute(request, usuario_db_id=doctor.usuario_id)`.
5. Masks `full_name` in the response per LGPD: `"João Silva"` → `"João S***"`.
6. Returns `PatientResponse` with HTTP 201.

**LGPD masking logic:**
```python
nome_parts = patient.full_name.split()
nome_masked = (
    nome_parts[0] + " " + " ".join(p[0] + "***" for p in nome_parts[1:])
    if len(nome_parts) > 1
    else patient.full_name[0] + "***"
)
```

## Dependencies
- **Internal:**
  - [[file_application_use_cases_register_patient_py]]
  - [[file_application_use_cases_get_patient_list_py]]
  - [[file_interfaces_api_dependencies_py]] (`AuthenticatedDoctor`, `get_current_doctor`)
  - [[file_interfaces_repositories_patient_repository_py]]
  - [[file_interfaces_repositories_patient_read_repository_py]]
  - [[file_interfaces_repositories_acompanhante_repository_py]]
  - [[file_presentation_schemas_patient_py]]
  - [[file_db_database_py]]
- **External:** `fastapi`, `sqlalchemy[asyncio]`.

## Consumers
- [[file_root_main_py]] — `app.include_router(patients.router, prefix=settings.api_prefix)`.

## Invariants / Pitfalls
- `ValueError` from the use case (e.g. invalid enum value) maps to HTTP 422.
- The router MUST NOT contain business logic — validation lives in the entity,
  orchestration in the use case.
- `doctor.usuario_id` from the verified JWT replaces any client-supplied creator
  field — the client cannot forge the creator identity.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]

#file #presentation #router #patient #lgpd
