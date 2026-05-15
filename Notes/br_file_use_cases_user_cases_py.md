---
title: user_cases.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_use_cases_user_cases_py]]"
file_language: python
path: app/use_cases/user_cases.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - use-cases
  - user
  - auth
  - command
  - pt-br
related:
  - "[[br_file_services_auth_service_py]]"
  - "[[br_file_domain_schemas_user_py]]"
  - "[[br_file_interfaces_repositories_user_repository_py]]"
  - "[[br_file_core_security_py]]"
  - "[[br_008_AuthN_Strategy]]"
---

# `app/use_cases/user_cases.py` — Casos de Uso de Identidade & Auth

## Context & Purpose

Hospeda os casos de uso user/auth-facing. Cada classe envolve uma
intenção HTTP:

| Caso de uso | Rota HTTP | Service / Port |
|---|---|---|
| `RegisterDoctorUseCase` | `POST /api/v1/users` | `IUserRepository` + `IPasswordHasher` |
| `AuthenticateDoctorUseCase` | `POST /api/v1/auth/login` | [[br_file_services_auth_service_py]] |
| `GetCurrentDoctorUseCase` | `GET /api/v1/users/me` | `IUserRepository` |
| `RotatePasswordUseCase` *(planejado)* | `POST /api/v1/users/me/password` | [[br_file_services_auth_service_py]] |

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

Escolhas-chave:

- **Conflict em email duplicado** — regra de negócio explícita
  surfada como `ConflictError`; a camada API traduz para HTTP 409.
  Não dependemos da exception de unique-constraint do DB borbulhar;
  isto acoplaria lógica de use case a uma classe de erro de driver
  particular.
- **`SecretStr.get_secret_value()`** é chamado *apenas* na boundary
  do use case, imediatamente antes do hash, e o valor nunca é bound a
  uma variável nomeada além do escopo do argumento da função.
- **`GetCurrentDoctorUseCase`** recebe o `User` resolvido de
  `get_current_doctor` em [[br_file_interfaces_api_dependencies_py]];
  sem round-trip extra ao repo.
- **Login é delegado completamente** a [[br_file_services_auth_service_py]]
  — uma casca fina aqui mantém a rota declarativa.

## Dependencies
- **Interno:** [[br_file_services_auth_service_py]],
  [[br_file_interfaces_repositories_user_repository_py]],
  [[br_file_core_security_py]], [[br_file_domain_entities_user_py]],
  [[br_file_domain_schemas_user_py]], [[br_file_core_exceptions_py]].
- **Externo:** standard library apenas.

## Consumers
- Os módulos APIRouter de auth/users em
  `interfaces/api/v1/routers/` *(planejado)*.

## Invariants / Pitfalls
- **Nunca ecoe a senha crua de volta** em qualquer response model.
- Email é lower-cased aqui E na camada de repositório — defesa em
  profundidade contra colisões case-insensitive.
- `RegisterDoctorUseCase` NÃO PODE auto-emitir token; contas novas
  fazem login explicitamente. Isso evita corrida com fluxos de
  verificação de email/CRM.
- Para audit LGPD (Art. 37), todo registro bem-sucedido produz um
  registro de audit via [[br_007_Audit_Logging_Middleware]] (envelope
  da request) e um evento `IAuditSink` para a mutação de domínio.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #use-cases #user #auth #pt-br
