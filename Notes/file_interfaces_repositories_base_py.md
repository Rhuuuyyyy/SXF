---
title: base.py (repository)
type: File
status: Planned
language: python
path: app/interfaces/repositories/base.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - protocol
  - generics
  - port
related:
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_interfaces_repositories_user_repository_py]]"
  - "[[file_db_database_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
---

# `app/interfaces/repositories/base.py` — Generic Repository Port

## Context & Purpose

Defines the **abstract Port** every aggregate-specific repository
specialises. Two artefacts:

1. `IRepository[T]` — a `typing.Protocol[T]` that declares the contract the
   [[DBA_Team]] must satisfy.
2. `SqlAlchemyRepository[T]` — a thin generic adapter base that concrete
   classes (e.g.
   [[file_interfaces_repositories_patient_repository_py]]) extend.

Centralising the abstraction:

- Forces a uniform repository surface across aggregates (predictable for
  the DBA team).
- Makes test fakes trivial — a single `InMemoryRepository[T]` covers all
  aggregates.
- Keeps the [[Hexagonal_Architecture]] honest: domain code depends on the
  Protocol, not on SQLAlchemy.

## Logic Breakdown

Skeleton (planned):

```python
from typing import Generic, Protocol, TypeVar
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class IRepository(Protocol[T]):
    async def get(self, id: UUID) -> T | None: ...
    async def list(self, *, limit: int = 50, offset: int = 0) -> list[T]: ...
    async def add(self, entity: T) -> T: ...
    async def update(self, entity: T) -> T: ...
    async def delete(self, id: UUID) -> None: ...


class SqlAlchemyRepository(Generic[T]):
    """Common scaffold for SQLAlchemy adapters.
    Subclasses bind ``model`` and override mapping methods.
    """

    model: type  # ORM class

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
```

Why a `Protocol`, not an `ABC`:

- **Structural typing** — implementations don't need to inherit from
  `IRepository`. Test fakes can be plain classes; mypy still verifies the
  shape. This is the canonical Python rendering of "ports".
- Protocols play nicely with FastAPI `Depends` — adapters can be swapped
  at the composition root without touching call sites.
- ABCs would force inheritance, which couples domain consumers to the
  abstraction's import path; Protocols don't.

## Dependencies
- **External:** `typing` (stdlib), `sqlalchemy[asyncio]`.

## Consumers
- [[file_interfaces_repositories_patient_repository_py]].
- [[file_interfaces_repositories_user_repository_py]].
- [[dir_app_services]] / [[dir_app_use_cases]] (depend on the *Protocol*,
  not the adapter).

## Invariants / Pitfalls
- **Domain layer never imports `SqlAlchemyRepository`.** Only the
  `Protocol`. This is enforced by `import-linter` rules in
  [[004_Directory_Structure]] *(planned)*.
- Keep CRUD methods minimal here — domain-specific queries (`find_by_cpf`)
  belong on the *concrete* repository in the per-aggregate file.
- `delete` performs a **physical** delete by default; aggregates with LGPD
  retention rules (see [[006_LGPD_PII_Strategy]]) override it with
  pseudonymisation/soft-delete.
- The session is injected, **not** created here. Unit-of-work boundaries
  live in [[file_db_database_py]]'s `get_session()`.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[001_Architecture_and_Context]]

#file #interfaces #repository #protocol #port
