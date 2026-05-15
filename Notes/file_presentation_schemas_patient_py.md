---
title: patient.py (schemas)
type: File
status: Active
language: python
path: app/presentation/api/v1/schemas/patient.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - patient
  - lgpd
related:
  - "[[file_presentation_routers_patients_py]]"
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[file_domain_entities_patient_py]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/schemas/patient.py` — Patient HTTP Schemas

## Context & Purpose

Pydantic request/response schemas for the patient registration endpoint.
LGPD boundary: `PatientResponse` never exposes the raw name or CPF.

## Logic Breakdown

**`AcompanhanteCreateRequest`** — optional caregiver data embedded in registration:
- `nome: str`, `cpf: str | None`, `telefone: str`, `email: str`.

**`PatientCreateRequest`** — full registration payload:
- Demographic fields matching `tb_pacientes` columns.
- `sexo: str` validated by regex `^(M|F|I)$`.
- `etnia: str` — validated against `Etnia` enum by the use case.
- `acompanhante: AcompanhanteCreateRequest | None`.

**`PatientResponse`** — LGPD-safe API response:
- `id: UUID` — internal domain identity.
- `nome_masked: str` — first name kept; subsequent parts masked (e.g. `João S***`).
- `sexo`, `etnia`, `uf_residencia`, `criado_por_db_id`.
- CPF never returned.

**`PatientListItemSchema`** (Sprint 6) — one row in the patient list:
- `id: int`, `nome: str`, `sexo: str | None`, `data_nascimento: str | None`.

**`PatientListResponse`** (Sprint 6) — paginated list response:
- `items: list[PatientListItemSchema]`, `total`, `limit`, `offset`.

## Dependencies
- **External:** `pydantic` v2.

## Consumers
- [[file_presentation_routers_patients_py]] — request/response types.
- [[file_application_use_cases_register_patient_py]] — receives `PatientCreateRequest`.
- [[file_application_use_cases_get_patient_list_py]] — result serialised via `PatientListResponse`.

## Invariants / Pitfalls
- `extra="forbid"` on all models prevents undocumented fields from leaking
  through the API — required for LGPD data minimisation.

## Related ADRs
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]

#file #presentation #schemas #patient #lgpd
