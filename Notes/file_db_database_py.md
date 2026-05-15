---
id: file-db-database
title: "database.py (db)"
type: File
status: Active
language: python
path: app/db/database.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_db]]"
tags:
  - file
  - db
  - sqlalchemy
  - async
  - session
  - pgp
  - active-database
related:
  - "[[file_core_config_py]]"
  - "[[file_root_main_py]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/db/database.py` — Async Engine, Session Factory & PGP Key Injection

## Context & Purpose

Constructs the **async SQLAlchemy engine** and **`AsyncSession` factory**
exactly once per process. Exposes `get_db_session()`, a request-scoped
async generator that:

1. Injects the PGP encryption key into the PostgreSQL session via
   `SET LOCAL` before yielding — enabling DB-side field encryption.
2. Commits on success; rolls back on any exception.

This is the **single bridge** between the Python runtime and PostgreSQL.
Everything else uses the session abstraction; nothing else opens connections.

## Public Surface

```python
engine: AsyncEngine                             # module-level singleton
async_session_maker: async_sessionmaker         # factory (not a session)

async def get_db_session() -> AsyncIterator[AsyncSession]: ...
```

## Logic Walkthrough

### Engine creation

```python
engine = create_async_engine(
    settings.database_url.get_secret_value(),
    pool_pre_ping=True,    # detects stale connections after failover
    pool_size=10,
    max_overflow=20,
    echo=settings.debug,   # logs SQL — MUST be False in production
)
```

### Session factory

```python
async_session_maker = async_sessionmaker(
    engine,
    expire_on_commit=False,  # objects remain accessible after commit
    class_=AsyncSession,
)
```

`expire_on_commit=False` prevents `DetachedInstanceError` when router code
accesses attributes on returned domain objects after the session commit.

### `get_db_session()` — PGP key injection

```python
async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with async_session_maker() as session:
        # Inject PGP key BEFORE any user query — required by DB trigger
        await session.execute(
            text("SELECT set_config('app.pgp_key', :key, true)"),
            {"key": settings.pgp_key.get_secret_value()},
        )
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

The third argument `true` to `set_config()` scopes the setting to the current
transaction only. The PostgreSQL `INSTEAD OF INSERT` trigger on the `pacientes`
view reads `current_setting('app.pgp_key')` to encrypt PII fields. The key
never appears in a column value or query log.

## Dependencies

- **External:** `sqlalchemy[asyncio]>=2.0`, `asyncpg` (driver).
- **Internal:** [[file_core_config_py]] — `database_url` and `pgp_key` as `SecretStr`.

## Consumers

| Consumer | Usage |
|---|---|
| [[file_root_main_py]] | `engine.dispose()` in lifespan shutdown |
| All `interfaces/repositories/` | Receive `AsyncSession` via `Depends(get_db_session)` |
| [[file_domain_services_symptom_scoring_orchestrator_py]] | Receives session via `SubmitAnamnesisUseCase.execute()` parameter |

## Invariants / Pitfalls

- **One engine per process.** Re-creating per request leaks file descriptors
  and exhausts the connection pool.
- **Never commit inside a repository.** The `get_db_session()` generator owns
  the unit of work. A repository that commits breaks transaction atomicity.
- `echo=True` in production writes SQL (including PGP key injection calls)
  to logs — forbidden. `settings.debug` must be `False` in production.
- The `SELECT set_config(...)` runs on every request — it is fast (no disk IO)
  but must remain the first statement. Any query before it would operate without
  the PGP key, causing the DB trigger to fail with `current_setting not found`.
- `pool_size=10 + max_overflow=20` means up to 30 concurrent connections per
  worker process. Scale accordingly.

## Related ADRs

- [[ADR-001-active-database-pattern]] — why the PGP key is injected here.
- [[006_LGPD_PII_Strategy]] — PGP encryption requirement.
- [[003_Hexagonal_Architecture_Strategy]] — why only this file opens connections.

#file #db #sqlalchemy #async #session #pgp
