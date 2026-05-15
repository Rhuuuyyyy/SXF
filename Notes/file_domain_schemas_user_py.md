---
title: user.py (schema)
type: File
status: Planned
language: python
path: app/domain/schemas/user.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - schema
  - pydantic
  - api-contract
  - user
  - auth
related:
  - "[[file_domain_models_user_py]]"
  - "[[file_services_auth_service_py]]"
  - "[[file_use_cases_user_cases_py]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[008_AuthN_Strategy]]"
---

# `app/domain/schemas/user.py` — User & Auth API Contracts

## Context & Purpose

[[Pydantic]] schemas backing the doctor-account and authentication
endpoints. They define the surface the [[Frontend_Team]] integrates against
for `POST /auth/login`, `POST /users/register`, and `GET /users/me`.

## Logic Breakdown

Five concrete classes (planned):

```python
from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr

from app.domain.models.user import Role


class UserBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class UserCreate(UserBase):
    email: EmailStr
    full_name: Annotated[str, Field(min_length=2, max_length=120)]
    crm: Annotated[str, Field(pattern=r"^[A-Z]{2}/\d{4,7}$")]
    password: Annotated[SecretStr, Field(min_length=12, max_length=128)]


class UserLogin(UserBase):
    email: EmailStr
    password: SecretStr


class TokenResponse(UserBase):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int  # seconds


class UserResponse(UserBase):
    id: UUID
    email: EmailStr
    full_name: str
    crm: str
    role: Role
    is_active: bool
    created_at: datetime
```

Key choices:

- **`SecretStr`** for password fields — Pydantic refuses to dump it via
  `model_dump()` unless explicitly unwrapped. Reduces the chance of
  passwords surfacing in logs.
- **`EmailStr`** — RFC 5322 validation; rejects local-part injections.
- **`crm` pattern** — `UF/digits` matches the Brazilian medical-board
  format; deeper validation (regional rules) lives in
  [[file_utils_validators_py]].
- **Password length** — minimum 12, maximum 128. The 12-char floor follows
  NIST SP 800-63B 2024 guidance for human-chosen passwords.
- **`TokenResponse`** mirrors OAuth2 RFC 6749's `access_token_response`
  envelope; the [[Frontend_Team]] can plug in any standard OAuth2 client.
- **`UserResponse`** never includes `password_hash`. There is no schema in
  this codebase that does.

## Dependencies
- **External:** `pydantic`, `pydantic[email]` (for `EmailStr`).
- **Internal:** [[file_domain_models_user_py]] (`Role` enum).

## Consumers
- [[file_use_cases_user_cases_py]].
- [[file_services_auth_service_py]].
- [[file_interfaces_api_dependencies_py]] (planned routers).
- [[Frontend_Team]] (via OpenAPI).

## Invariants / Pitfalls
- **No password schema may inherit a non-secret base.** A future
  `UserUpdate` that allows password change MUST keep `password:
  SecretStr | None`.
- `UserResponse` must NEVER expose `password_hash` even by accident —
  add a `mypy`/`ruff` test that asserts the field is absent
  ([[303_Contract_Tests]] *(planned)*).
- Token expiry (`expires_in`) is informational only; auth state is the
  JWT's `exp` claim, validated by [[file_core_security_py]].
- `crm` regex accepts upper-case state codes only; the client side must
  upper-case before submit, or the API will 422.

## Related ADRs
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]
- [[008_AuthN_Strategy]] *(planned)*
- [[009_Authorization_RBAC]] *(planned)*

#file #domain #schema #pydantic #user #auth
