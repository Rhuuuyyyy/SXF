---
title: refresh_dashboard.py
type: File
status: Active
language: python
path: app/application/use_cases/refresh_dashboard.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - dashboard
  - admin
  - materialized-view
related:
  - "[[file_interfaces_repositories_dashboard_repository_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/refresh_dashboard.py` — RefreshDashboardUseCase

## Context & Purpose

Thin use case that delegates `REFRESH MATERIALIZED VIEW CONCURRENTLY` to the
repository. Admin-only: the router guards this endpoint with an inline role check
on `AuthenticatedDoctor.role`.

## Logic Breakdown

**`RefreshDashboardUseCase.execute()`**
- Calls `DashboardRepository.refresh_materialized_view()`.
- Returns `None` (204 No Content at the HTTP layer).

The use case is intentionally thin — no business logic beyond delegation. The
policy enforcement (admin-only) lives in the router for Sprint 5; Sprint 6 can
extract it to a `require_admin_role` Depends if more admin endpoints are added.

## Dependencies
- **Internal:** [[file_interfaces_repositories_dashboard_repository_py]].
- **External:** stdlib only.

## Consumers
- [[file_presentation_routers_history_py]] (`POST /dashboard/refresh`)

## Invariants / Pitfalls
- MUST NEVER import `fastapi`.
- The DBA team must ensure a unique index exists on `vw_dashboard_anonimizado`
  before `CONCURRENTLY` can be used — without it PostgreSQL will error.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]

#file #application #use-case #dashboard #admin
