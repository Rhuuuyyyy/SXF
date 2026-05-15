---
id: dir-presentation
title: "app/presentation — HTTP Presentation Layer"
type: DirGuide
status: living
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_root_main_py]]"
  - "[[file_presentation_routers_anamnesis_py]]"
  - "[[file_presentation_routers_auth_py]]"
  - "[[file_presentation_routers_patients_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[file_presentation_schemas_anamnesis_py]]"
  - "[[file_presentation_schemas_auth_py]]"
  - "[[file_presentation_schemas_patient_py]]"
  - "[[file_presentation_schemas_history_py]]"
tags:
  - directory
  - presentation
  - http
  - fastapi
  - routers
  - schemas
related:
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[file_interfaces_api_dependencies_py]]"
---

# `app/presentation/` — HTTP Presentation Layer

## Purpose

`app/presentation/` is the **outermost layer** of the hexagon — the only layer
allowed to know about HTTP. It translates incoming HTTP requests into use case
calls and use case results back into HTTP responses.

Two sub-namespaces:

- **`routers/`** — FastAPI `APIRouter` path operations. Each router wires one
  or more use cases with their repository adapters.
- **`schemas/`** — Pydantic request/response models. These are the API contract
  surface consumed by the frontend and documented by OpenAPI.

`app/main.py` sits at the root of `app/` and is the composition root: it
creates the FastAPI application, registers all routers, and maps domain
exceptions to RFC 7807 HTTP responses.

## Directory Layout

```
app/
├── main.py                          # create_app() factory; global exception handlers
└── presentation/
    └── api/
        └── v1/
            ├── routers/
            │   ├── anamnesis.py     # POST /api/v1/anamnesis
            │   ├── auth.py          # POST /api/v1/auth/login, /logout
            │   ├── patients.py      # POST /api/v1/pacientes, GET /api/v1/pacientes
            │   └── history.py       # GET /pacientes/{id}/historico, /dashboard/*
            └── schemas/
                ├── anamnesis.py     # AnamnesisRequest, AnamnesisResponse
                ├── auth.py          # LoginRequest, TokenLoginResponse
                ├── patient.py       # PatientCreateRequest, PatientResponse, PatientListResponse
                └── history.py       # HistoryResponse, DashboardStatsResponse
```

## Children

### `app/main.py`

| Concern | Detail |
|---|---|
| Factory pattern | `create_app() -> FastAPI` — the only function allowed to import from all layers |
| Lifespan | `async with lifespan(app)` — yields then `await engine.dispose()` |
| Exception map | `NotFoundError→404`, `ConflictError→409`, `AuthenticationError→401`, `AuthorizationError→403`, `LGPDComplianceError→422`, `DomainError→422`, `SXFpError→500` |
| Response format | RFC 7807 `{"type": code, "title": ..., "detail": ...}` |
| Health endpoint | `GET /health` — outside API prefix, no auth |
| CORS | `CORSMiddleware` with origins from `settings.cors_origins` |

### Routers

| File | Endpoints | Auth |
|---|---|---|
| [[file_presentation_routers_auth_py]] | `POST /auth/login`, `POST /auth/logout` | Login: none; Logout: JWT |
| [[file_presentation_routers_patients_py]] | `POST /pacientes`, `GET /pacientes` | JWT required |
| [[file_presentation_routers_anamnesis_py]] | `POST /anamnesis` | JWT required |
| [[file_presentation_routers_history_py]] | `GET /pacientes/{id}/historico`, `GET /dashboard/stats`, `POST /dashboard/refresh` | JWT required; refresh requires `role == "admin"` |

### Schemas

| File | Key models |
|---|---|
| [[file_presentation_schemas_auth_py]] | `LoginRequest`, `TokenLoginResponse` |
| [[file_presentation_schemas_patient_py]] | `PatientCreateRequest`, `AcompanhanteCreateRequest`, `PatientResponse` (LGPD-masked), `PatientListResponse` |
| [[file_presentation_schemas_anamnesis_py]] | `AnamnesisRequest`, `AnamnesisResponse` |
| [[file_presentation_schemas_history_py]] | `HistoryResponse`, `DashboardStatsResponse` |

## Allowed Dependencies

- `fastapi`, `fastapi.security`, `fastapi.middleware.cors`.
- [[dir_app_use_cases]] — use case classes (instantiated inline in routers).
- [[dir_app_interfaces]] — repository adapters (injected via `Depends(get_db_session)`).
- [[file_interfaces_api_dependencies_py]] — `get_current_doctor`, `AuthenticatedDoctor`.
- [[dir_app_core]] — `settings`, `exceptions`.
- `pydantic` — for schema definitions.

## Forbidden Imports

- **Routers MUST NOT** contain business logic. Validation belongs in entities;
  orchestration belongs in use cases.
- **Schemas MUST NOT** import from [[dir_app_domain]] entities directly —
  schemas are the external contract surface; they must be independently
  evolvable.
- **`main.py`** is the only file allowed to import across all layers.

## Key Patterns

- **LGPD masking at the router boundary** — `PatientResponse.nome_masked` is
  computed in the router (first name kept; remaining parts get `[0]***`).
- **`extra="forbid"` on all schemas** — unknown fields in requests raise HTTP 422.
- **Brute-force guard before credential check** — `auth.py` calls
  `AuthService.check_brute_force()` before `authenticate_doctor()`; a 429 is
  returned if the threshold is exceeded.
- **Inline role check for admin** — `history.py` checks `doctor.role != "admin"`
  inline for the refresh endpoint; it is not a `Depends` because the pattern
  is unique to this single route.
- **RFC 7807 error envelope** — all error responses return
  `{"type": "...", "title": "...", "detail": "..."}` via the global handler.

## Invariants

- The API prefix `/api/v1` is set in `settings.api_prefix`; it is not
  hardcoded in any individual router.
- `GET /health` must never require authentication — it is the liveness probe
  for the load balancer.
- Schema `id` fields exposed in responses are UUIDs; internal integer PKs
  are never exposed unless named with the `_db_id` suffix convention.

## Related ADRs

- [[ADR-002-jwt-stdlib-hs256]] — JWT verification in `get_current_doctor`.
- [[003_Hexagonal_Architecture_Strategy]] — why routers are the outermost layer.
- [[005_Integration_Contracts_DTOs]] — contract surfaces.
- [[006_LGPD_PII_Strategy]] — LGPD masking at the response boundary.

#directory #presentation #http #fastapi #routers
