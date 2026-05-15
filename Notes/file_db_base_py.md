---
title: base.py
type: File
status: Planned
language: python
path: app/db/base.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_db]]"
tags:
  - file
  - db
  - sqlalchemy
  - declarative-base
  - infrastructure
related:
  - "[[file_db_database_py]]"
  - "[[dir_app_db_migrations]]"
  - "[[file_root_alembic_ini]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_interfaces_repositories_user_repository_py]]"
---

# `app/db/base.py` — SQLAlchemy Declarative Base

## Context & Purpose

Defines the single `Base` declarative class and the `metadata` registry that
both ORM models and Alembic share. Centralising it here:

- Gives [[file_root_alembic_ini]] one `target_metadata` to autogenerate
  diffs against.
- Avoids circular imports — every ORM model file imports `Base` from this
  module, never the reverse.
- Lets us attach project-wide naming conventions (constraint names) once.

## Logic Breakdown

```python
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


class Base(DeclarativeBase):
    metadata = metadata
```

Why a naming convention:

- Alembic autogenerate produces deterministic constraint names; without it,
  upgrade/downgrade scripts diverge between dev and prod (a top cause of
  failed migrations).
- Aligns with [Alembic's official recommendation](https://alembic.sqlalchemy.org/en/latest/naming.html).

## Dependencies
- **External:** `sqlalchemy>=2.0` (uses `DeclarativeBase` 2.x style).

## Consumers
- Every ORM model file (`UserORM`, `PatientORM`, `AnamnesisORM`, `AuditLogORM`).
- [[dir_app_db_migrations]]/`env.py` — imports this module so
  `--autogenerate` sees all metadata.
- [[file_db_database_py]] (engine creation; not a strict consumer of `Base`
  but lives in the same package).

## Invariants / Pitfalls
- **Never define a second `Base`.** Splitting `metadata` is a top source of
  alembic autogenerate ghosts (tables it tries to drop because they live
  in the "other" metadata).
- ORM model classes imported nowhere will not appear in autogenerate. A
  thin `app/db/models.py` aggregator (or [[dir_app_db_migrations]]/`env.py`
  imports) ensures every model is loaded before Alembic introspects.
- Naming conventions, once chosen, MUST NOT change. Renaming a constraint
  is a destructive migration the DBA team must own explicitly.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]

#file #db #sqlalchemy #base
