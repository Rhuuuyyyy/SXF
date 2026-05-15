---
title: app/db
type: Directory
status: Planned
language: pt-BR
mirrors: "[[dir_app_db]]"
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_db_base_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_dir_app_db_migrations]]"
tags:
  - directory
  - infrastructure
  - persistence
  - sqlalchemy
  - dba-interface
  - pt-br
related:
  - "[[br_file_root_alembic_ini]]"
  - "[[br_file_interfaces_repositories_base_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_001_Architecture_and_Context]]"
---

# `app/db/` — Adapter de Persistência (Outbound)

## Context & Purpose

`app/db/` é o **adapter outbound** que satisfaz os Ports de persistência
declarados em [[br_dir_app_interfaces]] / [[br_dir_app_domain]]. Em
termos hexagonais, isto é *infrastructure*: é o **único** lugar que
importa SQLAlchemy e Alembic, e o **único** onde SQL aparece.

Dois leitores se importam com este diretório:

1. **Time de DBA** — possui o schema, as migrações sob
   [[br_dir_app_db_migrations]] e o tuning. Eles abrem PRs que tocam
   `app/db/` e as revisões alembic.
2. **Time de Backend** — possui os adapters do [[br_Repository_Pattern]]
   (classes concretas que satisfazem os Ports). Os adapters vivem em
   [[br_dir_app_interfaces]] (no layout escolhido) mas *usam* as
   primitivas daqui.

## Children

- [[br_file_db_base_py]] — declarative base + `metadata` para autogen
  do Alembic.
- [[br_file_db_database_py]] — engine async, factory de session e a
  dependency request-scoped.
- [[br_dir_app_db_migrations]] — scripts versionados do Alembic
  (DBA-owned).

## Allowed dependencies
- `sqlalchemy[asyncio]`, `alembic`, `asyncpg` / `psycopg[binary]`.
- [[br_file_core_config_py]] (para `DATABASE_URL`).

## Forbidden imports
- **NÃO PODE** importar entities de [[br_dir_app_domain]] nem de
  [[br_dir_app_services]]. Tipos do domínio são traduzidos para linhas
  ORM pelos repository adapters em [[br_dir_app_interfaces]] — nunca
  aqui.
- **NÃO PODE** importar de [[br_dir_app_interfaces]] tampouco; essa
  direção criaria ciclo. A session é *injetada* no composition root
  ([[br_file_root_main_py]]).

## Patterns
- **Unit of Work** — uma session async por requisição HTTP, aberta em
  middleware/dependency e commitada/rollback na fronteira.
- **Declarative Base** — um único `Base` para o autogenerate ter um
  metadata para diff.
- **Tuning de connection pool** vive em [[br_file_db_database_py]]
  (`pool_size`, `max_overflow`, `pool_pre_ping`).

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#directory #db #persistence #infrastructure #pt-br
