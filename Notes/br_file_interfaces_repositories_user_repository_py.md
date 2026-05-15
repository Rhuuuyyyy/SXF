---
title: user_repository.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_interfaces_repositories_user_repository_py]]"
file_language: python
path: app/interfaces/repositories/user_repository.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - user
  - sqlalchemy
  - adapter
  - auth
  - pt-br
related:
  - "[[br_file_interfaces_repositories_base_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_db_base_py]]"
  - "[[br_file_services_auth_service_py]]"
  - "[[br_file_use_cases_user_cases_py]]"
  - "[[br_file_core_security_py]]"
  - "[[br_008_AuthN_Strategy]]"
---

# `app/interfaces/repositories/user_repository.py` — Adapter de Persistência de User

## Context & Purpose

Adapter concreto para o Port `IUserRepository`. Faz a ponte entre a
entity [[br_file_domain_entities_user_py]] (`User`) e a row `UserORM`.
Fluxos de autenticação em [[br_file_services_auth_service_py]] e a
dependency `get_current_doctor` em
[[br_file_interfaces_api_dependencies_py]] ambos buscam users via este
repositório.

## Logic Breakdown

Skeleton (planejado):

```python
from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.domain.models.user import Role, User
from app.interfaces.repositories.base import IRepository, SqlAlchemyRepository


class IUserRepository(IRepository[User], Protocol):
    async def get_by_email(self, email: str) -> User | None: ...
    async def get_active_by_id(self, id: UUID) -> User | None: ...


class UserORM(Base):
    __tablename__ = "users"
    # colunas elididas — propriedade do [[br_DBA_Team]]


class SqlAlchemyUserRepository(SqlAlchemyRepository[User]):
    model = UserORM

    async def get(self, id: UUID) -> User | None:
        row = await self._session.get(UserORM, id)
        return self._to_entity(row) if row else None

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(UserORM).where(UserORM.email == email.lower())
        result = await self._session.execute(stmt)
        return self._to_entity(result.scalar_one_or_none())

    async def get_active_by_id(self, id: UUID) -> User | None:
        user = await self.get(id)
        return user if user and user.is_active else None

    async def add(self, entity: User) -> User:
        row = self._to_orm(entity)
        self._session.add(row)
        await self._session.flush()
        return self._to_entity(row)

    @staticmethod
    def _to_entity(row: UserORM | None) -> User | None:
        if row is None:
            return None
        return User(
            id=row.id,
            email=row.email,
            full_name=row.full_name,
            crm=row.crm,
            role=Role(row.role),
            password_hash=row.password_hash,
            is_active=row.is_active,
            created_at=row.created_at,
            last_login_at=row.last_login_at,
        )

    @staticmethod
    def _to_orm(entity: User) -> UserORM:
        return UserORM(
            id=entity.id,
            email=entity.email.lower(),
            full_name=entity.full_name,
            crm=entity.crm,
            role=entity.role.value,
            password_hash=entity.password_hash,
            is_active=entity.is_active,
            created_at=entity.created_at,
            last_login_at=entity.last_login_at,
        )
```

Escolhas-chave:

- **`get_by_email` lower-casa o input** — matcha a constraint de
  coluna setada na migração e evita bugs de case-sensitivity em login.
- **`get_active_by_id`** — conveniência para o `get_current_doctor` de
  [[br_file_interfaces_api_dependencies_py]]. Reduz o custo de
  round-trip vs. fetch-then-check.
- **`password_hash` é opaco** — viaja por este repositório sem
  modificação; verificação é feita em
  [[br_file_services_auth_service_py]] usando o `IPasswordHasher` de
  [[br_file_core_security_py]].

## Dependencies
- **Externo:** `sqlalchemy[asyncio]`.
- **Interno:** [[br_file_db_base_py]], [[br_file_domain_entities_user_py]],
  [[br_file_interfaces_repositories_base_py]],
  [[br_file_core_security_py]].

## Consumers
- [[br_file_services_auth_service_py]].
- [[br_file_use_cases_user_cases_py]].
- [[br_file_interfaces_api_dependencies_py]].

## Invariants / Pitfalls
- **Nunca exponha `password_hash` para cima** a menos que o caller
  seja o auth service. Outros use cases trabalham com `User` e nunca
  leem o hash.
- A coluna `email` tem índice único parcial *apenas em users ativos*
  (definido na migração correspondente). Re-registro após deleção de
  conta é permitido por design.
- Semântica de `delete` LGPD: pseudonimiza email + nome e flipa
  `is_active=False`; não dá `DELETE` na row, já que audit logs a
  referenciam. Ver [[br_006_LGPD_PII_Strategy]].
- A session é request-scoped (ver [[br_file_db_database_py]]); não
  cacheie instâncias deste repositório entre requests.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #interfaces #repository #user #adapter #pt-br
