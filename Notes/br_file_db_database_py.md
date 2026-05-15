---
title: database.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_db_database_py]]"
file_language: python
path: app/db/database.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_db]]"
tags:
  - file
  - db
  - sqlalchemy
  - async
  - session
  - dependency-injection
  - pgp
  - pt-br
related:
  - "[[br_file_db_base_py]]"
  - "[[br_file_core_config_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_file_root_main_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_ADR-001-active-database-pattern]]"
---

# `app/db/database.py` — Engine Async & Factory de Session

## Context & Purpose

Constrói o **engine SQLAlchemy async** e a **factory de `AsyncSession`**
exatamente uma vez por processo, e expõe um generator request-scoped
`get_db_session()` que a camada de presentation injeta via `Depends`.

Esta é a única ponte entre o runtime e o PostgreSQL. Tudo mais usa a
abstração de session; nada mais abre conexões diretamente.

A função `get_db_session()` também é responsável por **injetar a chave
PGP na sessão PostgreSQL** antes de qualquer lógica de repositório
rodar — conforme [[br_ADR-001-active-database-pattern]].

## Logic Breakdown

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

_settings = get_settings()

engine: AsyncEngine = create_async_engine(
    _settings.database_url.get_secret_value(),
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,                 # detecta conns stale pós-failover
    pool_recycle=1800,                  # 30 min, < idle-timeout típico
    echo=_settings.debug,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    """Session com escopo de request. Injeta chave PGP ANTES de ceder sessão."""
    async with SessionLocal() as session:
        try:
            # PRIMEIRO: injeta a chave PGP na sessão PostgreSQL para que
            # funções e views do banco possam encriptar/decriptar dados PII.
            await session.execute(
                text("SELECT set_config('app.pgp_key', :key, true)"),
                {"key": _settings.pgp_key.get_secret_value()},
            )
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

Por que essas escolhas:

- **Driver `asyncpg`** sob URL `postgresql+asyncpg://` — o driver async
  Postgres mais rápido do ecossistema Python.
- **`pool_size=10, max_overflow=20`** — permite até 30 conexões
  simultâneas; dimensionado para a carga esperada de produção.
- **`pool_pre_ping=True`** — sobrevive a failovers PgBouncer/RDS sem
  retries por request.
- **`expire_on_commit=False`** — evita reloads lazy acidentais após
  commit.
- **`autoflush=False`** — flush timing previsível dentro do código de
  repositório.
- **`SELECT set_config('app.pgp_key', :key, true)`** é executado como
  **primeira instrução** de cada session, antes do `yield`. O parâmetro
  `true` (transação-local) garante que a chave seja visível apenas
  dentro desta transação — não vaza para outras conexões do pool.
  Conforme [[br_ADR-001-active-database-pattern]].
- **commit em sucesso / rollback em exception** na fronteira da
  dependency aplica o **Unit of Work** automaticamente; repositórios
  individuais não dão commit.

## Dependencies
- **Externo:** `sqlalchemy[asyncio]>=2.0`, `asyncpg`.
- **Interno:** [[br_file_core_config_py]], [[br_file_db_base_py]] (para
  metadata em criação de tabela durante testes em dev).

## Consumers
- [[br_file_interfaces_api_dependencies_py]] — expõe `get_db_session`
  como dependency FastAPI.
- [[br_file_interfaces_repositories_base_py]] (concreto) — recebe
  `AsyncSession` via constructor injection.
- [[br_file_root_main_py]] — abre/fecha engine no `lifespan`.

## Invariants / Pitfalls
- **Um engine por processo.** Recriar por request vaza file
  descriptors.
- Nunca chame `session.commit()` dentro de um repositório — a
  dependency é dona do unit of work.
- **A função se chama `get_db_session()`**, não `get_session()`.
  Referências ao nome antigo indicam documentação desatualizada.
- `echo=True` em produção vaza SQL em logs — NÃO. A flag está gated em
  `debug` que precisa ser `False` em prod.
- A injeção `set_config` usa parâmetro nomeado `:key` — nunca
  interpolação de string — para evitar injeção de SQL.

## Related ADRs
- [[br_ADR-001-active-database-pattern]]
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #db #sqlalchemy #async #session #pgp #pt-br
