---
title: base.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_db_base_py]]"
file_language: python
path: app/db/base.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_db]]"
tags:
  - file
  - db
  - sqlalchemy
  - declarative-base
  - infrastructure
  - pt-br
related:
  - "[[br_file_db_database_py]]"
  - "[[br_dir_app_db_migrations]]"
  - "[[br_file_root_alembic_ini]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_interfaces_repositories_user_repository_py]]"
---

# `app/db/base.py` — SQLAlchemy Declarative Base

## Context & Purpose

Define a única classe declarativa `Base` e o registro `metadata` que
modelos ORM e Alembic compartilham. Centralizar aqui:

- Dá ao [[br_file_root_alembic_ini]] um único `target_metadata` para
  fazer autogenerate de diffs.
- Evita imports circulares — todo arquivo de modelo ORM importa `Base`
  deste módulo, nunca o contrário.
- Permite anexar convenções de naming project-wide (nomes de
  constraint) uma única vez.

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

Por que uma naming convention:

- Autogenerate do Alembic produz nomes de constraint determinísticos;
  sem isso, scripts de upgrade/downgrade divergem entre dev e prod
  (causa top de falhas em migrações).
- Alinha com a [recomendação oficial do
  Alembic](https://alembic.sqlalchemy.org/en/latest/naming.html).

## Dependencies
- **Externo:** `sqlalchemy>=2.0` (usa estilo `DeclarativeBase` 2.x).

## Consumers
- Todo arquivo de modelo ORM (`UserORM`, `PatientORM`, `AnamnesisORM`,
  `AuditLogORM`).
- [[br_dir_app_db_migrations]]/`env.py` — importa este módulo para que
  `--autogenerate` veja todo o metadata.
- [[br_file_db_database_py]] (criação de engine; não consumidor estrito
  de `Base` mas vive no mesmo package).

## Invariants / Pitfalls
- **Nunca defina um segundo `Base`.** Dividir `metadata` é fonte top
  de fantasmas no autogenerate do Alembic (tabelas que ele tenta
  dropar porque vivem no metadata "outro").
- Classes de modelo ORM importadas em lugar nenhum não vão aparecer no
  autogenerate. Um `app/db/models.py` agregador fininho (ou imports
  em [[br_dir_app_db_migrations]]/`env.py`) garante que todo modelo é
  carregado antes do Alembic introspectar.
- Convenções de naming, uma vez escolhidas, NÃO PODEM mudar. Renomear
  uma constraint é migração destrutiva que o time de DBA precisa
  possuir explicitamente.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #db #sqlalchemy #base #pt-br
