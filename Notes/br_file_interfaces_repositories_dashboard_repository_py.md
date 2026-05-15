---
title: dashboard_repository.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_interfaces_repositories_dashboard_repository_py]]"
file_language: python
path: app/interfaces/repositories/dashboard_repository.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - dashboard
  - materialized-view
  - lgpd
  - pt-br
related:
  - "[[br_file_application_use_cases_get_dashboard_stats_py]]"
  - "[[br_file_application_use_cases_refresh_dashboard_py]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_ADR-003-k-anonymity-in-use-case-layer]]"
---

# `app/interfaces/repositories/dashboard_repository.py` — Repositório do Dashboard

## Contexto & Propósito

Adapter de leitura (outbound) para a view materializada
`vw_dashboard_anonimizado`. Serve dados de estatísticas agregadas e
anonimizadas ao [[br_file_application_use_cases_get_dashboard_stats_py]].
Também expõe `refresh_materialized_view()` para o endpoint admin de
atualização.

Dados de nível de paciente NUNCA saem deste repositório — apenas linhas
agregadas, que passam pela checagem de k-anonimato no caso de uso.

**Importante:** a aplicação de k-anonimato (K=5) **não é responsabilidade
deste repositório** — pertence exclusivamente à camada de caso de uso
([[br_file_application_use_cases_get_dashboard_stats_py]]). Este repositório
retorna todas as linhas que atendem aos filtros; o caso de uso é quem filtra
grupos com contagem abaixo do limiar. Conforme
[[br_ADR-003-k-anonymity-in-use-case-layer]].

## Logic Breakdown

**`DashboardRow`** — dataclass congelada, DTO de leitura:
- `uf_residencia: str | None`
- `sexo: str | None`
- `faixa_etaria: str | None`
- `etnia: str | None`
- `total_avaliacoes: int`
- `media_score: float | None`
- `taxa_recomendacao_exame: float | None`

**`DashboardRepository`**

- `__init__(self, session: AsyncSession)` — recebe a sessão SQLAlchemy assíncrona.

- `get_stats(*, uf=None, sexo=None, etnia=None) -> list[DashboardRow]`
  - `SELECT ... FROM vw_dashboard_anonimizado`.
  - Cláusula `WHERE` construída dinamicamente: apenas filtros não-`None`
    são incluídos, usando `text()` com parâmetros nomeados para evitar
    SQL injection.
  - Retorna todas as linhas que passam nos filtros; a checagem de
    k-anonimato ocorre no caso de uso.

- `refresh_materialized_view() -> None`
  - Executa `REFRESH MATERIALIZED VIEW CONCURRENTLY vw_dashboard_anonimizado`.
  - Requer que um índice único exista na view (pré-condição do DBA).
  - Chamado apenas pelo endpoint admin `POST /dashboard/refresh`.

## Dependencies
- **Internas:** stdlib (`dataclasses`); SQLAlchemy async.
- **Externas:** `sqlalchemy[asyncio]`.

## Consumers
- [[br_file_application_use_cases_get_dashboard_stats_py]]
- [[br_file_application_use_cases_refresh_dashboard_py]]

## Invariants / Pitfalls
- NUNCA expor identificadores de pacientes individuais; apenas linhas agregadas.
- A cláusula `WHERE` dinâmica DEVE usar parâmetros nomeados SQLAlchemy —
  nunca interpolação de string.
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` exige um índice único na view;
  sem ele o PostgreSQL retorna erro.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_ADR-003-k-anonymity-in-use-case-layer]]

#file #interfaces #repository #dashboard #materialized-view #lgpd #pt-br
