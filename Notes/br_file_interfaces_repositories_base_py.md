---
title: base.py (repository)
type: File
status: Planned
language: pt-BR
mirrors: "[[file_interfaces_repositories_base_py]]"
file_language: python
path: app/interfaces/repositories/base.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - protocol
  - generics
  - port
  - pt-br
related:
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_interfaces_repositories_user_repository_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
---

# `app/interfaces/repositories/base.py` — Port Repositório Genérico

## Context & Purpose

Define o **Port abstrato** que todo repositório aggregate-específico
especializa. Dois artefatos:

1. `IRepository[T]` — um `typing.Protocol[T]` que declara o contrato
   que o [[br_DBA_Team]] precisa satisfazer.
2. `SqlAlchemyRepository[T]` — uma base genérica thin de adapter que
   classes concretas (ex.:
   [[br_file_interfaces_repositories_patient_repository_py]]) estendem.

Centralizar a abstração:

- Força uma superfície de repositório uniforme entre aggregates
  (previsível para o time de DBA).
- Torna fakes de teste triviais — um único `InMemoryRepository[T]`
  cobre todos aggregates.
- Mantém a [[br_Hexagonal_Architecture]] honesta: código de domínio
  depende do Protocol, não do SQLAlchemy.

## Logic Breakdown

Skeleton (planejado):

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

Por que `Protocol`, não `ABC`:

- **Tipagem estrutural** — implementações não precisam herdar de
  `IRepository`. Test fakes podem ser classes simples; mypy ainda
  verifica a forma. Esta é a renderização canônica Python de "ports".
- Protocols dão liga com `Depends` do FastAPI — adapters podem ser
  trocados no composition root sem tocar call sites.
- ABCs forçariam herança, o que acopla consumers de domínio ao import
  path da abstração; Protocols não.

## Dependencies
- **Externo:** `typing` (stdlib), `sqlalchemy[asyncio]`.

## Consumers
- [[br_file_interfaces_repositories_patient_repository_py]].
- [[br_file_interfaces_repositories_user_repository_py]].
- [[br_dir_app_services]] / [[br_dir_app_use_cases]] (dependem do
  *Protocol*, não do adapter).

## Invariants / Pitfalls
- **Camada de domínio nunca importa `SqlAlchemyRepository`.** Apenas o
  `Protocol`. Aplicado por regras `import-linter` em
  [[br_004_Directory_Structure]] *(planejado)*.
- Mantenha métodos CRUD mínimos aqui — queries domain-specific
  (`find_by_cpf`) pertencem ao repositório *concreto* no arquivo
  per-aggregate.
- `delete` performa **delete físico** por default; aggregates com
  regras de retenção LGPD (ver [[br_006_LGPD_PII_Strategy]])
  overridam com pseudonimização/soft-delete.
- A session é injetada, **não** criada aqui. Boundaries de
  unit-of-work vivem no `get_session()` de
  [[br_file_db_database_py]].

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_001_Architecture_and_Context]]

#file #interfaces #repository #protocol #port #pt-br
