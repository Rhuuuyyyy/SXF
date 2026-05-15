---
title: history.py (router)
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_routers_history_py]]"
file_language: python
path: app/presentation/api/v1/routers/history.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - history
  - dashboard
  - lgpd
  - rbac
  - pt-br
related:
  - "[[br_file_application_use_cases_get_patient_history_py]]"
  - "[[br_file_application_use_cases_get_dashboard_stats_py]]"
  - "[[br_file_application_use_cases_refresh_dashboard_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_file_presentation_schemas_history_py]]"
  - "[[br_file_root_main_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_ADR-003-k-anonymity-in-use-case-layer]]"
---

# `app/presentation/api/v1/routers/history.py` — Router de Histórico & Dashboard

## Contexto & Propósito

Expõe três endpoints para o caminho de leitura. Todos exigem um Bearer JWT
válido. O endpoint de refresh do dashboard é adicionalmente protegido por
`role == 'admin'`.

## Logic Breakdown

**`GET /api/v1/pacientes/{paciente_id}/historico`**
- JWT obrigatório (`get_current_doctor`).
- Passa `doctor.usuario_id` ao `GetPatientHistoryUseCase` para RBAC.
- Paginação via parâmetros de query `limit` / `offset` (1–200, padrão 50).
- Retorna `PatientHistoryResponse`.

**`GET /api/v1/dashboard/stats`**
- JWT obrigatório.
- Filtros opcionais: `uf`, `sexo`, `etnia` como parâmetros de query.
- `LGPDComplianceError` propaga sem ser capturada → capturada pelo handler
  global em [[br_file_root_main_py]] → HTTP 422 RFC 7807.
- Retorna `DashboardStatsResponse` com campo `k_anonymity_threshold=5`
  **hardcoded** na resposta (K=5 é fixo conforme
  [[br_ADR-003-k-anonymity-in-use-case-layer]]).

**`POST /api/v1/dashboard/refresh`**
- JWT obrigatório + checagem inline de papel:
  `if doctor.role != "admin": raise HTTPException(403)`.
  A checagem é inline (não via `require_role` Depends) porque este é o
  único endpoint admin no Sprint atual.
- Chama `RefreshDashboardUseCase.execute()` → 204 No Content.

## Dependencies
- **Internas:**
  - [[br_file_application_use_cases_get_patient_history_py]]
  - [[br_file_application_use_cases_get_dashboard_stats_py]]
  - [[br_file_application_use_cases_refresh_dashboard_py]]
  - [[br_file_interfaces_api_dependencies_py]]
  - [[br_file_interfaces_repositories_avaliacao_read_repository_py]]
  - [[br_file_interfaces_repositories_dashboard_repository_py]]
  - [[br_file_presentation_schemas_history_py]]
  - [[br_file_db_database_py]]
- **Externas:** `fastapi`, `sqlalchemy[asyncio]`.

## Consumers
- [[br_file_root_main_py]] — `app.include_router(history.router, prefix=settings.api_prefix)`.

## Invariants / Pitfalls
- `LGPDComplianceError` NÃO é capturada aqui — o handler global em
  `main.py` cuida disso (mapeado para HTTP 422).
- A checagem de papel admin é inline (`doctor.role != "admin"`); quando
  mais endpoints admin existirem, extrair para um `require_admin_role`
  Depends.
- `k_anonymity_threshold=5` é hardcoded na resposta do dashboard — não
  configurável por parâmetro de query.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_ADR-003-k-anonymity-in-use-case-layer]]

#file #presentation #router #history #dashboard #lgpd #pt-br
