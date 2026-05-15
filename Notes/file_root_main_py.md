---
id: file-root-main
title: "main.py (ASGI entrypoint)"
type: File
status: Active
language: python
path: app/main.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app]]"
tags:
  - file
  - entrypoint
  - presentation
  - fastapi
  - composition-root
related:
  - "[[file_core_config_py]]"
  - "[[file_core_exceptions_py]]"
  - "[[file_db_database_py]]"
  - "[[file_presentation_routers_anamnesis_py]]"
  - "[[file_presentation_routers_auth_py]]"
  - "[[file_presentation_routers_patients_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/main.py` — ASGI Application Entry Point & Composition Root

## Context & Purpose

`app/main.py` is the **ASGI entry point** and the **composition root** of the
hexagonal architecture. It is the only file allowed to import from every other
layer. Responsibilities:

1. Construct the FastAPI application instance via `create_app()`.
2. Register all global exception handlers (RFC 7807 Problem Details).
3. Mount all routers under `settings.api_prefix` (`/api/v1`).
4. Configure CORS middleware.
5. Manage lifespan (open/close DB engine).

## Public Surface

```python
def create_app() -> FastAPI: ...   # pure factory — used by tests
app: FastAPI = create_app()        # module-level instance for uvicorn
```

## Logic Walkthrough

### Exception Handler Map

All SXFp domain exceptions are translated to RFC 7807 JSON:
`{"type": code, "title": <HTTP phrase>, "detail": str(exc)}`.

| Exception | HTTP Status | `code` |
|---|---|---|
| `NotFoundError` | 404 | `"resource.not_found"` |
| `ConflictError` | 409 | `"resource.conflict"` |
| `AuthenticationError` | 401 | `"auth.unauthenticated"` |
| `AuthorizationError` | 403 | `"auth.forbidden"` |
| `LGPDComplianceError` | 422 | `"lgpd.violation"` |
| `DomainError` | 422 | `"domain.error"` |
| `SXFpError` (base) | 500 | `"sxfp.error"` |

### Routers (all under `settings.api_prefix = "/api/v1"`)

| Router | Prefix | Endpoints |
|---|---|---|
| `auth.router` | `/api/v1` | `/auth/login`, `/auth/logout` |
| `anamnesis.router` | `/api/v1` | `/anamnesis` |
| `patients.router` | `/api/v1` | `/pacientes` |
| `history.router` | `/api/v1` | `/pacientes/{id}/historico`, `/dashboard/stats`, `/dashboard/refresh` |

### `GET /health`

Registered outside the API prefix — no auth required. Returns `{"status": "ok"}`.
Used as the liveness probe for load balancers / Kubernetes.

### Lifespan

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield                         # application running
    await engine.dispose()        # drain connection pool on shutdown
```

### CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Origins come from `settings.cors_origins` (empty by default; set via env).

## Dependencies

- **Internal:** all layers — this is the only file where that is permitted.
- **External:** `fastapi`, `starlette`.

## Consumers

- ASGI server: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- Test suite: `from app.main import create_app`.
- [[file_root_Dockerfile]]: `CMD ["uvicorn", "app.main:app", ...]`.

## Invariants / Pitfalls

- `main.py` MAY import from any layer; **no other file** may do so.
- Adding a new `SXFpError` subclass in [[file_core_exceptions_py]] requires
  a corresponding handler entry here in the same commit.
- `create_app()` is a pure factory — no global state beyond the module-level
  `app` instance. Tests call `create_app()` with `dependency_overrides` for isolation.
- `lifespan` must call `engine.dispose()` — omitting it leaves active connections
  open after the process exits, eventually exhausting the PgBouncer pool.

## Related ADRs

- [[003_Hexagonal_Architecture_Strategy]] — why `main.py` is the composition root.
- [[ADR-002-jwt-stdlib-hs256]] — no python-jose dependency in the app.
- [[002_Framework_Selection_FastAPI]] — FastAPI as the ASGI framework.

#file #entrypoint #composition-root #fastapi
