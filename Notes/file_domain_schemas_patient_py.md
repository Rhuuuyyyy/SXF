---
title: patient.py (schema)
type: File
status: Planned
language: python
path: app/domain/schemas/patient.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - schema
  - pydantic
  - api-contract
  - patient
related:
  - "[[file_domain_models_patient_py]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_use_cases_patient_cases_py]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/domain/schemas/patient.py` — Patient API Contracts

## Context & Purpose

[[Pydantic]] v2 schemas describing the HTTP request/response payloads for
every Patient-related endpoint. These classes are the **canonical source
of truth for the [[Frontend_Team]]** — the auto-generated [[OpenAPI]] 3.1
document at `/api/v1/openapi.json` is rendered directly from them.

Schemas are **anaemic on purpose**: they validate, serialize, and document.
Behaviour belongs to the entity in [[file_domain_models_patient_py]].

## Logic Breakdown

Three concrete classes (planned):

```python
from datetime import date
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.utils.validators import is_valid_cpf  # via [[file_utils_validators_py]]


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

Key choices:

- **`PatientBase`** with `extra="forbid"` — unknown fields = 422. Tightens
  the FE↔BE contract.
- **`PatientCreate`** mirrors the entity but accepts the *raw* CPF (server
  validates with [[file_utils_validators_py]]).
- **`PatientResponse`** never serialises a raw CPF or full birth_date; the
  default representation is **already masked**. This is the
  presentation-side half of [[006_LGPD_PII_Strategy]].
- **`field_serializer`** runs at JSON-emit time, after authorisation —
  ensuring no privileged path can accidentally leak PII.

## Dependencies
- **External:** `pydantic` v2.
- **Internal:** [[file_utils_validators_py]] (CPF check).

## Consumers
- [[file_use_cases_patient_cases_py]] (input validation).
- [[file_interfaces_api_dependencies_py]] / future routers (response
  models).
- [[Frontend_Team]] (consumes via OpenAPI).

## Invariants / Pitfalls
- **Schemas MUST NOT carry behaviour** beyond validation/serialisation.
  Business rules go in [[file_domain_models_patient_py]].
- The masked-CPF rule is a **default**; an admin export endpoint may need
  a different schema. Such a schema MUST be a separate class so the
  default never accidentally exposes PII.
- Adding a field here means three places: schema, entity
  ([[file_domain_models_patient_py]]), and adapter
  ([[file_interfaces_repositories_patient_repository_py]]). Drift breaks
  the contract.
- `extra="forbid"` is non-negotiable for create/update payloads.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]

#file #domain #schema #pydantic #api-contract
