---
id: dir-domain
title: "app/domain — The Hexagon's Core"
type: DirGuide
status: living
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_entities_user_py]]"
  - "[[file_domain_entities_symptom_py]]"
  - "[[file_domain_entities_evaluation_py]]"
  - "[[file_domain_entities_checklist_response_py]]"
  - "[[file_domain_entities_acompanhante_py]]"
  - "[[file_domain_value_objects_cpf_py]]"
  - "[[file_domain_services_symptom_scoring_orchestrator_py]]"
  - "[[file_domain_ports_patient_repository_py]]"
  - "[[file_domain_ports_user_repository_py]]"
  - "[[file_domain_ports_symptom_repository_py]]"
  - "[[file_domain_ports_evaluation_repository_py]]"
  - "[[file_domain_ports_checklist_response_repository_py]]"
tags:
  - directory
  - domain
  - ddd
  - hexagonal
related:
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
  - "[[ADR-005-uuid-to-serial-resolution]]"
---

# `app/domain/` — The Hexagon's Core

## Purpose

`app/domain/` is the **innermost layer** of the [[Hexagonal_Architecture]].
It holds the *ubiquitous language* of FXS clinical workflows: who a [[Patient]]
is, what a [[Anamnesis]] checklist contains, how a [[ScoreBand]] is computed.

No framework import is allowed here — not FastAPI, not SQLAlchemy. If a test
for this layer requires mocking a FastAPI dependency, the code does not belong
in this layer.

## Sub-packages

```
app/domain/
├── entities/        # Business entities (Pydantic BaseModel with domain logic)
├── value_objects/   # Immutable, self-validating value types
├── services/        # Stateless domain services (DB-delegated operations)
└── ports/           # Abstract interfaces (Protocol) for external dependencies
```

## Children

### `entities/`

| File | Description |
|---|---|
| [[file_domain_entities_patient_py]] | `Patient` — aggregate root; 14+ demographic fields; `criado_por_db_id: int` (see [[ADR-005-uuid-to-serial-resolution]]) |
| [[file_domain_entities_user_py]] | `User` / doctor account entity |
| [[file_domain_entities_symptom_py]] | `Symptom` — FXS screening checklist item |
| [[file_domain_entities_evaluation_py]] | `Evaluation` — one completed anamnesis record |
| [[file_domain_entities_checklist_response_py]] | `ChecklistResponse` — one symptom answer |
| [[file_domain_entities_acompanhante_py]] | `Acompanhante` — optional patient companion |

### `value_objects/`

| File | Description |
|---|---|
| [[file_domain_value_objects_cpf_py]] | `CPF` — frozen dataclass; strips formatting; `sha256_hex` property; `__str__`/`__repr__` redact (see [[ADR-004-cpf-sha256-anonymization]]) |

### `services/`

| File | Description |
|---|---|
| [[file_domain_services_symptom_scoring_orchestrator_py]] | `SymptomScoringOrchestrator` — calls `fn_calcular_score_triagem(:avaliacao_id)` stored function; returns frozen `ScoringResult` (see [[ADR-001-active-database-pattern]]) |

### `ports/`

| File | Description |
|---|---|
| [[file_domain_ports_patient_repository_py]] | `IPatientRepository` Protocol |
| [[file_domain_ports_user_repository_py]] | `IUserRepository` Protocol |
| [[file_domain_ports_symptom_repository_py]] | `ISymptomRepository` Protocol |
| [[file_domain_ports_evaluation_repository_py]] | `IEvaluationRepository` Protocol |
| [[file_domain_ports_checklist_response_repository_py]] | `IChecklistResponseRepository` Protocol |

## Allowed Dependencies

- Python standard library (`dataclasses`, `enum`, `datetime`, `uuid`, `hashlib`, `re`).
- `pydantic` v2 — for entity models only (`BaseModel`, `ConfigDict`, `Field`).
- `pydantic.functional_validators` — for `CPFAnnotated`.
- `sqlalchemy` — **ONLY** in `services/` where the domain service delegates to
  the DB via `AsyncSession` (Active Database Pattern, [[ADR-001-active-database-pattern]]).

## Forbidden Imports

- **MUST NOT** import `fastapi`, `httpx`, `passlib`, or any HTTP framework.
- **MUST NOT** import from [[dir_app_use_cases]], [[dir_app_interfaces]],
  or [[dir_app_db]].
- The dependency rule is one-way: outer layers import this; this layer imports
  nothing of theirs.

## Key Patterns

- **Aggregate Root** — `Patient` is the aggregate root; it owns identity (`id: UUID`),
  demographics, and the reference to its creating doctor (`criado_por_db_id: int`).
- **Value Objects** — `CPF` is immutable (`frozen=True`); constructed with raw
  input; never exposes plaintext in `str`/`repr`.
- **Pydantic entities** — entities use
  `ConfigDict(arbitrary_types_allowed=True, extra="forbid", str_strip_whitespace=True, validate_assignment=True)`.
- **Domain Service with DB delegation** — `SymptomScoringOrchestrator` holds an
  `AsyncSession` injected by the use case; it is not a pure domain service in the
  strict DDD sense but is classified here because it owns the scoring port.
- **Enums as `StrEnum`** — `SexAtBirth`, `Etnia`, `Escolaridade` inherit from
  `StrEnum` so Pydantic serialises them as strings without extra config.

## Invariants

- No file in `entities/` or `value_objects/` may import `AsyncSession`.
- `CPF.__str__` and `CPF.__repr__` MUST remain redacted — this is a LGPD hard
  requirement, not a debugging choice.
- `criado_por_db_id` naming convention must be preserved — the `_db_id` suffix
  signals infrastructure coupling (see [[ADR-005-uuid-to-serial-resolution]]).

## Related ADRs

- [[ADR-001-active-database-pattern]] — why `SymptomScoringOrchestrator` delegates to SQL.
- [[ADR-004-cpf-sha256-anonymization]] — why `CPF.sha256_hex` and redacted `__str__`.
- [[ADR-005-uuid-to-serial-resolution]] — why `criado_por_db_id: int` instead of UUID.
- [[003_Hexagonal_Architecture_Strategy]] — domain purity rules.
- [[006_LGPD_PII_Strategy]] — PII fields surface here first.

#directory #domain #ddd #hexagonal
