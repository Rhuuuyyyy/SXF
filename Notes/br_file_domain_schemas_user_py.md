---
title: user.py (schema)
type: File
status: Planned
language: pt-BR
mirrors: "[[file_domain_schemas_user_py]]"
file_language: python
path: app/domain/schemas/user.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - schema
  - pydantic
  - api-contract
  - user
  - auth
  - pt-br
related:
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_services_auth_service_py]]"
  - "[[br_file_use_cases_user_cases_py]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_008_AuthN_Strategy]]"
---

# `app/domain/schemas/user.py` — Contratos API de User & Auth

## Context & Purpose

Schemas [[br_Pydantic]] suportando os endpoints de doctor-account e
autenticação. Definem a superfície que o [[br_Frontend_Team]] integra
contra `POST /auth/login`, `POST /users/register` e `GET /users/me`.

## Logic Breakdown

Cinco classes concretas (planejadas):

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

Escolhas-chave:

- **`SecretStr`** para fields de senha — Pydantic recusa dump via
  `model_dump()` a menos que explicitamente desembrulhado. Reduz a
  chance de senhas surfaem em logs.
- **`EmailStr`** — validação RFC 5322; rejeita injeções de local-part.
- **Pattern de `crm`** — `UF/digits` matcha o formato brasileiro do
  conselho médico; validação mais profunda (regras regionais) vive em
  [[br_file_utils_validators_py]].
- **Length de senha** — mínimo 12, máximo 128. O floor de 12 chars
  segue NIST SP 800-63B 2024 para senhas escolhidas por humanos.
- **`TokenResponse`** espelha o envelope `access_token_response` da
  RFC 6749; o [[br_Frontend_Team]] pode plugar qualquer client OAuth2
  padrão.
- **`UserResponse`** nunca inclui `password_hash`. Não há schema nesta
  base que faça.

## Dependencies
- **Externo:** `pydantic`, `pydantic[email]` (para `EmailStr`).
- **Interno:** [[br_file_domain_entities_user_py]] (enum `Role`).

## Consumers
- [[br_file_use_cases_user_cases_py]].
- [[br_file_services_auth_service_py]].
- [[br_file_interfaces_api_dependencies_py]] (routers planejados).
- [[br_Frontend_Team]] (via OpenAPI).

## Invariants / Pitfalls
- **Nenhum schema de senha pode herdar de uma base não-secret.** Um
  `UserUpdate` futuro que permita mudança de senha PRECISA manter
  `password: SecretStr | None`.
- `UserResponse` precisa NUNCA expor `password_hash` mesmo por
  acidente — adicione um teste mypy/ruff que asserta o field ausente
  ([[br_303_Contract_Tests]] *(planejado)*).
- Token expiry (`expires_in`) é informativo apenas; estado de auth é o
  claim `exp` do JWT, validado por [[br_file_core_security_py]].
- Regex de `crm` aceita códigos de estado em uppercase apenas; o lado
  cliente precisa upper-case antes de submeter, ou a API faz 422.

## Related ADRs
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #domain #schema #pydantic #user #auth #pt-br
