---
title: user_cases.py
type: File
status: Planned
language: python
path: app/use_cases/user_cases.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - use-cases
  - user
  - auth
  - command
related:
  - "[[file_services_auth_service_py]]"
  - "[[file_domain_schemas_user_py]]"
  - "[[file_interfaces_repositories_user_repository_py]]"
  - "[[file_core_security_py]]"
  - "[[008_AuthN_Strategy]]"
---

# `app/use_cases/user_cases.py` — Identity & Auth Use Cases

## Context & Purpose

Hosts the user-/auth-facing use cases. Each class wraps one HTTP intent:

| Use case | HTTP route | Service / Port |
|---|---|---|
| `RegisterDoctorUseCase` | `POST /api/v1/users` | `IUserRepository` + `IPasswordHasher` |
| `AuthenticateDoctorUseCase` | `POST /api/v1/auth/login` | [[file_services_auth_service_py]] |
| `GetCurrentDoctorUseCase` | `GET /api/v1/users/me` | `IUserRepository` |
| `RotatePasswordUseCase` *(planned)* | `POST /api/v1/users/me/password` | [[file_services_auth_service_py]] |

## Logic Breakdown

```python
from app.core.exceptions import ConflictError
from app.core.security import IPasswordHasher
from app.domain.models.user import Role, User
from app.domain.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.interfaces.repositories.user_repository import IUserRepository
from app.services.auth_service import AuthService


class RegisterDoctorUseCase:
    def __init__(self, users: IUserRepository, hasher: IPasswordHasher) -> None:
        self._users = users
        self._hasher = hasher

    async def execute(self, payload: UserCreate) -> UserResponse:
        if await self._users.get_by_email(payload.email) is not None:
            raise ConflictError("user.email_taken")
        entity = User(
            email=payload.email.lower(),
            full_name=payload.full_name,
            crm=payload.crm,
            role=Role.DOCTOR,
            password_hash=self._hasher.hash(payload.password.get_secret_value()),
        )
        saved = await self._users.add(entity)
        return UserResponse.model_validate(saved, from_attributes=True)


class AuthenticateDoctorUseCase:
    def __init__(self, auth: AuthService) -> None:
        self._auth = auth

    async def execute(self, payload: UserLogin) -> TokenResponse:
        return await self._auth.authenticate_doctor(
            email=payload.email,
            password=payload.password.get_secret_value(),
        )


class GetCurrentDoctorUseCase:
    def __init__(self, current_user: User) -> None:
        self._current_user = current_user

    def execute(self) -> UserResponse:
        return UserResponse.model_validate(self._current_user, from_attributes=True)
```

Key choices:

- **Conflict on duplicate email** — explicit business rule surfaced as
  `ConflictError`; the API layer translates to HTTP 409. We do not rely
  on the DB unique-constraint exception bubbling up; that would couple
  use-case logic to a particular driver's error class.
- **`SecretStr.get_secret_value()`** is called *only* at the use-case
  boundary, immediately before hashing, and the value is never bound to
  a named variable beyond the function argument scope.
- **`GetCurrentDoctorUseCase`** receives the resolved `User` from
  [[file_interfaces_api_dependencies_py]]'s `get_current_doctor`; no
  extra round-trip to the repo is needed.
- **Login is delegated entirely** to [[file_services_auth_service_py]] —
  a thin shell here keeps the route declarative.

## Dependencies
- **Internal:** [[file_services_auth_service_py]],
  [[file_interfaces_repositories_user_repository_py]],
  [[file_core_security_py]], [[file_domain_models_user_py]],
  [[file_domain_schemas_user_py]], [[file_core_exceptions_py]].
- **External:** standard library only.

## Consumers
- The auth/users APIRouter modules in `interfaces/api/v1/routers/`
  *(planned)*.

## Invariants / Pitfalls
- **Never echo the raw password back** in any response model.
- Email is lower-cased here AND at the repository layer — defence in
  depth against case-insensitive collisions.
- `RegisterDoctorUseCase` MUST NOT auto-issue a token; new accounts log
  in explicitly. This avoids racing with email/CRM verification flows.
- For LGPD audit (Art. 37), every successful registration produces an
  audit record via [[007_Audit_Logging_Middleware]] (request envelope)
  and an `IAuditSink` event for the domain mutation.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[006_LGPD_PII_Strategy]]
- [[007_Audit_Logging_Middleware]]
- [[008_AuthN_Strategy]] *(planned)*
- [[009_Authorization_RBAC]] *(planned)*

#file #use-cases #user #auth
