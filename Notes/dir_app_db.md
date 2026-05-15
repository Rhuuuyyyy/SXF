---
title: app/db
type: Directory
status: Planned
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_db_base_py]]"
  - "[[file_db_database_py]]"
  - "[[dir_app_db_migrations]]"
tags:
  - directory
  - infrastructure
  - persistence
  - sqlalchemy
  - dba-interface
related:
  - "[[file_root_alembic_ini]]"
  - "[[file_interfaces_repositories_base_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[001_Architecture_and_Context]]"
---

# `app/db/` — Persistence Adapter (Outbound)

## Context & Purpose

`app/db/` is the **outbound adapter** that satisfies the persistence Ports
declared in [[dir_app_interfaces]] / [[dir_app_domain]]. In hexagonal terms
this is *infrastructure*: it is the **only** place that imports SQLAlchemy
and Alembic, and the **only** place where SQL leaks out.

Two readers care about this directory:

1. **DBA team** — owns the schema, the migrations under
   [[dir_app_db_migrations]], and tuning. They submit PRs that touch
   `app/db/` and the alembic revisions.
2. **Backend team** — owns the [[Repository_Pattern]] adapters (concrete
   classes that satisfy the Ports). The adapters live in
   [[dir_app_interfaces]] (per the user's chosen layout) but *use* the
   primitives here.

## Children

- [[file_db_base_py]] — declarative base + `metadata` for Alembic autogen.
- [[file_db_database_py]] — async engine/session factory and the request-
  scoped session dependency.
- [[dir_app_db_migrations]] — Alembic versioned scripts (DBA-owned).

## Allowed dependencies
- `sqlalchemy[asyncio]`, `alembic`, `asyncpg` / `psycopg[binary]`.
- [[file_core_config_py]] (for `DATABASE_URL`).

## Forbidden imports
- **MUST NOT** import from [[dir_app_domain]] entities or
  [[dir_app_services]]. Domain types are translated into ORM rows by the
  repository adapters in [[dir_app_interfaces]] — never here.
- **MUST NOT** import from [[dir_app_interfaces]] either; that direction
  would create a cycle. The session is *injected* at composition-root
  ([[file_root_main_py]]).

## Patterns
- **Unit of Work** — one async session per HTTP request, opened in
  middleware/dependency and committed/rolled back at the boundary.
- **Declarative Base** — single `Base` so Alembic autogenerate has one
  metadata to diff.
- **Connection-pool tuning** lives in [[file_db_database_py]] (`pool_size`,
  `max_overflow`, `pool_pre_ping`).

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]

#directory #db #persistence #infrastructure
