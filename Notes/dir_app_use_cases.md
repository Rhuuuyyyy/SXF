---
id: dir-use-cases
title: "app/application/use_cases — Application Use Cases"
type: DirGuide
status: living
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[file_application_use_cases_get_patient_history_py]]"
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[file_application_use_cases_get_patient_list_py]]"
  - "[[file_application_use_cases_refresh_dashboard_py]]"
tags:
  - directory
  - use-cases
  - application
  - clean-architecture
related:
  - "[[dir_app_interfaces]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
---

# `app/application/use_cases/` — Application Use Cases

## Purpose

Each file in `app/application/use_cases/` corresponds to a **named,
bounded user intent**. Use cases are the entry points that HTTP routers
wire via constructor injection. They coordinate domain objects and repository
adapters without knowing anything about HTTP.

A use case:
- Has a single `execute()` method (keyword-only parameters).
- Is **HTTP-blind**: raises domain exceptions from [[file_core_exceptions_py]],
  never `fastapi.HTTPException`.
- Is **stateless**: every dependency is injected; no global state.
- Is **the enforcement point for cross-cutting rules**: LGPD compliance
  (k-anonymity, CPF hashing) lives here, not in the repository or router.

## Children

| File | Intent | Key rule enforced |
|---|---|---|
| [[file_application_use_cases_submit_anamnesis_py]] | Clinical write path — create evaluation, insert checklist answers, call scoring function | Delegates scoring to `SymptomScoringOrchestrator` (Active DB) |
| [[file_application_use_cases_register_patient_py]] | Register a new patient + optional companion | Resolves companion by CPF or creates new; sets `criado_por_db_id` from JWT |
| [[file_application_use_cases_get_patient_history_py]] | Return paginated evaluation history for one patient | RBAC enforced via `avaliacao_read_repository` JOIN |
| [[file_application_use_cases_get_dashboard_stats_py]] | Return anonymised dashboard statistics | K-anonymity threshold = 5; raises `LGPDComplianceError` if violated (see [[ADR-003-k-anonymity-in-use-case-layer]]) |
| [[file_application_use_cases_get_patient_list_py]] | List patients registered by the authenticated doctor | Hashes raw CPF to SHA-256 before querying (see [[ADR-004-cpf-sha256-anonymization]]) |
| [[file_application_use_cases_refresh_dashboard_py]] | `REFRESH MATERIALIZED VIEW CONCURRENTLY` | Admin-only; checked inline by the router before calling |

## Allowed Dependencies

- [[dir_app_domain]] — entities, value objects, domain services, ports.
- [[dir_app_interfaces]] — **repository adapters as concrete types** (not
  Protocols — adapters are injected by the router and passed into `__init__`).
- [[dir_app_core]] — `exceptions`, `config` (if needed).
- Standard library.

## Forbidden Imports

- **MUST NOT** import `fastapi` or any HTTP construct.
- **MUST NOT** import [[dir_app_db]] directly — the `AsyncSession` is passed
  in via `execute()` parameters (e.g. `SubmitAnamnesisUseCase`) or the
  repository adapter already holds the session.
- **MUST NOT** import from [[dir_app_presentation]].

## Key Patterns

- **Constructor injection** — every collaborator (repository adapters, domain
  services) is declared in `__init__`. No service-locator anti-pattern.
- **Frozen result dataclasses** — `AnamnesisResult`, `DashboardStatsResult`,
  `PatientListResult` — typed, immutable return values that the router maps to
  Pydantic response models.
- **LGPD enforcement at this layer** — see `K_ANONYMITY_THRESHOLD` in
  [[file_application_use_cases_get_dashboard_stats_py]] and CPF hashing in
  [[file_application_use_cases_get_patient_list_py]].
- **Unit-testable without DB** — the Sprint 6 test suite has 16 tests covering
  all use cases using `AsyncMock(spec=)` fakes; zero DB connections.

## Invariants

- `execute()` uses keyword-only parameters (`*`) on all use cases — prevents
  accidental positional argument confusion.
- The `HARD_LIMIT: int = 200` on `GetPatientListUseCase` is the single source
  of truth for maximum page size.
- `K_ANONYMITY_THRESHOLD: int = 5` in `GetDashboardStatsUseCase` is the single
  source of truth for the k-anonymity floor; changing it requires a new ADR.

## Related ADRs

- [[ADR-003-k-anonymity-in-use-case-layer]] — k-anonymity at use case, not repo.
- [[ADR-004-cpf-sha256-anonymization]] — CPF hashing at use case, not repo.
- [[ADR-001-active-database-pattern]] — scoring delegated via `SymptomScoringOrchestrator`.
- [[003_Hexagonal_Architecture_Strategy]] — use case independence from HTTP.

#directory #use-cases #application #clean-architecture
