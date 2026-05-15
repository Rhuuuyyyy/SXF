---
title: dependencies.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_interfaces_api_dependencies_py]]"
file_language: python
path: app/interfaces/api/dependencies.py
created_date: 2026-05-03
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - api
  - fastapi
  - dependency-injection
  - auth
  - pt-br
related:
  - "[[br_file_root_main_py]]"
  - "[[br_file_core_config_py]]"
  - "[[br_file_core_security_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_file_interfaces_repositories_user_repository_py]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_services_auth_service_py]]"
  - "[[br_008_AuthN_Strategy]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
---

# `app/interfaces/api/dependencies.py` — Providers de DI do FastAPI

## Context & Purpose

Um único módulo que hospeda **todo callable `Depends`-able** que os
routers usam. Centralizar aqui:

- Mantém arquivos de router focados em path operations.
- Torna o **grafo de dependência** de cada endpoint legível à primeira
  vista.
- Fornece uma única superfície de override para testes
  (`app.dependency_overrides[get_current_doctor] = fake`).

Este é o *único* arquivo em [[br_dir_app_interfaces]] que pode importar
de [[br_dir_app_services]] / [[br_dir_app_use_cases]] (porque é
literalmente o wiring que ele performa).

## Logic Breakdown

Dependencies fornecidas (planejadas):

```python
from collections.abc import AsyncIterator
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import verify_access_token, TokenClaims
from app.db.database import get_db_session
from app.domain.models.user import Role, User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncIterator[AsyncSession]:
    yield session


async def get_current_doctor(
    token: str = Depends(oauth2_scheme),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_db),
) -> User:
    try:
        claims: TokenClaims = verify_access_token(token, settings)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
        ) from exc
    user = await UserRepository(session).get_by_id(claims.subject)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "inactive_user")
    return user


def require_role(role: Role):
    async def _checker(user: User = Depends(get_current_doctor)) -> User:
        if not user.has_role(role):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "forbidden")
        return user
    return _checker
```

Escolhas-chave:

- **`OAuth2PasswordBearer`** — schema RFC-compliant; FastAPI conecta
  ele no `securitySchemes` do OpenAPI automaticamente.
- **`verify_access_token`** — função stdlib HS256 de
  [[br_file_core_security_py]]. Sem `python-jose`, sem `pyjwt`, sem
  dependências de terceiros para JWT. Conforme
  [[br_ADR-002-jwt-stdlib-hs256]].
- **`require_role`** é uma **dependency factory** — retornar um
  closure permite que routers escrevam
  `Depends(require_role(Role.DOCTOR))` e fiquem declarativos.
- **Shadowing de DB session** — `get_db` re-yelda `get_db_session`
  (não `get_session`) para testes overridarem nesta camada sem tocar
  [[br_file_db_database_py]].
- **Erros traduzem aqui.** `AuthenticationError` /
  `AuthorizationError` de domínio (de [[br_file_core_exceptions_py]])
  viram `HTTPException`. O domínio fica HTTP-blind.

## Dependencies
- **Externo:** `fastapi`, `sqlalchemy[asyncio]`.
- **Interno:** [[br_file_core_config_py]], [[br_file_core_security_py]],
  [[br_file_db_database_py]],
  [[br_file_interfaces_repositories_user_repository_py]].

## Consumers
- Todo APIRouter sob `interfaces/api/v1/` (planejado).
- O composition root [[br_file_root_main_py]] (para overrides em testes).

## Invariants / Pitfalls
- **Não performe lógica de negócio aqui.** Qualquer coisa além de
  authentication/authorization pertence a um use case.
- O `oauth2_scheme.tokenUrl` PRECISA espelhar a rota de login real
  exatamente ou o botão "Authorize" do Swagger quebra.
- Qualquer `Depends` novo é mencionado em [[br_008_AuthN_Strategy]]
  *(planejado)* e adicionado à fixture de teste relevante.
- Não re-construa `JWTTokenIssuer` por request — `Depends(get_settings)`
  é cacheada, então o issuer é efetivamente um singleton; se mudar para
  instância por-request, latência aumenta sob load tests p99.

## Related ADRs
- [[br_002_Framework_Selection_FastAPI]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_ADR-002-jwt-stdlib-hs256]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #interfaces #fastapi #dependency-injection #auth #pt-br
