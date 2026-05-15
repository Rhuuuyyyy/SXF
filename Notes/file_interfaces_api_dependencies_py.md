---
id: file-interfaces-dependencies
title: "dependencies.py (interfaces/api)"
type: File
status: Active
language: python
path: app/interfaces/api/dependencies.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - api
  - fastapi
  - dependency-injection
  - auth
  - jwt
related:
  - "[[file_core_security_py]]"
  - "[[file_root_main_py]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[file_presentation_routers_auth_py]]"
  - "[[file_presentation_routers_patients_py]]"
  - "[[file_presentation_routers_history_py]]"
---

# `app/interfaces/api/dependencies.py` — FastAPI DI Providers

## Context & Purpose

A single module that hosts **every `Depends`-able callable** the routers use.
Centralising here:

- Keeps router files focused on path operations.
- Makes the **dependency graph** of every endpoint legible at a glance.
- Provides a single override surface for tests:
  `app.dependency_overrides[get_current_doctor] = fake_doctor`.

## Public Surface

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

@dataclass(frozen=True)
class AuthenticatedDoctor:
    usuario_id: int   # DB integer PK from usuarios.id (JWT claim 'sub', converted to int)
    sessao_id: int    # FK to tb_log_sessoes (JWT claim 'sid')
    role: str         # 'doctor' | 'admin'

async def get_current_doctor(
    token: str = Depends(oauth2_scheme),
) -> AuthenticatedDoctor: ...
```

## `get_current_doctor` Logic

```python
async def get_current_doctor(token: str = Depends(oauth2_scheme)) -> AuthenticatedDoctor:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        claims: TokenClaims = verify_access_token(token)
    except (JWTError, Exception):
        raise credentials_exception from None

    if claims.role not in ("doctor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role não autorizado para este endpoint.",
        )

    return AuthenticatedDoctor(
        usuario_id=claims.usuario_id,
        sessao_id=claims.sessao_id,
        role=claims.role,
    )
```

Key points:
- **No database hit** — verification is purely cryptographic (stdlib HMAC).
- Catches both `JWTError` (typed) and bare `Exception` (safety net for
  unexpected errors like malformed base64) and maps both to HTTP 401.
- Role gate: only `"doctor"` and `"admin"` are authorised; any other role
  value in the JWT returns HTTP 403.

## `AuthenticatedDoctor` vs Domain Entity

`AuthenticatedDoctor` is a **lightweight identity DTO**, not a full domain
`User` entity. Loading the full entity would require a DB round-trip on
every authenticated request. Use `AuthenticatedDoctor` for authorization
guards only; load the full entity inside use cases when business logic requires it.

## Dependencies

- **External:** `fastapi`, `fastapi.security.OAuth2PasswordBearer`.
- **Internal:** [[file_core_security_py]] (`verify_access_token`, `JWTError`, `TokenClaims`).
- **No third-party JWT library** — see [[ADR-002-jwt-stdlib-hs256]].

## Consumers

| Consumer | Usage |
|---|---|
| [[file_presentation_routers_anamnesis_py]] | `Depends(get_current_doctor)` |
| [[file_presentation_routers_patients_py]] | `Depends(get_current_doctor)` |
| [[file_presentation_routers_history_py]] | `Depends(get_current_doctor)` |
| [[file_presentation_routers_auth_py]] | Logout only (login has no auth dependency) |

## Invariants / Pitfalls

- `oauth2_scheme.tokenUrl` must exactly match the login route path
  (`"/api/v1/auth/login"`) or Swagger's "Authorize" button breaks.
- Do not perform business logic here. Anything beyond auth/authz belongs in a use case.
- Test isolation: use `app.dependency_overrides[get_current_doctor] = lambda: AuthenticatedDoctor(1, 1, "doctor")`
  in integration tests to bypass JWT verification.

## Related ADRs

- [[ADR-002-jwt-stdlib-hs256]] — why no python-jose/PyJWT dependency.
- [[003_Hexagonal_Architecture_Strategy]] — FastAPI wiring at the adapter layer.
- [[009_Authorization_RBAC]] *(planned)* — role expansion.

#file #interfaces #fastapi #dependency-injection #auth #jwt
