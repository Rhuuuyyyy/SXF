---
title: alembic.ini
type: File
status: Planned
language: ini
path: alembic.ini
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - migrations
  - database
  - dba-interface
related:
  - "[[dir_app_db_migrations]]"
  - "[[file_db_base_py]]"
  - "[[file_db_database_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[001_Architecture_and_Context]]"
---

# `alembic.ini` — Schema Migration Configuration

## Context & Purpose

`alembic.ini` configures **Alembic**, the migration tool that pairs with
[[SQLAlchemy]]. The file is the entry point the `alembic` CLI reads to
discover the migration script directory, the metadata target, and the
database URL.

> Schema design and authorship of migrations is owned by the
> [[DBA_Team]]. The backend repo only provides the *framework* (this `.ini`
> + [[dir_app_db_migrations]]) so the DBA team can add new revisions in this
> repo without rewiring tooling.

## Logic Breakdown

Key sections of the file:

```ini
[alembic]
script_location = app/db/migrations
sqlalchemy.url = ${DATABASE_URL}
file_template = %%(year)d%%(month).2d%%(day).2d_%%(rev)s_%%(slug)s
timezone = UTC
prepend_sys_path = .
```

- `script_location` — points at [[dir_app_db_migrations]].
- `sqlalchemy.url` — interpolated from `DATABASE_URL` (loaded by
  [[file_db_database_py]] from [[file_root_env_example]]). We never hardcode
  the URL.
- `file_template` — date-prefixed slug improves readability of migration
  history.
- `timezone = UTC` — every revision timestamp is UTC; no DST surprises.

The companion `env.py` inside [[dir_app_db_migrations]] imports
[[file_db_base_py]]'s `Base.metadata` so `--autogenerate` can diff the
declarative models against the live schema.

## Dependencies
- **External:** `alembic`, `sqlalchemy`, `psycopg[binary]`.
- **Consumes:** `DATABASE_URL` env var (via [[file_db_database_py]] /
  [[file_core_config_py]]).
- **Reads metadata from:** [[file_db_base_py]].

## Consumers
- Developers running `alembic upgrade head` locally.
- CI's migration smoke-test job.
- Production deploy hook (runs `alembic upgrade head` before pod becomes
  ready).

## Invariants / Pitfalls
- **Never edit a committed migration.** Append a new one. The DBA team
  enforces this; downgrades are by *new revision*, not in-place edits.
- The `sqlalchemy.url` MUST come from env — committing a real URL leaks
  infra topology and violates [[006_LGPD_PII_Strategy]].
- `prepend_sys_path = .` lets Alembic import `app.*` from the repo root.
- Autogenerate is a *suggestion*, not gospel — review every generated
  revision before committing.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]] (the DB is an outbound adapter)
- [[001_Architecture_and_Context]]

#file #root #migrations #alembic #database
