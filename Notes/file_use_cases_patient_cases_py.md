---
title: patient_cases.py
type: File
status: Planned
language: python
path: app/use_cases/patient_cases.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - use-cases
  - patient
  - clinical
  - command
related:
  - "[[file_services_patient_service_py]]"
  - "[[file_domain_models_patient_py]]"
  - "[[file_domain_schemas_patient_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[007_Audit_Logging_Middleware]]"
---

# `app/use_cases/patient_cases.py` — Clinical Use Cases

## Context & Purpose

Hosts the patient-facing use cases consumed by HTTP routers. Each class is a
**named clinical intent** wired to one HTTP endpoint:

| Use case | HTTP route | Service |
|---|---|---|
| `RegisterPatientUseCase` | `POST /api/v1/patients` | [[file_services_patient_service_py]] |
| `SubmitAnamnesisUseCase` | `POST /api/v1/patients/{id}/anamneses` | [[file_services_patient_service_py]] |
| `GetPatientHistoryUseCase` | `GET /api/v1/patients/{id}/history` | [[file_services_patient_service_py]] |
| `GenerateStatisticsUseCase` *(planned)* | `GET /api/v1/statistics` | [[file_services_patient_service_py]] |

## Logic Breakdown

```python
from uuid import UUID

from app.domain.models.patient import Patient
from app.domain.schemas.patient import (
    AnamnesisCreate,
    PatientCreate,
    PatientHistory,
    PatientResponse,
)
from app.services.patient_service import PatientService


class RegisterPatientUseCase:
    def __init__(self, service: PatientService) -> None:
        self._service = service

    async def execute(self, payload: PatientCreate) -> PatientResponse:
        entity = await self._service.register(payload)
        return PatientResponse.model_validate(entity, from_attributes=True)


class SubmitAnamnesisUseCase:
    def __init__(self, service: PatientService) -> None:
        self._service = service

    async def execute(
        self,
        patient_id: UUID,
        payload: AnamnesisCreate,
    ) -> PatientResponse:
        anamnesis = payload.to_entity()
        patient, _alert = await self._service.submit_anamnesis(patient_id, anamnesis)
        return PatientResponse.model_validate(patient, from_attributes=True)


class GetPatientHistoryUseCase:
    def __init__(self, service: PatientService) -> None:
        self._service = service

    async def execute(self, patient_id: UUID) -> PatientHistory:
        patient = await self._service.get_history(patient_id)
        return PatientHistory.from_entity(patient)
```

Key choices:

- **One class per intent.** Trivial classes are deliberate — they give the
  router a stable injection target, and tests a clean unit boundary.
- **Schema in, schema out.** Use cases own the boundary translation;
  routers stay declarative.
- **No DB import.** The service holds the repository; the use case never
  knows there is a database.

## Dependencies
- **Internal:** [[file_services_patient_service_py]],
  [[file_domain_schemas_patient_py]], [[file_domain_models_patient_py]].
- **External:** standard library only (no FastAPI).

## Consumers
- The patient APIRouter in `interfaces/api/v1/routers/patients.py`
  *(planned)*; provides via [[file_interfaces_api_dependencies_py]]
  factories.

## Invariants / Pitfalls
- **No HTTP details inside.** A use case that raises `HTTPException` is a
  layering violation.
- The mask-on-response rule from [[file_domain_schemas_patient_py]]
  applies — never construct a custom dict that bypasses
  `PatientResponse`.
- `SubmitAnamnesisUseCase` discards the `alert` in v1; future endpoints
  may surface it. Reading the alert from the entity remains valid.
- `GenerateStatisticsUseCase` MUST go through a separate, k-anonymised
  query path — see [[010_Statistics_Anonymisation]] *(planned)*.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]
- [[007_Audit_Logging_Middleware]]

#file #use-cases #patient #clinical
