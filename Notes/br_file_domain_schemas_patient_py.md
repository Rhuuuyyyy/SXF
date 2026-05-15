---
title: patient.py (schema)
type: File
status: Planned
language: pt-BR
mirrors: "[[file_domain_schemas_patient_py]]"
file_language: python
path: app/domain/schemas/patient.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - schema
  - pydantic
  - api-contract
  - patient
  - pt-br
related:
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_use_cases_patient_cases_py]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/domain/schemas/patient.py` — Contratos API de Patient

## Context & Purpose

Schemas [[br_Pydantic]] v2 descrevendo os payloads de
request/response HTTP para todo endpoint relacionado a Patient. Estas
classes são a **fonte da verdade canônica para o [[br_Frontend_Team]]**
— o documento [[br_OpenAPI]] 3.1 auto-gerado em
`/api/v1/openapi.json` é renderizado diretamente delas.

Schemas são **anêmicos de propósito**: eles validam, serializam e
documentam. Comportamento pertence à entity em
[[br_file_domain_entities_patient_py]].

## Logic Breakdown

Três classes concretas (planejadas):

```python
from datetime import date
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.utils.validators import is_valid_cpf  # via [[br_file_utils_validators_py]]


class PatientBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PatientCreate(PatientBase):
    cpf: Annotated[str, Field(min_length=11, max_length=14)]
    full_name: Annotated[str, Field(min_length=2, max_length=120)]
    birth_date: date
    sex_at_birth: Annotated[str, Field(pattern="^(M|F|I)$")]
    family_history_fxs: bool = False

    @field_validator("cpf")
    @classmethod
    def _validate_cpf(cls, v: str) -> str:
        if not is_valid_cpf(v):
            raise ValueError("Invalid CPF.")
        return v


class PatientResponse(PatientBase):
    """LGPD-aware response: PII fields are masked."""
    id: UUID
    cpf_masked: str = Field(alias="cpf")
    given_name: str
    birth_year: int
    sex_at_birth: str
    family_history_fxs: bool

    @field_serializer("cpf_masked")
    def _mask_cpf(self, value: str) -> str:
        # 123.456.789-00 → ***.***.789-**
        return f"***.***.{value[-5:-2]}-**"
```

Escolhas-chave:

- **`PatientBase`** com `extra="forbid"` — campos desconhecidos = 422.
  Aperta o contrato FE↔BE.
- **`PatientCreate`** espelha a entity mas aceita o CPF *cru* (servidor
  valida com [[br_file_utils_validators_py]]).
- **`PatientResponse`** nunca serializa CPF cru ou birth_date completo;
  a representação default já está **mascarada**. Esta é a metade
  presentation-side de [[br_006_LGPD_PII_Strategy]].
- **`field_serializer`** roda no momento de emit do JSON, depois da
  autorização — garantindo que nenhum caminho privilegiado vaze PII
  acidentalmente.

## Dependencies
- **Externo:** `pydantic` v2.
- **Interno:** [[br_file_utils_validators_py]] (check de CPF).

## Consumers
- [[br_file_use_cases_patient_cases_py]] (validação de input).
- [[br_file_interfaces_api_dependencies_py]] / routers futuros (response
  models).
- [[br_Frontend_Team]] (consome via OpenAPI).

## Invariants / Pitfalls
- **Schemas NÃO PODEM carregar comportamento** além de
  validação/serialização. Regras de negócio vão em
  [[br_file_domain_entities_patient_py]].
- A regra de masked-CPF é um **default**; um endpoint de admin export
  pode precisar de schema diferente. Tal schema DEVE ser uma classe
  separada para que o default nunca exponha PII acidentalmente.
- Adicionar field aqui significa três lugares: schema, entity
  ([[br_file_domain_entities_patient_py]]) e adapter
  ([[br_file_interfaces_repositories_patient_repository_py]]). Drift
  quebra o contrato.
- `extra="forbid"` é não-negociável para payloads de create/update.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #domain #schema #pydantic #api-contract #pt-br
