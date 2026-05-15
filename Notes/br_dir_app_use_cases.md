---
id: dir-use-cases
title: "app/application/use_cases — Casos de Uso da Aplicação"
type: DirGuide
status: living
language: pt-BR
mirrors: "[[dir_app_use_cases]]"
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_application_use_cases_register_patient_py]]"
  - "[[br_file_application_use_cases_get_patient_history_py]]"
  - "[[br_file_application_use_cases_get_dashboard_stats_py]]"
  - "[[br_file_application_use_cases_get_patient_list_py]]"
  - "[[br_file_application_use_cases_refresh_dashboard_py]]"
tags:
  - directory
  - casos-de-uso
  - application
  - clean-architecture
  - pt-br
related:
  - "[[br_dir_app_interfaces]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
---

# `app/application/use_cases/` — Casos de Uso da Aplicação

## Propósito

Cada arquivo em `app/application/use_cases/` corresponde a uma **intenção de
usuário nomeada e delimitada**. Casos de uso são os pontos de entrada que
routers HTTP conectam via injeção de construtor. Eles coordenam objetos de
domínio e adaptadores de repositório sem nada saber sobre HTTP.

Um caso de uso:
- Tem um único método `execute()` (parâmetros keyword-only).
- É **HTTP-blind**: levanta exceções de domínio de [[br_file_core_exceptions_py]],
  nunca `fastapi.HTTPException`.
- É o **ponto de aplicação de regras transversais**: conformidade LGPD
  (k-anonimato, hash de CPF) vive aqui, não no repositório ou router.

## Filhos

| Arquivo | Intenção | Regra chave aplicada |
|---|---|---|
| [[br_file_application_use_cases_submit_anamnesis_py]] | Caminho de escrita clínica — criar avaliação, inserir respostas, chamar função de score | Delega score ao `SymptomScoringOrchestrator` (Banco Ativo) |
| [[br_file_application_use_cases_register_patient_py]] | Registrar novo paciente + acompanhante opcional | Resolve acompanhante por CPF ou cria novo; define `criado_por_db_id` do JWT |
| [[br_file_application_use_cases_get_patient_history_py]] | Retornar histórico paginado de avaliações | RBAC aplicado via JOIN no repositório de leitura |
| [[br_file_application_use_cases_get_dashboard_stats_py]] | Retornar estatísticas anonimizadas do dashboard | Limiar k-anonimato = 5; levanta `LGPDComplianceError` se violado (ver [[br_ADR-003-k-anonymity-in-use-case-layer]]) |
| [[br_file_application_use_cases_get_patient_list_py]] | Listar pacientes registrados pelo médico autenticado | Hasheia CPF bruto para SHA-256 antes de consultar (ver [[br_ADR-004-cpf-sha256-anonymization]]) |
| [[br_file_application_use_cases_refresh_dashboard_py]] | `REFRESH MATERIALIZED VIEW CONCURRENTLY` | Apenas admin; verificado inline pelo router antes de chamar |

## Dependências Permitidas

- [[br_dir_app_domain]] — entidades, objetos de valor, serviços de domínio, ports.
- [[br_dir_app_interfaces]] — adaptadores de repositório como tipos concretos.
- [[br_dir_app_core]] — `exceptions`, `config` (se necessário).
- Biblioteca padrão.

## Importações Proibidas

- **NÃO DEVE** importar `fastapi` ou qualquer construto HTTP.
- **NÃO DEVE** importar de [[br_dir_app_presentation]].

## Padrões Chave

- **Injeção via construtor** — todo colaborador declarado em `__init__`.
- **Dataclasses de resultado congelados** — `AnamnesisResult`, `DashboardStatsResult`,
  `PatientListResult` — valores de retorno tipados e imutáveis.
- **Conformidade LGPD nesta camada** — `K_ANONYMITY_THRESHOLD` em
  [[br_file_application_use_cases_get_dashboard_stats_py]] e hash de CPF em
  [[br_file_application_use_cases_get_patient_list_py]].
- **Testável sem BD** — suíte do Sprint 6 tem 16 testes cobrindo todos os
  casos de uso usando fakes `AsyncMock(spec=)`; zero conexões ao BD.

## Invariantes

- `execute()` usa parâmetros keyword-only (`*`) — previne confusão de argumentos
  posicionais acidental.
- `HARD_LIMIT: int = 200` em `GetPatientListUseCase` é a única fonte de verdade
  para o tamanho máximo de página.
- `K_ANONYMITY_THRESHOLD: int = 5` é a única fonte de verdade para o limite de
  k-anonimato; alterá-lo requer novo ADR.

## ADRs Relacionados

- [[br_ADR-003-k-anonymity-in-use-case-layer]]
- [[br_ADR-004-cpf-sha256-anonymization]]
- [[br_ADR-001-active-database-pattern]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#directory #casos-de-uso #application #clean-architecture #pt-br
