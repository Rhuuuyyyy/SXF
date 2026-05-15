---
title: patient.py (model) — ARCHIVED
type: File
status: Archived
deprecation_date: 2026-05-03
superseded_by: "[[file_domain_entities_patient_py]]"
language: python
path: app/domain/models/patient.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - aggregate-root
  - patient
  - fxs
  - archived
related:
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_schemas_patient_py]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_services_patient_service_py]]"
  - "[[file_use_cases_patient_cases_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/domain/models/patient.py` — Patient Aggregate

> **ARCHIVED 2026-05-03.** The `app/domain/models/` path described here was
> never implemented. The active code lives at
> [[file_domain_entities_patient_py]] (`app/domain/entities/patient.py`),
> which uses the existing hexagonal layout (`entities/` rather than
> `models/`). Read the active note for current behaviour; everything
> below is preserved for historical context.

## Context & Purpose

The Patient aggregate root models a person under FXS evaluation. It is the
**central clinical concept** of the system; nearly every use case reads or
writes it. Because patients hold sensitive personal data under [[LGPD]],
this entity is also the **highest-risk PII surface** — PII handling rules
in [[006_LGPD_PII_Strategy]] start here.

## Logic Breakdown

Skeleton (planned):

```python
from dataclasses import dataclass, field
from datetime import date
from uuid import UUID, uuid4

from app.domain.models.value_objects import CPF, BirthDate


@dataclass(slots=True, kw_only=True)
class Patient:
    id: UUID = field(default_factory=uuid4)
    cpf: CPF
    full_name: str
    birth_date: BirthDate
    sex_at_birth: str  # 'M' | 'F' | 'I'
    family_history_fxs: bool = False
    created_at: date = field(default_factory=date.today)
    anamneses: list["Anamnesis"] = field(default_factory=list)
    alerts: list["ClinicalAlert"] = field(default_factory=list)

    # ── invariants ────────────────────────────────────────────────────
    def __post_init__(self) -> None:
        if not self.full_name.strip():
            raise DomainError("Patient full_name cannot be empty.")
        if self.sex_at_birth not in ("M", "F", "I"):
            raise DomainError("sex_at_birth must be 'M', 'F' or 'I'.")

    # ── behaviours ────────────────────────────────────────────────────
    def add_anamnesis(self, anamnesis: "Anamnesis") -> "ClinicalAlert | None":
        self.anamneses.append(anamnesis)
        alert = SymptomScoringService.evaluate(self, anamnesis)
        if alert:
            self.alerts.append(alert)
        return alert

    def age_at(self, on: date) -> int:
        return self.birth_date.years_until(on)
```

Key design choices:

- **`@dataclass(slots=True)`** — light, fast, immutable-by-convention
  (no inheritance hierarchy needed).
- **`UUID` identity** — opaque to the outside world; CPF is *never* the
  primary key (LGPD principle of pseudonymity at the data tier).
- **Behaviour, not anaemia.** `add_anamnesis` mutates state and triggers
  [[SymptomScoringService]]; the entity *owns* its rules.
- **Value objects** ([[CPF]], [[BirthDate]]) — own their validation; the
  aggregate just composes them. See [[file_utils_validators_py]] for CPF
  algorithm.

## Dependencies
- **Internal:** value objects (planned `app/domain/models/value_objects.py`),
  [[SymptomScoringService]] (planned `app/domain/services/`).
- **External:** standard library only.

## Consumers
- [[file_interfaces_repositories_patient_repository_py]] (Port + Adapter).
- [[file_services_patient_service_py]] / [[file_use_cases_patient_cases_py]].
- [[file_domain_schemas_patient_py]] (mirror fields for serialization).

## Invariants / Pitfalls
- **CPF is required and validated**; raising at construction time prevents
  invalid Patients from ever existing.
- **Never store PII in logs.** `Patient.__repr__` MUST be overridden to
  redact `full_name` and `cpf` — covered by
  [[file_utils_logger_py]]'s structured filters.
- **Equality is by `id`**, not by `cpf`. Two Patient instances with the
  same id are the same patient even after mutation.
- The aggregate is the *only* author of its `anamneses` and `alerts`
  collections. Repositories rehydrate them; nobody else appends.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #domain #entity #patient #fxs
