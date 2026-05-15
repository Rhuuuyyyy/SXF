---
title: app/db/migrations
type: Directory
status: Planned
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_db]]"
ownership: dba-team
tags:
  - directory
  - db
  - migrations
  - alembic
  - dba-interface
related:
  - "[[file_root_alembic_ini]]"
  - "[[file_db_base_py]]"
  - "[[file_db_database_py]]"
  - "[[001_Architecture_and_Context]]"
---

# `app/db/migrations/` — Alembic Versioned Schema History

## Context & Purpose

Holds Alembic's `env.py`, `script.py.mako`, and the `versions/` folder of
forward/backward migration scripts. The **DBA team owns the contents** of
this directory; the backend team owns its location and the framework wiring
it to [[file_root_alembic_ini]] and [[file_db_base_py]].

Why we keep this *inside* the application package:

- Migrations live with the code that depends on them — versioned together,
  shipped together, rolled back together.
- The Docker image (built by [[file_root_Dockerfile]]) ships the migrations
  so the deploy hook can run `alembic upgrade head` before traffic is
  admitted.
- The DBA team can submit PRs to this single folder without needing to
  navigate the broader codebase.

## Children (canonical layout)

```
app/db/migrations/
├── env.py               # imports Base.metadata from app.db.base
├── script.py.mako
└── versions/
    ├── 20260601_0001_init_users_patients.py
    ├── 20260615_0002_add_anamnesis.py
    └── ...
```

## Allowed dependencies
- `alembic`, `sqlalchemy`.
- [[file_db_base_py]] (read `Base.metadata`).
- Standard library.

## Forbidden imports
- **MUST NOT** import from [[dir_app_domain]], [[dir_app_services]] or
  [[dir_app_use_cases]]. Migrations operate at the schema level only;
  importing application code at migration time blocks fresh-database
  bootstrapping when business code itself imports from a not-yet-migrated DB.

## Patterns
- **Linear history** — branching is forbidden. If two PRs need a migration,
  the second one rebases its revision onto the first.
- **Idempotent migrations** — every `upgrade` and `downgrade` step must run
  cleanly twice; CI runs `alembic upgrade head && alembic downgrade -1
  && alembic upgrade head` on every PR.
- **Data migrations are separate revisions** from schema migrations; mixing
  blocks parallel rollouts.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[file_root_alembic_ini]]

#directory #db #migrations #alembic
