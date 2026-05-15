---
id: dir-interfaces
title: "app/interfaces — Ports & Adapters"
type: DirGuide
status: living
language: pt-BR
mirrors: "[[dir_app_interfaces]]"
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_interfaces_repositories_acompanhante_repository_py]]"
  - "[[br_file_interfaces_repositories_avaliacao_repository_py]]"
  - "[[br_file_interfaces_repositories_checklist_repository_py]]"
  - "[[br_file_interfaces_repositories_avaliacao_read_repository_py]]"
  - "[[br_file_interfaces_repositories_dashboard_repository_py]]"
  - "[[br_file_interfaces_repositories_patient_read_repository_py]]"
tags:
  - directory
  - interfaces
  - adapters
  - hexagonal
  - ports
  - repositorios
  - pt-br
related:
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_ADR-001-active-database-pattern]]"
  - "[[br_ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
---

# `app/interfaces/` — Ports & Adapters

## Propósito

`app/interfaces/` é onde a [[br_Hexagonal_Architecture]] encontra o mundo
externo. Dois sub-namespaces:

- **`interfaces/api/`** — adaptadores HTTP de entrada: providers FastAPI
  `Depends` que traduzem claims JWT em objetos de identidade de domínio.
- **`interfaces/repositories/`** — adaptadores de persistência de saída:
  implementações concretas SQLAlchemy dos Protocols de Port.

## Filhos

### `interfaces/api/`

| Arquivo | Função |
|---|---|
| [[br_file_interfaces_api_dependencies_py]] | `get_current_doctor` — verificação JWT criptográfica; retorna `AuthenticatedDoctor(usuario_id, sessao_id, role)`. Sem acesso ao BD. |

### `interfaces/repositories/` — Adaptadores de escrita

| Arquivo | Agregado | Notas |
|---|---|---|
| [[br_file_interfaces_repositories_patient_repository_py]] | `Patient` | Escreve na view `pacientes`; trigger PGP criptografa PII |
| [[br_file_interfaces_repositories_acompanhante_repository_py]] | `Acompanhante` | `get_by_cpf(sha256_hex)` + `create()` |
| [[br_file_interfaces_repositories_avaliacao_repository_py]] | `Avaliacao` | `create_rascunho()` + `open_log_analise()` |
| [[br_file_interfaces_repositories_checklist_repository_py]] | `ChecklistResponse` | Inserção em bulk de respostas de sintoma |

### `interfaces/repositories/` — Adaptadores de leitura (Sprint 5+)

| Arquivo | Propósito | RBAC |
|---|---|---|
| [[br_file_interfaces_repositories_avaliacao_read_repository_py]] | Caminho de leitura do histórico do paciente | `JOIN pacientes ON criado_por = :usuario_id` |
| [[br_file_interfaces_repositories_dashboard_repository_py]] | Consultas `vw_dashboard_anonimizado` + REFRESH | WHERE dinâmico; sem RBAC (estatísticas anonimizadas) |
| [[br_file_interfaces_repositories_patient_read_repository_py]] | Lista de pacientes com paginação + filtros | `WHERE criado_por = :usuario_id`; recebe `cpf_hash`, nunca CPF bruto |

## Dependências Permitidas

- `fastapi`, `fastapi.security` (apenas em `interfaces/api/`).
- `sqlalchemy`, `sqlalchemy.ext.asyncio` (em `interfaces/repositories/`).
- `pydantic` — para dataclasses de modelo de leitura.
- Qualquer coisa de [[br_dir_app_domain]].
- [[br_dir_app_core]] — `config`, `exceptions`, `security`.
- [[br_dir_app_db]] — `get_db_session`, `AsyncSession`.

## Importações Proibidas

- **NÃO DEVE** importar de [[br_dir_app_use_cases]].
- **NÃO DEVE** conter política de conformidade — limiar de k-anonimato vive
  no caso de uso (ver [[br_ADR-003-k-anonymity-in-use-case-layer]]).
- **NÃO DEVE** receber dígitos brutos de CPF — o parâmetro `cpf_hash_filter`
  é um contrato rígido (ver [[br_ADR-004-cpf-sha256-anonymization]]).

## Padrões Chave

- **Repository Pattern** — todo agregado tem seu próprio adaptador. Caminhos
  de escrita e leitura são separados.
- **RBAC via SQL `WHERE`** — o `usuario_id` do médico é passado para cada
  adaptador de leitura; sem política de segurança em nível de linha no BD.
- **WHERE dinâmico** — listas de condição parametrizadas sem concatenação
  de string (sem risco de injeção SQL).
- **Escritas pelo Banco Ativo** — adaptadores de escrita têm como alvo views,
  não tabelas físicas (ver [[br_ADR-001-active-database-pattern]]).

## Invariantes

- Construtores de repositório aceitam apenas `AsyncSession`.
- `DashboardRepository.refresh_materialized_view()` usa
  `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
- `PatientListItem.nome` é descriptografado pela view do BD (chave PGP
  injetada via `get_db_session()` antes da consulta).

## ADRs Relacionados

- [[br_ADR-001-active-database-pattern]]
- [[br_ADR-003-k-anonymity-in-use-case-layer]]
- [[br_ADR-004-cpf-sha256-anonymization]]

#directory #interfaces #adapters #hexagonal #repositorios #pt-br
