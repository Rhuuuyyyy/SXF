---
title: alembic.ini
type: File
status: Planned
language: pt-BR
mirrors: "[[file_root_alembic_ini]]"
file_language: ini
path: alembic.ini
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - migrations
  - database
  - dba-interface
  - pt-br
related:
  - "[[br_dir_app_db_migrations]]"
  - "[[br_file_db_base_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_001_Architecture_and_Context]]"
---

# `alembic.ini` — Configuração de Migração de Schema

## Context & Purpose

`alembic.ini` configura o **Alembic**, a ferramenta de migração que
trabalha junto com [[br_SQLAlchemy]]. O arquivo é o ponto de entrada
que a CLI `alembic` lê para descobrir o diretório de scripts de
migração, o metadata target e a URL do banco.

> O design de schema e a autoria de migrações são propriedade do
> [[br_DBA_Team]]. O repo do backend só fornece o *framework* (este
> `.ini` + [[br_dir_app_db_migrations]]) para que o time de DBA
> adicione novas revisões neste repo sem reconfigurar tooling.

## Logic Breakdown

Seções principais do arquivo:

```ini
[alembic]
script_location = app/db/migrations
sqlalchemy.url = ${DATABASE_URL}
file_template = %%(year)d%%(month).2d%%(day).2d_%%(rev)s_%%(slug)s
timezone = UTC
prepend_sys_path = .
```

- `script_location` — aponta para [[br_dir_app_db_migrations]].
- `sqlalchemy.url` — interpolada de `DATABASE_URL` (carregada por
  [[br_file_db_database_py]] a partir de [[br_file_root_env_example]]).
  Nunca hardcodamos a URL.
- `file_template` — slug com prefixo de data melhora a legibilidade do
  histórico.
- `timezone = UTC` — toda revisão tem timestamp em UTC; sem surpresas
  de DST.
- `prepend_sys_path = .` permite que o Alembic importe `app.*` da raiz
  do repo.

O `env.py` companheiro dentro de [[br_dir_app_db_migrations]] importa
`Base.metadata` de [[br_file_db_base_py]] para que `--autogenerate`
faça diff dos modelos declarativos contra o schema vivo.

## Dependencies
- **Externo:** `alembic`, `sqlalchemy`, `psycopg[binary]`.
- **Consome:** env var `DATABASE_URL` (via [[br_file_db_database_py]] /
  [[br_file_core_config_py]]).
- **Lê metadata de:** [[br_file_db_base_py]].

## Consumers
- Devs rodando `alembic upgrade head` localmente.
- Job de smoke-test de migração em CI.
- Hook de deploy de produção (roda `alembic upgrade head` antes do pod
  ficar ready).

## Invariants / Pitfalls
- **Nunca edite uma migração já commitada.** Anexe uma nova. O time de
  DBA reforça isso; downgrades acontecem via *nova revisão*, não edits
  in-place.
- O `sqlalchemy.url` DEVE vir de env — commitar uma URL real expõe
  topologia de infra e viola [[br_006_LGPD_PII_Strategy]].
- Autogenerate é uma *sugestão*, não evangelho — revise toda revisão
  gerada antes de commitar.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]] (o DB é um adapter
  outbound)
- [[br_001_Architecture_and_Context]]

#file #root #migrations #alembic #database #pt-br
