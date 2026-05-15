---
id: dir-interfaces
title: "app/interfaces — Ports & Adapters"
type: DirGuide
status: living
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_interfaces_repositories_acompanhante_repository_py]]"
  - "[[file_interfaces_repositories_avaliacao_repository_py]]"
  - "[[file_interfaces_repositories_checklist_repository_py]]"
  - "[[file_interfaces_repositories_avaliacao_read_repository_py]]"
  - "[[file_interfaces_repositories_dashboard_repository_py]]"
  - "[[file_interfaces_repositories_patient_read_repository_py]]"
tags:
  - directory
  - interfaces
  - adapters
  - hexagonal
  - ports
  - repositories
related:
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
---

# `app/interfaces/` — Ports & Adapters

## Purpose

`app/interfaces/` is where the [[Hexagonal_Architecture]] meets the outside
world. It contains two sub-namespaces:

- **`interfaces/api/`** — inbound HTTP wiring: FastAPI `Depends` providers
  that translate JWT claims into domain identity objects.
- **`interfaces/repositories/`** — outbound persistence adapters: concrete
  SQLAlchemy implementations of the Port protocols declared in `app/domain/ports/`.

```
              inbound                            outbound
HTTP request ──▶ interfaces/api/ ──▶ use cases ──▶ interfaces/repositories/ ──▶ PostgreSQL
```

## Children

### `interfaces/api/`

| File | Role |
|---|---|
| [[file_interfaces_api_dependencies_py]] | `get_current_doctor` — cryptographic JWT verification; returns `AuthenticatedDoctor(usuario_id, sessao_id, role)`. No DB hit. |

### `interfaces/repositories/` — Write-side adapters

| File | Aggregate | Notes |
|---|---|---|
| [[file_interfaces_repositories_patient_repository_py]] | `Patient` | Writes to `pacientes` view; PGP trigger encrypts PII |
| [[file_interfaces_repositories_acompanhante_repository_py]] | `Acompanhante` | `get_by_cpf(sha256_hex)` + `create()` |
| [[file_interfaces_repositories_avaliacao_repository_py]] | `Avaliacao` | `create_rascunho()` + `open_log_analise()` |
| [[file_interfaces_repositories_checklist_repository_py]] | `ChecklistResponse` | Bulk-insert symptom answers |

### `interfaces/repositories/` — Read-side adapters (Sprint 5+)

| File | Purpose | RBAC |
|---|---|---|
| [[file_interfaces_repositories_avaliacao_read_repository_py]] | Patient history read path | `JOIN pacientes ON criado_por = :usuario_id` |
| [[file_interfaces_repositories_dashboard_repository_py]] | `vw_dashboard_anonimizado` queries + REFRESH | Dynamic WHERE; no RBAC (stats are anonymised) |
| [[file_interfaces_repositories_patient_read_repository_py]] | Patient list with pagination + filters | `WHERE criado_por = :usuario_id`; receives `cpf_hash`, never raw CPF |

## Allowed Dependencies

- `fastapi`, `fastapi.security` (in `interfaces/api/` only).
- `sqlalchemy`, `sqlalchemy.ext.asyncio` (in `interfaces/repositories/`).
- `pydantic` — for `PatientListItem` and similar read-model dataclasses.
- Anything from [[dir_app_domain]] — entities, value objects.
- [[dir_app_core]] — `config`, `exceptions`, `security`.
- [[dir_app_db]] — `get_db_session`, `AsyncSession`.

## Forbidden Imports

- **MUST NOT** import from [[dir_app_use_cases]] — use cases instantiate
  repositories; repositories must not know about use cases.
- **MUST NOT** contain compliance policy** — k-anonymity threshold lives in
  [[file_application_use_cases_get_dashboard_stats_py]], not in the repository
  (see [[ADR-003-k-anonymity-in-use-case-layer]]).
- **MUST NOT** receive raw CPF digits** — the `cpf_hash_filter` parameter name
  in [[file_interfaces_repositories_patient_read_repository_py]] is a hard
  contract (see [[ADR-004-cpf-sha256-anonymization]]).

## Key Patterns

- **Repository Pattern** — every aggregate gets its own adapter. Write and read
  paths are separated (e.g. `PatientRepository` vs `PatientReadRepository`).
- **RBAC via SQL `WHERE`** — the doctor's `usuario_id` from the JWT is passed
  to every read adapter; no row-level security policy at the DB level.
- **Dynamic WHERE** — `DashboardRepository` and `PatientReadRepository` build
  parameterised SQL condition lists to support optional filters without
  string concatenation injection risk.
- **Active Database writes** — write adapters target views, not physical tables.
  The DB `INSTEAD OF INSERT` trigger handles PGP encryption transparently
  (see [[ADR-001-active-database-pattern]]).
- **`expire_on_commit=False`** — configured in [[file_db_database_py]] so
  repository-returned objects remain accessible after the session commits.

## Invariants

- Repository constructors accept only `AsyncSession`. No other infrastructure
  dependencies are injected at construction time.
- `DashboardRepository.refresh_materialized_view()` uses
  `REFRESH MATERIALIZED VIEW CONCURRENTLY` — this requires at least one prior
  non-concurrent refresh to have created the initial snapshot.
- `PatientListItem.nome` is decrypted by the DB view (PGP key injected via
  `get_db_session()` before the query runs).

## Related ADRs

- [[ADR-001-active-database-pattern]] — why writes go to views, not tables.
- [[ADR-003-k-anonymity-in-use-case-layer]] — why the repo does not filter on count.
- [[ADR-004-cpf-sha256-anonymization]] — why `cpf_hash_filter`, not `cpf_filter`.

#directory #interfaces #adapters #hexagonal #repositories
