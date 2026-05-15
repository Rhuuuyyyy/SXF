---
title: patient_cases.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_use_cases_patient_cases_py]]"
file_language: python
path: app/use_cases/patient_cases.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - use-cases
  - patient
  - clinical
  - command
  - pt-br
related:
  - "[[br_file_services_patient_service_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_schemas_patient_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_007_Audit_Logging_Middleware]]"
---

# `app/use_cases/patient_cases.py` — Casos de Uso Clínicos

## Context & Purpose

Hospeda os casos de uso patient-facing consumidos pelos routers HTTP.
Cada classe é uma **intenção clínica nomeada** ligada a um endpoint
HTTP:

| Caso de uso | Rota HTTP | Service |
|---|---|---|
| `RegisterPatientUseCase` | `POST /api/v1/patients` | [[br_file_services_patient_service_py]] |
| `SubmitAnamnesisUseCase` | `POST /api/v1/patients/{id}/anamneses` | [[br_file_services_patient_service_py]] |
| `GetPatientHistoryUseCase` | `GET /api/v1/patients/{id}/history` | [[br_file_services_patient_service_py]] |
| `GenerateStatisticsUseCase` *(planejado)* | `GET /api/v1/statistics` | [[br_file_services_patient_service_py]] |

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

Escolhas-chave:

- **Uma classe por intenção.** Classes triviais são deliberadas — dão
  ao router um target estável de injeção e aos testes uma boundary
  de unit limpa.
- **Schema in, schema out.** Use cases possuem a tradução de boundary;
  routers ficam declarativos.
- **Sem import de DB.** O service segura o repositório; o use case
  nunca sabe que existe um banco.

## Dependencies
- **Interno:** [[br_file_services_patient_service_py]],
  [[br_file_domain_schemas_patient_py]],
  [[br_file_domain_entities_patient_py]].
- **Externo:** standard library apenas (sem FastAPI).

## Consumers
- O APIRouter de patient em
  `interfaces/api/v1/routers/patients.py` *(planejado)*; provê via
  factories em [[br_file_interfaces_api_dependencies_py]].

## Invariants / Pitfalls
- **Sem detalhes HTTP dentro.** Use case que levanta `HTTPException`
  é violação de camada.
- A regra mask-on-response de [[br_file_domain_schemas_patient_py]]
  se aplica — nunca construa um dict customizado que bypasseie
  `PatientResponse`.
- `SubmitAnamnesisUseCase` descarta o `alert` em v1; endpoints
  futuros podem expor. Ler o alert da entity continua válido.
- `GenerateStatisticsUseCase` PRECISA passar por um caminho de query
  separado e k-anonymizado — ver
  [[br_010_Statistics_Anonymisation]] *(planejado)*.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]

#file #use-cases #patient #clinical #pt-br
