---
id: file-router-auth
title: "auth.py (router)"
type: File
status: Active
language: python
path: app/presentation/api/v1/routers/auth.py
created_date: 2026-05-08
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - fastapi
  - auth
  - login
  - jwt
related:
  - "[[file_services_auth_service_py]]"
  - "[[file_core_security_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[file_db_database_py]]"
  - "[[file_root_main_py]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/routers/auth.py` — Authentication HTTP Router

## Context & Purpose

FastAPI `APIRouter` for authentication endpoints, mounted at `/api/v1` by
[[file_root_main_py]]. Handles credential verification, session lifecycle,
and JWT issuance (Sprint 4 implemented; RS256 migration planned when the
`cryptography` extension becomes available — see [[ADR-002-jwt-stdlib-hs256]]).

## Endpoints

### `POST /api/v1/auth/login`

Uses `OAuth2PasswordRequestForm` so Swagger renders the "Authorize" button.
The `username` field maps to email (RFC 6749 convention).

**Flow:**

1. **Brute-force check** — `AuthService.check_brute_force(ip_origem)` → HTTP 429
   if threshold exceeded. This runs BEFORE credential verification to prevent
   timing-based user enumeration.
2. **Authenticate** — `AuthService.authenticate_doctor(email, senha_plain)`
   → `usuario_id` or `None`.
3. **Open session** — `AuthService.open_session()` → `sessao_id` (FK to
   `tb_log_sessoes`).
4. **Audit** — `AuthService.log_tentativa_login()` — always called, even on
   failure. Append-only audit record.
5. **On failure** → HTTP 401 with `WWW-Authenticate: Bearer`.
6. **On success** → `issue_access_token(usuario_id=..., role="doctor", sessao_id=...)`.
7. **Return** `TokenLoginResponse(access_token=..., token_type="bearer")`.

### `POST /api/v1/auth/logout`

- Requires `Depends(get_current_doctor)` — JWT Bearer required.
- Calls `AuthService.close_session(sessao_id, tipo_encerramento="logout")`.
- Returns HTTP 204 No Content.

## `TokenLoginResponse` Schema

```python
class TokenLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

## Dependencies

- **Internal:** [[file_services_auth_service_py]], [[file_core_security_py]]
  (`issue_access_token`), [[file_interfaces_api_dependencies_py]],
  [[file_db_database_py]].
- **External:** `fastapi`, `fastapi.security.OAuth2PasswordRequestForm`.

## Consumers

- [[file_root_main_py]] (`app.include_router(auth.router, ...)`).

## Invariants / Pitfalls

- `form_data.password` (plaintext credential) MUST NEVER be logged.
  `AuthService.authenticate_doctor` passes it to the DB as a bound parameter;
  the DB bcrypt trigger handles hashing.
- `check_brute_force` MUST run before `authenticate_doctor` — this ordering
  is a security requirement, not an implementation convenience.
- `TokenLoginResponse` contains `access_token` — treat it as a bearer
  credential per [[006_LGPD_PII_Strategy]]; do not log or expose in error messages.
- The router MUST NOT contain JWT signing logic — it calls `issue_access_token()`
  from [[file_core_security_py]].

## Related ADRs

- [[ADR-002-jwt-stdlib-hs256]] — why HS256 stdlib, no python-jose.
- [[006_LGPD_PII_Strategy]] — credentials must not be logged.
- [[007_Audit_Logging_Middleware]] — `log_tentativa_login` ensures audit trail.

#file #presentation #router #fastapi #auth #login #jwt
