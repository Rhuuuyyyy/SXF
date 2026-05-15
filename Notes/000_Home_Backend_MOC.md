---
id: MOC-000
title: "Home — Backend Knowledge Base"
type: MOC
status: living
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
domain: healthcare
subdomain: fxs-diagnosis
country: brazil
tags:
  - moc
  - index
  - home
  - backend
  - sxfp
related:
  - "[[001_Architecture_and_Context]]"
  - "[[002_Framework_Selection_FastAPI]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[007_Audit_Logging_Middleware]]"
  - "[[100_Codebase_and_Directory_Map]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
  - "[[ADR-005-uuid-to-serial-resolution]]"
---

# Home — SXFp Backend Knowledge Base

> The single entry point for every reader of this vault. From here, every
> architectural decision, codebase map, security policy and design pattern is
> reachable in one click. Open this file as the **starred note** in Obsidian.

---

## How to read this vault

- Each note carries `id`, `status`, `tags`, `created_date` and a `related`
  list in the YAML frontmatter. Use Obsidian's **Graph View** to surface the
  knowledge graph.
- Numbering convention:
    - `000` — index / map of content (this file).
    - `001–099` — **ADRs** (Architecture Decision Records).
    - `1XX` — **Codebase maps** (folder/file deep dives).
    - `2XX` — **Operational runbooks** (forthcoming).
    - `3XX` — **Testing & QA** (forthcoming).
- **Orphan links** like `[[SymptomScoringService]]` or `[[IPatientRepository]]`
  are intentional: they are *promises* — files that will be filled in when the
  matching code lands. Click them to see backlinks even before the page exists.
- Every note ends with a `#tags` line. The full tag taxonomy lives at
  [[Glossary_and_Tags]] *(planned)*.

---

## Foundation

The non-negotiable starting set. Read these before contributing code.

- [[001_Architecture_and_Context]] — business context, drivers, top-level
  decisions. The "why" of the whole system.
- [[100_Codebase_and_Directory_Map]] — every folder and every file we have
  created so far, explained.
- [[004_Directory_Structure]] *(planned)* — naming conventions and import
  rules enforced by `ruff` / `import-linter`.

---

## Architecture & Patterns

- [[002_Framework_Selection_FastAPI]] — why FastAPI over Flask, Django REST
  and Litestar, with benchmarks and code snippets.
- [[003_Hexagonal_Architecture_Strategy]] — Ports & Adapters in Python,
  including how the DB and frontend are swapped without touching the domain.
- [[Composition_Root]] *(planned)* — the single place where adapters meet
  ports.
- [[Dependency_Injection]] *(planned)* — using FastAPI's `Depends()` to wire
  the hexagon.
- [[Repository_Pattern]] *(concept)* — the abstraction we sign with the DBA
  team.

---

## API & Integration Contracts

- [[005_Integration_Contracts_DTOs]] — the three contract surfaces (Pydantic
  schemas, DTOs, Ports) and who consumes each.
- [[OpenAPI]] *(concept)* — how the frontend team consumes our spec.
- [[API_Versioning_Strategy]] *(planned)* — `/api/v1` policy and deprecation
  rules.
- [[Error_Response_Envelope]] *(planned)* — RFC 7807 Problem Details.

---

## Security & Compliance

- [[006_LGPD_PII_Strategy]] — sensitive-data classification, masking,
  pseudonymisation, encryption layers, right-to-deletion.
- [[007_Audit_Logging_Middleware]] — non-blocking who/what/when capture for
  every state-changing request.
- [[008_AuthN_Strategy]] *(planned)* — OAuth2 password flow + JWT RS256.
- [[009_Authorization_RBAC]] *(planned)* — roles, scopes, deny-by-default.
- [[Argon2id]] *(concept)* — password-hashing baseline.
- [[ANPD]] *(concept)* — Brazilian data-protection authority guidance.

---

## Domain Model (forthcoming notes)

Aggregates and ubiquitous-language entries that the [[001_Architecture_and_Context]]
ADR points at.

### Entities
- [[Patient]] — aggregate root for one person.
- [[Anamnesis]] — checklist submission with timestamp and version.
- [[ClinicalAlert]] — emitted by [[SymptomScoringService]].
- [[DoctorAccount]] — authenticated identity with role `doctor`.

### Value objects
- [[CPF]] — Brazilian taxpayer ID, validated and masked.
- [[ScoreBand]] — `{LOW, MODERATE, HIGH}` with thresholds.
- [[BirthDate]] — wraps `date` and exposes `age_years`.
- [[GeneticTestRecommendation]] — typed recommendation enum.

### Domain services
- [[SymptomScoringService]] — deterministic scorer, version-stamped.
- [[ClinicalDecisionRules]] — pure function table.

### Ports
- [[IPatientRepository]]
- [[IAnamnesisRepository]]
- [[IClinicalAlertRepository]]
- [[IAuditSink]]
- [[IPasswordHasher]]
- [[ITokenIssuer]]

---

## Application Use Cases (forthcoming)

- [[SubmitAnamnesisUseCase]] — main clinical write path.
- [[GetPatientHistoryUseCase]] — read path.
- [[GenerateStatisticsUseCase]] — anonymised aggregates.
- [[AuthenticateDoctorUseCase]] — login.

---

## Operations *(future)*

- [[200_Local_Development]] — venv, uvicorn, hot reload.
- [[201_CI_Pipeline]] — ruff + mypy + pytest gates.
- [[202_Deployment_Topology]] — load balancer, app instances, audit sink.
- [[210_Performance_Benchmarks]] — p50/p95 budget per endpoint.
- [[220_Observability]] — structured logging, traces, metrics.

---

## Testing *(future)*

- [[300_Testing_Strategy]] — pyramid; fakes for Ports; contract tests.
- [[301_Domain_Test_Patterns]] — pure unit tests with no FastAPI booted.
- [[302_Integration_Tests]] — `httpx.AsyncClient` against `app`.
- [[303_Contract_Tests]] — verifying Port implementations.

---

## Glossary

- [[LGPD]] — Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
- [[ANPD]] — Autoridade Nacional de Proteção de Dados.
- [[FXS]] — Fragile X Syndrome.
- [[FMR1]] — gene whose CGG-repeat expansion causes FXS.
- [[Hexagonal_Architecture]] — see [[003_Hexagonal_Architecture_Strategy]].
- [[Clean_Architecture]] — Robert C. Martin, 2017.
- [[Repository_Pattern]] — Fowler, *PoEAA*, 2002.
- [[k-anonymity]] — anonymisation threshold for [[GenerateStatisticsUseCase]].
- [[ASGI]] — Asynchronous Server Gateway Interface.
- [[OpenAPI]] — REST API description format, version 3.1.
- [[OAuth2]] — RFC 6749.
- [[JWT]] — RFC 7519, signed with RS256 in this project.
- [[Pydantic]] — Pydantic v2 (Rust-backed validator).
- [[FastAPI]] — primary HTTP framework. See [[002_Framework_Selection_FastAPI]].

---

## Status board

| Note | Status | Last update |
|---|---|---|
| [[001_Architecture_and_Context]] | accepted | 2026-05-02 |
| [[002_Framework_Selection_FastAPI]] | accepted | 2026-05-03 |
| [[003_Hexagonal_Architecture_Strategy]] | accepted | 2026-05-03 |
| [[005_Integration_Contracts_DTOs]] | accepted | 2026-05-03 |
| [[006_LGPD_PII_Strategy]] | accepted | 2026-05-03 |
| [[007_Audit_Logging_Middleware]] | accepted | 2026-05-03 |
| [[100_Codebase_and_Directory_Map]] | living | 2026-05-03 |
| [[004_Directory_Structure]] | planned | — |
| [[008_AuthN_Strategy]] | planned | — |
| [[009_Authorization_RBAC]] | planned | — |
| [[010_Statistics_Anonymisation]] | planned | — |

### ADRs (Sprint 7)

| ADR | Title | Status |
|---|---|---|
| [[ADR-001-active-database-pattern]] | Active Database Pattern — PGP, bcrypt, scoring in PostgreSQL | accepted |
| [[ADR-002-jwt-stdlib-hs256]] | JWT stdlib HS256 — no third-party JWT library | accepted |
| [[ADR-003-k-anonymity-in-use-case-layer]] | K-Anonymity Enforcement in the Application Use Case Layer | accepted |
| [[ADR-004-cpf-sha256-anonymization]] | CPF SHA-256 Anonymization — hash in use case, not repository | accepted |
| [[ADR-005-uuid-to-serial-resolution]] | UUID to SERIAL — `criado_por_db_id: int` on Patient entity | accepted |

### Domain code maps (active)

| Note | Code path | Status |
|---|---|---|
| [[file_domain_entities_user_py]] | `app/domain/entities/user.py` | Active |
| [[file_domain_entities_patient_py]] | `app/domain/entities/patient.py` | Active |
| [[file_domain_entities_symptom_py]] | `app/domain/entities/symptom.py` | Active |
| [[file_domain_entities_evaluation_py]] | `app/domain/entities/evaluation.py` | Active |
| [[file_domain_entities_checklist_response_py]] | `app/domain/entities/checklist_response.py` | Active |
| [[file_domain_ports_user_repository_py]] | `app/domain/ports/user_repository.py` | Active |
| [[file_domain_ports_patient_repository_py]] | `app/domain/ports/patient_repository.py` | Active |
| [[file_domain_ports_symptom_repository_py]] | `app/domain/ports/symptom_repository.py` | Active |
| [[file_domain_ports_evaluation_repository_py]] | `app/domain/ports/evaluation_repository.py` | Active |
| [[file_domain_ports_checklist_response_repository_py]] | `app/domain/ports/checklist_response_repository.py` | Active |
| [[file_domain_models_user_py]] | (unimplemented; superseded) | Archived |
| [[file_domain_models_patient_py]] | (unimplemented; superseded) | Archived |

### Sprint 1 — Foundation (Active)

| Note | Code path | Status |
|---|---|---|
| [[file_core_config_py]] | `app/core/config.py` | Active |
| [[file_db_database_py]] | `app/db/database.py` | Active |
| [[file_domain_value_objects_cpf_py]] | `app/domain/value_objects/cpf.py` | Active |
| [[file_domain_entities_acompanhante_py]] | `app/domain/entities/acompanhante.py` | Active |
| [[file_domain_services_symptom_scoring_orchestrator_py]] | `app/domain/services/symptom_scoring_orchestrator.py` | Active |
| [[file_interfaces_repositories_patient_repository_py]] | `app/interfaces/repositories/patient_repository.py` | Active |
| [[file_interfaces_repositories_acompanhante_repository_py]] | `app/interfaces/repositories/acompanhante_repository.py` | Active |

### Sprint 2 — Application Layer (Active)

| Note | Code path | Status |
|---|---|---|
| [[file_core_exceptions_py]] | `app/core/exceptions.py` | Active |
| [[file_presentation_schemas_anamnesis_py]] | `app/presentation/api/v1/schemas/anamnesis.py` | Active |
| [[file_interfaces_repositories_avaliacao_repository_py]] | `app/interfaces/repositories/avaliacao_repository.py` | Active |
| [[file_interfaces_repositories_checklist_repository_py]] | `app/interfaces/repositories/checklist_repository.py` | Active |
| [[file_application_use_cases_submit_anamnesis_py]] | `app/application/use_cases/submit_anamnesis.py` | Active |
| [[file_services_auth_service_py]] | `app/services/auth_service.py` | Active |

### Sprint 3 — HTTP Layer (Active)

| Note | Code path | Status |
|---|---|---|
| [[file_application_dtos_anamnesis_py]] | `app/application/dtos/anamnesis.py` | Active |
| [[file_presentation_routers_anamnesis_py]] | `app/presentation/api/v1/routers/anamnesis.py` | Active |
| [[file_presentation_routers_auth_py]] | `app/presentation/api/v1/routers/auth.py` | Active |
| [[file_root_main_py]] | `app/main.py` (lifespan + routers wired) | Active |

### Sprint 4 — JWT + Patient Registration (Active)

| Note | Code path | Status |
|---|---|---|
| [[file_core_security_py]] | `app/core/security.py` | Active |
| [[file_interfaces_api_dependencies_py]] | `app/interfaces/api/dependencies.py` | Active |
| [[file_presentation_schemas_auth_py]] | `app/presentation/api/v1/schemas/auth.py` | Active |
| [[file_presentation_schemas_patient_py]] | `app/presentation/api/v1/schemas/patient.py` | Active |
| [[file_presentation_routers_patients_py]] | `app/presentation/api/v1/routers/patients.py` | Active |
| [[file_application_use_cases_register_patient_py]] | `app/application/use_cases/register_patient.py` | Active |

### Sprint 5 — Read Path (Active)

| Note | Code path | Status |
|---|---|---|
| [[file_interfaces_repositories_avaliacao_read_repository_py]] | `app/interfaces/repositories/avaliacao_read_repository.py` | Active |
| [[file_interfaces_repositories_dashboard_repository_py]] | `app/interfaces/repositories/dashboard_repository.py` | Active |
| [[file_application_use_cases_get_patient_history_py]] | `app/application/use_cases/get_patient_history.py` | Active |
| [[file_application_use_cases_get_dashboard_stats_py]] | `app/application/use_cases/get_dashboard_stats.py` | Active |
| [[file_application_use_cases_refresh_dashboard_py]] | `app/application/use_cases/refresh_dashboard.py` | Active |
| [[file_presentation_schemas_history_py]] | `app/presentation/api/v1/schemas/history.py` | Active |
| [[file_presentation_routers_history_py]] | `app/presentation/api/v1/routers/history.py` | Active |

### Sprint 6 — Patient List + Unit Tests (Active)

| Note | Code path | Status |
|---|---|---|
| [[file_interfaces_repositories_patient_read_repository_py]] | `app/interfaces/repositories/patient_read_repository.py` | Active |
| [[file_application_use_cases_get_patient_list_py]] | `app/application/use_cases/get_patient_list.py` | Active |
| [[file_domain_value_objects_cpf_py]] | `app/domain/value_objects/cpf.py` | Active |
| [[file_tests_conftest_py]] | `tests/conftest.py` | Active |
| [[dir_tests_unit_use_cases]] | `tests/unit/use_cases/` (16 tests, 0 failures) | Active |

### Sprint 7 — Documentation Bible (Active)

| Note | Coverage | Status |
|---|---|---|
| [[ADR-001-active-database-pattern]] | Active DB pattern rationale | accepted |
| [[ADR-002-jwt-stdlib-hs256]] | JWT stdlib rationale | accepted |
| [[ADR-003-k-anonymity-in-use-case-layer]] | K-anonymity placement | accepted |
| [[ADR-004-cpf-sha256-anonymization]] | CPF hashing placement | accepted |
| [[ADR-005-uuid-to-serial-resolution]] | UUID→SERIAL decision | accepted |
| [[dir_app_core]] | Layer guide — core | living |
| [[dir_app_domain]] | Layer guide — domain (rewritten) | living |
| [[dir_app_use_cases]] | Layer guide — use cases (updated) | living |
| [[dir_app_interfaces]] | Layer guide — interfaces (updated) | living |
| [[dir_tests]] | Layer guide — tests (Sprint 6 actuals) | living |
| [[dir_app_presentation]] | Layer guide — presentation (created) | living |
| [[file_core_config_py]] | Deep doc — config | Active |
| [[file_core_exceptions_py]] | Deep doc — exceptions | Active |
| [[file_core_security_py]] | Deep doc — security (stdlib HS256) | Active |
| [[file_db_database_py]] | Deep doc — database (PGP injection) | Active |
| [[file_domain_value_objects_cpf_py]] | Deep doc — CPF value object | Active |
| [[file_domain_entities_patient_py]] | Deep doc — Patient entity | Active |
| [[file_domain_services_symptom_scoring_orchestrator_py]] | Deep doc — scoring orchestrator (created) | Active |
| [[file_application_use_cases_submit_anamnesis_py]] | Deep doc — submit anamnesis | Active |
| [[file_application_use_cases_get_dashboard_stats_py]] | Deep doc — dashboard stats | Active |
| [[file_application_use_cases_get_patient_list_py]] | Deep doc — patient list | Active |
| [[file_application_use_cases_register_patient_py]] | Deep doc — register patient | Active |
| [[file_interfaces_api_dependencies_py]] | Deep doc — dependencies | Active |
| [[file_interfaces_repositories_avaliacao_read_repository_py]] | Deep doc — avaliacao read repo | Active |
| [[file_interfaces_repositories_dashboard_repository_py]] | Deep doc — dashboard repo | Active |
| [[file_interfaces_repositories_patient_read_repository_py]] | Deep doc — patient read repo | Active |
| [[file_root_main_py]] | Deep doc — main.py | Active |
| [[file_presentation_routers_auth_py]] | Deep doc — auth router | Active |
| [[file_presentation_routers_history_py]] | Deep doc — history router | Active |

---

## Conventions for new notes

1. Filename: `<NNN>_<Snake_Case_Title>.md`.
2. Always include the YAML keys: `id`, `title`, `type`, `status`,
   `created_date`, `updated_date`, `author`, `tags`, `related`.
3. Every paragraph that mentions a concept must wikilink it on first mention,
   even if the target is still an orphan.
4. Code snippets use fenced blocks with language hints (`​```python`).
5. Diagrams use Mermaid (Obsidian renders natively).
6. Update this MOC when you add or close a note. The Status board is the
   contract.

#moc #index #home #sxfp #backend
