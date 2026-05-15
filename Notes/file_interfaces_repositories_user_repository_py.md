---
title: user_repository.py
type: File
status: Planned
language: python
path: app/interfaces/repositories/user_repository.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - user
  - sqlalchemy
  - adapter
  - auth
related:
  - "[[file_interfaces_repositories_base_py]]"
  - "[[file_domain_models_user_py]]"
  - "[[file_db_base_py]]"
  - "[[file_services_auth_service_py]]"
  - "[[file_use_cases_user_cases_py]]"
  - "[[file_core_security_py]]"
  - "[[008_AuthN_Strategy]]"
---

# `app/interfaces/repositories/user_repository.py` — User Persistence Adapter

## Context & Purpose

Concrete adapter for the `IUserRepository` Port. Bridges the
[[file_domain_models_user_py]] entity (`User`) and the `UserORM` row.
Authentication flows in [[file_services_auth_service_py]] and the
`get_current_doctor` dependency in [[file_interfaces_api_dependencies_py]]
both fetch users through this repository.

## Logic Breakdown

Skeleton (planned):

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
    # columns elided — owned by [[DBA_Team]]


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

Key choices:

- **`get_by_email` lower-cases input** — matches the column constraint set
  in the migration and avoids case-sensitivity bugs at login.
- **`get_active_by_id`** — convenience for
  [[file_interfaces_api_dependencies_py]]'s `get_current_doctor`. Reduces
  the round-trip cost vs. fetch-then-check.
- **`password_hash` is opaque** — it travels through this repository
  unmodified; verification is done in
  [[file_services_auth_service_py]] using
  [[file_core_security_py]]'s `IPasswordHasher`.

## Dependencies
- **External:** `sqlalchemy[asyncio]`.
- **Internal:** [[file_db_base_py]], [[file_domain_models_user_py]],
  [[file_interfaces_repositories_base_py]], [[file_core_security_py]].

## Consumers
- [[file_services_auth_service_py]].
- [[file_use_cases_user_cases_py]].
- [[file_interfaces_api_dependencies_py]].

## Invariants / Pitfalls
- **Never expose `password_hash` upward** unless the caller is the auth
  service. Other use cases work with `User` and never read the hash.
- The `email` column has a unique partial index *only on active users*
  (defined in the corresponding migration). Re-registration after
  account deletion is allowed by design.
- LGPD `delete` semantics: pseudonymise email + name and flip
  `is_active=False`; do not `DELETE` the row, since audit logs reference
  it. See [[006_LGPD_PII_Strategy]].
- The session is request-scoped (see [[file_db_database_py]]); do not
  cache instances of this repository across requests.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]
- [[008_AuthN_Strategy]] *(planned)*
- [[009_Authorization_RBAC]] *(planned)*

#file #interfaces #repository #user #adapter
