---
id: file-domain-patient
title: "patient.py (entity)"
type: File
status: Active
language: python
path: app/domain/entities/patient.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
supersedes: "[[file_domain_models_patient_py]]"
tags:
  - file
  - domain
  - entity
  - patient
  - pii
  - lgpd
  - pydantic
related:
  - "[[file_domain_value_objects_cpf_py]]"
  - "[[file_domain_ports_patient_repository_py]]"
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
  - "[[ADR-005-uuid-to-serial-resolution]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/domain/entities/patient.py` — Patient Entity (Aggregate Root)

## Context & Purpose

The primary clinical subject of the SXFp platform. A `Patient` is registered
by an authenticated doctor (`criado_por_db_id`) and accumulates evaluations over time.

This entity is the **highest-risk PII surface** in the system: name, CPF,
birth date, and sex are all sensitive personal data under LGPD. The entity
holds canonical values; masking and pseudonymisation occur at the presentation
boundary (see [[006_LGPD_PII_Strategy]]).

## Public Surface

### Enums

```python
class SexAtBirth(StrEnum):   # "M" | "F" | "I" (intersex)
class Etnia(StrEnum):         # demographic ethnicity categories
class Escolaridade(StrEnum):  # education level categories
```

All use `StrEnum` so Pydantic serialises them as strings without extra config.

### `Patient(BaseModel)`

```python
model_config = ConfigDict(
    arbitrary_types_allowed=True,   # required for CPFAnnotated
    extra="forbid",
    str_strip_whitespace=True,
    validate_assignment=True,
)

# Identity
id: UUID = Field(default_factory=uuid4)   # internal opaque identity
cpf: CPFAnnotated | None                  # optional; redacted in __str__/__repr__

# Clinical demographics
full_name: str
birth_date: date
sex_at_birth: SexAtBirth
family_history_fxs: bool                  # strong FXS predictor

# Creator reference (infrastructure coupling)
criado_por_db_id: int = Field(ge=1)       # FK to usuarios.id (SERIAL)

# Extended demographics (14 additional fields including etnia, escolaridade,
# uf_residencia, municipio_residencia, renda_familiar, etc.)
```

### Properties

```python
@property
def cpf_hash(self) -> str | None:
    return self.cpf.sha256_hex if self.cpf else None

def age_at(self, reference: date) -> int:
    # Exact age in years on reference date, accounting for birthday position
```

## Key Design Decisions

1. **`id: UUID` is the domain identity** — never the CPF. This ensures
   pseudonymity at the data tier (LGPD requirement).
2. **`cpf: CPFAnnotated | None`** — optional, validated by `CPF.__post_init__`.
   The `CPFAnnotated` Pydantic type accepts raw strings and wraps them.
   `CPF.__str__` always returns `"***redacted***"`.
3. **`criado_por_db_id: int`** — infrastructure-coupled creator reference.
   The `_db_id` suffix signals this deliberately (see [[ADR-005-uuid-to-serial-resolution]]).
4. **`arbitrary_types_allowed=True`** — required because `CPFAnnotated`
   contains a custom Python dataclass, not a standard JSON-serialisable type.

## `cpf_hash` property usage

The use case calls `patient.cpf_hash` (never `patient.cpf.sha256_hex` directly)
to get the value for persisting to the `cpf_hash` column. If `cpf` is `None`,
`cpf_hash` returns `None` — the patient was registered without a CPF.

## Dependencies

- **External:** `pydantic` v2, `uuid`, `datetime`, `enum`.
- **Internal:** [[file_domain_value_objects_cpf_py]] (`CPFAnnotated`).

## Consumers

| Consumer | Usage |
|---|---|
| [[file_application_use_cases_register_patient_py]] | Constructs `Patient(...)` entity; reads `cpf_hash` for persistence |
| [[file_interfaces_repositories_patient_repository_py]] | Receives `Patient` in `add()` method |
| [[file_presentation_routers_patients_py]] | Reads `patient.full_name` for LGPD masking in response |

## Invariants / Pitfalls

- **Never log a `Patient` instance** — `full_name` and `birth_date` are
  plaintext PII fields. No `__repr__` override exists yet; callers must scrub.
- **`extra="forbid"`** — unknown fields in Pydantic validation raise
  `ValidationError`. This prevents phantom fields from sneaking through.
- **`criado_por_db_id >= 1`** enforced by `Field(ge=1)` — `0` is not a valid
  PostgreSQL SERIAL PK.
- **`age_at()` operates on calendar `date`**, not `datetime`. Time-zone
  differences can shift the birthday by a day; SXFp deliberately uses dates.

## Related ADRs

- [[ADR-004-cpf-sha256-anonymization]] — `cpf_hash` property; CPF as domain VO.
- [[ADR-005-uuid-to-serial-resolution]] — `criado_por_db_id: int` design.
- [[006_LGPD_PII_Strategy]] — PII handling requirements.
- [[003_Hexagonal_Architecture_Strategy]] — entity as innermost layer.

#file #domain #entity #patient #pii #lgpd
