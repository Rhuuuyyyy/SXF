---
title: refresh_dashboard.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_use_cases_refresh_dashboard_py]]"
file_language: python
path: app/application/use_cases/refresh_dashboard.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - dashboard
  - admin
  - materialized-view
  - pt-br
related:
  - "[[br_file_interfaces_repositories_dashboard_repository_py]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/refresh_dashboard.py` — RefreshDashboardUseCase

## Contexto & Propósito

Caso de uso fino que delega `REFRESH MATERIALIZED VIEW CONCURRENTLY` ao
repositório. Exclusivo para admin: o router protege este endpoint com uma
checagem inline de papel em `AuthenticatedDoctor.role`.

## Logic Breakdown

**`RefreshDashboardUseCase.execute()`**
- Chama `DashboardRepository.refresh_materialized_view()`.
- Retorna `None` (204 No Content na camada HTTP).

O caso de uso é intencionalmente fino — sem lógica de negócio além da
delegação. A aplicação da política (admin-only) vive no router para o
Sprint 5; o Sprint 6 pode extraí-la para um `require_admin_role` Depends
se mais endpoints admin forem adicionados.

## Dependencies
- **Internas:** [[br_file_interfaces_repositories_dashboard_repository_py]].
- **Externas:** apenas stdlib.

## Consumers
- [[br_file_presentation_routers_history_py]] (`POST /dashboard/refresh`)

## Invariants / Pitfalls
- NUNCA importar `fastapi`.
- O time de DBA deve garantir que um índice único exista em
  `vw_dashboard_anonimizado` antes de `CONCURRENTLY` poder ser usado —
  sem ele o PostgreSQL retornará erro.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #application #use-case #dashboard #admin #pt-br
