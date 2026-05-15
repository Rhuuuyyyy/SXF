---
id: file-router-history
title: "history.py (router)"
type: File
status: Active
language: python
path: app/presentation/api/v1/routers/history.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - history
  - dashboard
  - lgpd
  - rbac
  - admin
related:
  - "[[file_application_use_cases_get_patient_history_py]]"
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[file_application_use_cases_refresh_dashboard_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[file_presentation_schemas_history_py]]"
  - "[[ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[file_root_main_py]]"
---

# `app/presentation/api/v1/routers/history.py` — History & Dashboard Router

## Context & Purpose

Exposes three read-path endpoints for evaluation history and dashboard
statistics. All require valid Bearer JWT. The dashboard refresh endpoint
is additionally gated on `role == "admin"` via an inline check.

## Endpoints

### `GET /api/v1/pacientes/{paciente_id}/historico`

- **Auth:** `Depends(get_current_doctor)`.
- **Query params:** `limit` (1–200, default 50), `offset` (default 0).
- **Flow:** instantiates `GetPatientHistoryUseCase` with
  `AvaliacaoReadRepository`; passes `doctor.usuario_id` for RBAC scoping.
- **Returns:** `PatientHistoryResponse` with pagination metadata.

### `GET /api/v1/dashboard/stats`

- **Auth:** `Depends(get_current_doctor)`.
- **Query params:** `uf`, `sexo`, `etnia` (all optional).
- **Flow:** instantiates `GetDashboardStatsUseCase` with `DashboardRepository`.
- **LGPD enforcement:** `LGPDComplianceError` raised by the use case is NOT
  caught here — it propagates to the global handler in [[file_root_main_py]]
  → HTTP 422 with `{"type": "lgpd.violation", ...}`.
- **Returns:** `DashboardStatsResponse` with `k_anonymity_threshold=5`
  hardcoded in the response (not read from a constant — the use case owns it).

### `POST /api/v1/dashboard/refresh`

- **Auth:** `Depends(get_current_doctor)`.
- **Role check (inline):**
  ```python
  if doctor.role != "admin":
      raise HTTPException(status_code=403, detail="Admin role required.")
  ```
  This check is inline (not a `Depends`) because it is unique to this single
  endpoint and would not justify a shared dependency.
- **Flow:** instantiates `RefreshDashboardUseCase` with `DashboardRepository`.
- **Returns:** HTTP 204 No Content.

## Dependencies

- **Internal:**
  - [[file_application_use_cases_get_patient_history_py]]
  - [[file_application_use_cases_get_dashboard_stats_py]]
  - [[file_application_use_cases_refresh_dashboard_py]]
  - [[file_interfaces_api_dependencies_py]] (`get_current_doctor`, `AuthenticatedDoctor`)
  - [[file_interfaces_repositories_avaliacao_read_repository_py]]
  - [[file_interfaces_repositories_dashboard_repository_py]]
  - [[file_presentation_schemas_history_py]]
  - [[file_db_database_py]]
- **External:** `fastapi`, `sqlalchemy[asyncio]`.

## Consumers

- [[file_root_main_py]] — `app.include_router(history.router, prefix=settings.api_prefix)`.

## Invariants / Pitfalls

- `LGPDComplianceError` MUST NOT be caught in this router — the global handler
  in [[file_root_main_py]] is the single translation point.
- `k_anonymity_threshold=5` in the response is hardcoded here for the response
  schema — the authoritative constant is `K_ANONYMITY_THRESHOLD` in
  [[file_application_use_cases_get_dashboard_stats_py]]. If the threshold changes,
  this response field must be updated too.
- The inline `doctor.role != "admin"` check is the correct pattern for a
  single admin endpoint — do not generalise to a shared `Depends` until a
  second admin endpoint exists.
- The router does NOT contain business logic — history filtering, RBAC, and
  k-anonymity enforcement all live in use cases and repositories.

## Related ADRs

- [[ADR-003-k-anonymity-in-use-case-layer]] — why `LGPDComplianceError` is not caught here.
- [[003_Hexagonal_Architecture_Strategy]] — router as outermost layer.
- [[006_LGPD_PII_Strategy]] — dashboard anonymisation requirement.

#file #presentation #router #history #dashboard #lgpd #rbac
