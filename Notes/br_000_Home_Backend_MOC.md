---
id: MOC-000
title: "Home — Base de Conhecimento do Backend"
type: MOC
status: living
language: pt-BR
mirrors: "[[000_Home_Backend_MOC]]"
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
  - pt-br
related:
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_000_AI_OBSIDIAN_PROTOCOL]]"
  - "[[br_ADR-001-active-database-pattern]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
  - "[[br_ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
  - "[[br_ADR-005-uuid-to-serial-resolution]]"
---

# Home — Base de Conhecimento do Backend SXFp

> Ponto único de entrada para qualquer leitor deste vault. A partir daqui
> toda decisão arquitetural, mapa de codebase, política de segurança e
> padrão de design está a um clique. Marque este arquivo como starred
> note no Obsidian.

---

## Como ler este vault

- Toda nota carrega `id`, `status`, `tags`, `created_date` e uma lista
  `related` na frontmatter YAML. Use o **Graph View** do Obsidian para
  visualizar o grafo de conhecimento.
- Convenção de numeração:
    - `000` — índice / map of content (este arquivo).
    - `001–099` — **ADRs** (Architecture Decision Records).
    - `1XX` — **Mapas de codebase** (deep dives de pastas/arquivos).
    - `2XX` — **Runbooks operacionais** (futuro).
    - `3XX` — **Testes & QA** (futuro).
- **Links órfãos** como `[[SymptomScoringService]]` ou
  `[[IPatientRepository]]` são intencionais: são *promessas* — arquivos
  que serão preenchidos quando o código correspondente chegar. Clique
  para ver os backlinks mesmo antes da página existir.
- Toda nota termina com uma linha `#tags`. A taxonomia completa vive em
  [[br_Glossary_and_Tags]] *(planejado)*.

---

## Fundação

O conjunto inicial inegociável. Leia antes de contribuir com código.

- [[br_001_Architecture_and_Context]] — contexto de negócio, drivers,
  decisões de alto nível. O "porquê" do sistema todo.
- [[br_100_Codebase_and_Directory_Map]] — toda pasta e todo arquivo
  criados até agora, explicados.
- [[br_004_Directory_Structure]] *(planejado)* — convenções de nomes e
  regras de import aplicadas via `ruff` / `import-linter`.

---

## Arquitetura & Padrões

- [[br_002_Framework_Selection_FastAPI]] — por que FastAPI ao invés de
  Flask, Django REST e Litestar, com benchmarks e snippets.
- [[br_003_Hexagonal_Architecture_Strategy]] — Ports & Adapters em
  Python, incluindo como o DB e o frontend são plugáveis sem tocar no
  domínio.
- [[br_Composition_Root]] *(planejado)* — o ponto único onde adapters
  encontram ports.
- [[br_Dependency_Injection]] *(planejado)* — uso do `Depends()` do
  FastAPI para wirar o hexágono.
- [[br_Repository_Pattern]] *(conceito)* — a abstração que assinamos
  com o time de DBA.

---

## API & Contratos de Integração

- [[br_005_Integration_Contracts_DTOs]] — as três superfícies de
  contrato (schemas Pydantic, DTOs, Ports) e quem consome cada uma.
- [[br_OpenAPI]] *(conceito)* — como o time de frontend consome nossa
  spec.
- [[br_API_Versioning_Strategy]] *(planejado)* — política de `/api/v1`
  e regras de deprecação.
- [[br_Error_Response_Envelope]] *(planejado)* — RFC 7807 Problem
  Details.

---

## Segurança & Compliance

- [[br_006_LGPD_PII_Strategy]] — classificação de dados sensíveis,
  mascaramento, pseudonimização, camadas de criptografia, direito de
  exclusão.
- [[br_007_Audit_Logging_Middleware]] — captura não-bloqueante de
  who/what/when para toda requisição que muda estado.
- [[br_008_AuthN_Strategy]] *(planejado)* — fluxo OAuth2 password +
  JWT RS256.
- [[br_009_Authorization_RBAC]] *(planejado)* — papéis, escopos,
  deny-by-default.
- [[br_Argon2id]] *(conceito)* — baseline de hashing de senha.
- [[br_ANPD]] *(conceito)* — diretrizes da autoridade brasileira de
  proteção de dados.

---

## Modelo de Domínio (notas em desenvolvimento)

Aggregates e entradas de linguagem ubíqua referenciados pela ADR
[[br_001_Architecture_and_Context]].

### Entidades
- [[br_Patient]] — aggregate root para uma pessoa.
- [[br_Anamnesis]] — submissão do checklist com timestamp e versão.
- [[br_ClinicalAlert]] — emitido pelo [[br_SymptomScoringService]].
- [[br_DoctorAccount]] — identidade autenticada com papel `doctor`.

### Value objects
- [[br_CPF]] — ID brasileiro de contribuinte, validado e mascarado.
- [[br_ScoreBand]] — `{LOW, MODERATE, HIGH}` com thresholds.
- [[br_BirthDate]] — encapsula `date` e expõe `age_years`.
- [[br_GeneticTestRecommendation]] — enum tipado de recomendação.

### Domain services
- [[br_SymptomScoringService]] — scorer determinístico, versionado.
- [[br_ClinicalDecisionRules]] — tabela de funções puras.

### Ports
- [[br_IPatientRepository]]
- [[br_IAnamnesisRepository]]
- [[br_IClinicalAlertRepository]]
- [[br_IAuditSink]]
- [[br_IPasswordHasher]]
- [[br_ITokenIssuer]]

---

## Casos de Uso da Aplicação (em desenvolvimento)

- [[br_SubmitAnamnesisUseCase]] — caminho principal de escrita clínica.
- [[br_GetPatientHistoryUseCase]] — caminho de leitura.
- [[br_GenerateStatisticsUseCase]] — agregados anonimizados.
- [[br_AuthenticateDoctorUseCase]] — login.

---

## Operações *(futuro)*

- [[br_200_Local_Development]] — venv, uvicorn, hot reload.
- [[br_201_CI_Pipeline]] — gates de ruff + mypy + pytest.
- [[br_202_Deployment_Topology]] — load balancer, instâncias, audit
  sink.
- [[br_210_Performance_Benchmarks]] — orçamento p50/p95 por endpoint.
- [[br_220_Observability]] — logging estruturado, traces, métricas.

---

## Testes *(futuro)*

- [[br_300_Testing_Strategy]] — pirâmide; fakes para Ports; contract
  tests.
- [[br_301_Domain_Test_Patterns]] — testes unitários puros sem subir
  FastAPI.
- [[br_302_Integration_Tests]] — `httpx.AsyncClient` contra `app`.
- [[br_303_Contract_Tests]] — verificando implementações dos Ports.

---

## Glossário

- [[br_LGPD]] — Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
- [[br_ANPD]] — Autoridade Nacional de Proteção de Dados.
- [[br_FXS]] — Síndrome do X Frágil (Fragile X Syndrome).
- [[br_FMR1]] — gene cuja expansão CGG causa FXS.
- [[br_Hexagonal_Architecture]] — ver [[br_003_Hexagonal_Architecture_Strategy]].
- [[br_Clean_Architecture]] — Robert C. Martin, 2017.
- [[br_Repository_Pattern]] — Fowler, *PoEAA*, 2002.
- [[br_k-anonymity]] — limiar de anonimização para
  [[br_GenerateStatisticsUseCase]].
- [[br_ASGI]] — Asynchronous Server Gateway Interface.
- [[br_OpenAPI]] — formato de descrição de API REST, versão 3.1.
- [[br_OAuth2]] — RFC 6749.
- [[br_JWT]] — RFC 7519, assinado com RS256 neste projeto.
- [[br_Pydantic]] — Pydantic v2 (validador com core em Rust).
- [[br_FastAPI]] — framework HTTP primário. Ver
  [[br_002_Framework_Selection_FastAPI]].

---

## Status board

| Nota | Status | Última atualização |
|---|---|---|
| [[br_001_Architecture_and_Context]] | accepted | 2026-05-02 |
| [[br_002_Framework_Selection_FastAPI]] | accepted | 2026-05-03 |
| [[br_003_Hexagonal_Architecture_Strategy]] | accepted | 2026-05-03 |
| [[br_005_Integration_Contracts_DTOs]] | accepted | 2026-05-03 |
| [[br_006_LGPD_PII_Strategy]] | accepted | 2026-05-03 |
| [[br_007_Audit_Logging_Middleware]] | accepted | 2026-05-03 |
| [[br_100_Codebase_and_Directory_Map]] | living | 2026-05-03 |
| [[br_004_Directory_Structure]] | planned | — |
| [[br_008_AuthN_Strategy]] | planned | — |
| [[br_009_Authorization_RBAC]] | planned | — |
| [[br_010_Statistics_Anonymisation]] | planned | — |

### ADRs (Sprint 7)

| ADR | Título | Status |
|---|---|---|
| [[br_ADR-001-active-database-pattern]] | Padrão de Banco Ativo — PGP, bcrypt, pontuação no PostgreSQL | accepted |
| [[br_ADR-002-jwt-stdlib-hs256]] | JWT stdlib HS256 — sem biblioteca JWT de terceiros | accepted |
| [[br_ADR-003-k-anonymity-in-use-case-layer]] | Aplicação de K-Anonimato na Camada de Caso de Uso | accepted |
| [[br_ADR-004-cpf-sha256-anonymization]] | Anonimização de CPF com SHA-256 — hash no caso de uso | accepted |
| [[br_ADR-005-uuid-to-serial-resolution]] | Resolução UUID→SERIAL — `criado_por_db_id: int` | accepted |

### Mapas de código de domínio (ativos)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_domain_entities_user_py]] | `app/domain/entities/user.py` | Active |
| [[br_file_domain_entities_patient_py]] | `app/domain/entities/patient.py` | Active |
| [[br_file_domain_entities_symptom_py]] | `app/domain/entities/symptom.py` | Active |
| [[br_file_domain_entities_evaluation_py]] | `app/domain/entities/evaluation.py` | Active |
| [[br_file_domain_entities_checklist_response_py]] | `app/domain/entities/checklist_response.py` | Active |
| [[br_file_domain_ports_user_repository_py]] | `app/domain/ports/user_repository.py` | Active |
| [[br_file_domain_ports_patient_repository_py]] | `app/domain/ports/patient_repository.py` | Active |
| [[br_file_domain_ports_symptom_repository_py]] | `app/domain/ports/symptom_repository.py` | Active |
| [[br_file_domain_ports_evaluation_repository_py]] | `app/domain/ports/evaluation_repository.py` | Active |
| [[br_file_domain_ports_checklist_response_repository_py]] | `app/domain/ports/checklist_response_repository.py` | Active |
| [[br_file_domain_models_user_py]] | (não implementado; substituído) | Archived |
| [[br_file_domain_models_patient_py]] | (não implementado; substituído) | Archived |

### Sprint 1 — Fundação (Ativo)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_core_config_py]] | `app/core/config.py` | Active |
| [[br_file_db_database_py]] | `app/db/database.py` | Active |
| [[br_file_domain_value_objects_cpf_py]] | `app/domain/value_objects/cpf.py` | Active |
| [[br_file_domain_entities_acompanhante_py]] | `app/domain/entities/acompanhante.py` | Active |
| [[br_file_domain_services_symptom_scoring_orchestrator_py]] | `app/domain/services/symptom_scoring_orchestrator.py` | Active |
| [[br_file_interfaces_repositories_patient_repository_py]] | `app/interfaces/repositories/patient_repository.py` | Active |
| [[br_file_interfaces_repositories_acompanhante_repository_py]] | `app/interfaces/repositories/acompanhante_repository.py` | Active |

### Sprint 2 — Camada de Aplicação (Ativo)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_core_exceptions_py]] | `app/core/exceptions.py` | Active |
| [[br_file_presentation_schemas_anamnesis_py]] | `app/presentation/api/v1/schemas/anamnesis.py` | Active |
| [[br_file_interfaces_repositories_avaliacao_repository_py]] | `app/interfaces/repositories/avaliacao_repository.py` | Active |
| [[br_file_interfaces_repositories_checklist_repository_py]] | `app/interfaces/repositories/checklist_repository.py` | Active |
| [[br_file_application_use_cases_submit_anamnesis_py]] | `app/application/use_cases/submit_anamnesis.py` | Active |
| [[br_file_services_auth_service_py]] | `app/services/auth_service.py` | Active |

### Sprint 3 — Camada HTTP (Ativo)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_application_dtos_anamnesis_py]] | `app/application/dtos/anamnesis.py` | Active |
| [[br_file_presentation_routers_anamnesis_py]] | `app/presentation/api/v1/routers/anamnesis.py` | Active |
| [[br_file_presentation_routers_auth_py]] | `app/presentation/api/v1/routers/auth.py` | Active |
| [[br_file_root_main_py]] | `app/main.py` (lifespan + routers conectados) | Active |

### Sprint 4 — JWT + Cadastro de Paciente (Ativo)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_core_security_py]] | `app/core/security.py` | Active |
| [[br_file_interfaces_api_dependencies_py]] | `app/interfaces/api/dependencies.py` | Active |
| [[br_file_presentation_schemas_auth_py]] | `app/presentation/api/v1/schemas/auth.py` | Active |
| [[br_file_presentation_schemas_patient_py]] | `app/presentation/api/v1/schemas/patient.py` | Active |
| [[br_file_presentation_routers_patients_py]] | `app/presentation/api/v1/routers/patients.py` | Active |
| [[br_file_application_use_cases_register_patient_py]] | `app/application/use_cases/register_patient.py` | Active |

### Sprint 5 — Read Path (Ativo)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_interfaces_repositories_avaliacao_read_repository_py]] | `app/interfaces/repositories/avaliacao_read_repository.py` | Active |
| [[br_file_interfaces_repositories_dashboard_repository_py]] | `app/interfaces/repositories/dashboard_repository.py` | Active |
| [[br_file_application_use_cases_get_patient_history_py]] | `app/application/use_cases/get_patient_history.py` | Active |
| [[br_file_application_use_cases_get_dashboard_stats_py]] | `app/application/use_cases/get_dashboard_stats.py` | Active |
| [[br_file_application_use_cases_refresh_dashboard_py]] | `app/application/use_cases/refresh_dashboard.py` | Active |
| [[br_file_presentation_schemas_history_py]] | `app/presentation/api/v1/schemas/history.py` | Active |
| [[br_file_presentation_routers_history_py]] | `app/presentation/api/v1/routers/history.py` | Active |

### Sprint 6 — Listagem de Pacientes + Testes Unitários (Ativo)

| Nota | Caminho de código | Status |
|---|---|---|
| [[br_file_interfaces_repositories_patient_read_repository_py]] | `app/interfaces/repositories/patient_read_repository.py` | Active |
| [[br_file_application_use_cases_get_patient_list_py]] | `app/application/use_cases/get_patient_list.py` | Active |
| [[br_file_domain_value_objects_cpf_py]] | `app/domain/value_objects/cpf.py` | Active |
| [[br_file_tests_conftest_py]] | `tests/conftest.py` | Active |
| [[br_dir_tests_unit_use_cases]] | `tests/unit/use_cases/` (16 testes, 0 falhas) | Active |

### Sprint 7 — Bíblia da Documentação (Ativo)

| Nota | Cobertura | Status |
|---|---|---|
| [[br_ADR-001-active-database-pattern]] | Justificativa padrão banco ativo | accepted |
| [[br_ADR-002-jwt-stdlib-hs256]] | Justificativa JWT stdlib | accepted |
| [[br_ADR-003-k-anonymity-in-use-case-layer]] | Posicionamento k-anonimato | accepted |
| [[br_ADR-004-cpf-sha256-anonymization]] | Posicionamento hash CPF | accepted |
| [[br_ADR-005-uuid-to-serial-resolution]] | Decisão UUID→SERIAL | accepted |
| [[br_dir_app_core]] | Guia de camada — core | living |
| [[br_dir_app_domain]] | Guia de camada — domínio (reescrito) | living |
| [[br_dir_app_use_cases]] | Guia de camada — casos de uso (atualizado) | living |
| [[br_dir_app_interfaces]] | Guia de camada — interfaces (atualizado) | living |
| [[br_dir_tests]] | Guia de camada — testes (Sprint 6 real) | living |
| [[br_dir_app_presentation]] | Guia de camada — apresentação (criado) | living |
| [[br_file_core_config_py]] | Doc profunda — config | Active |
| [[br_file_core_exceptions_py]] | Doc profunda — exceções | Active |
| [[br_file_core_security_py]] | Doc profunda — segurança (stdlib HS256) | Active |
| [[br_file_db_database_py]] | Doc profunda — banco de dados (injeção PGP) | Active |
| [[br_file_domain_value_objects_cpf_py]] | Doc profunda — objeto de valor CPF | Active |
| [[br_file_domain_entities_patient_py]] | Doc profunda — entidade Paciente | Active |
| [[br_file_domain_services_symptom_scoring_orchestrator_py]] | Doc profunda — orquestrador de score (criado) | Active |
| [[br_file_application_use_cases_submit_anamnesis_py]] | Doc profunda — submeter anamnese | Active |
| [[br_file_application_use_cases_get_dashboard_stats_py]] | Doc profunda — estatísticas dashboard | Active |
| [[br_file_application_use_cases_get_patient_list_py]] | Doc profunda — listar pacientes | Active |
| [[br_file_application_use_cases_register_patient_py]] | Doc profunda — registrar paciente | Active |
| [[br_file_interfaces_api_dependencies_py]] | Doc profunda — dependências | Active |
| [[br_file_interfaces_repositories_avaliacao_read_repository_py]] | Doc profunda — repo leitura avaliação | Active |
| [[br_file_interfaces_repositories_dashboard_repository_py]] | Doc profunda — repo dashboard | Active |
| [[br_file_interfaces_repositories_patient_read_repository_py]] | Doc profunda — repo leitura paciente | Active |
| [[br_file_root_main_py]] | Doc profunda — main.py | Active |
| [[br_file_presentation_routers_auth_py]] | Doc profunda — router auth | Active |
| [[br_file_presentation_routers_history_py]] | Doc profunda — router histórico | Active |

---

## Convenções para novas notas

1. Nome do arquivo: `<NNN>_<Snake_Case_Title>.md`.
2. Sempre incluir as chaves YAML: `id`, `title`, `type`, `status`,
   `created_date`, `updated_date`, `author`, `tags`, `related`.
3. Todo parágrafo que mencione um conceito DEVE wikilinkar na primeira
   ocorrência, mesmo se o alvo for órfão.
4. Snippets de código usam blocos cercados com hint de linguagem
   (`​```python`).
5. Diagramas usam Mermaid (Obsidian renderiza nativamente).
6. Atualize este MOC ao adicionar ou encerrar uma nota. O Status board é
   o contrato.

#moc #index #home #sxfp #backend #pt-br
