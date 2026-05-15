---
title: app/db/migrations
type: Directory
status: Planned
language: pt-BR
mirrors: "[[dir_app_db_migrations]]"
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_db]]"
ownership: dba-team
tags:
  - directory
  - db
  - migrations
  - alembic
  - dba-interface
  - pt-br
related:
  - "[[br_file_root_alembic_ini]]"
  - "[[br_file_db_base_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_001_Architecture_and_Context]]"
---

# `app/db/migrations/` — Histórico Versionado de Schema (Alembic)

## Context & Purpose

Mantém o `env.py` do Alembic, o `script.py.mako` e a pasta `versions/`
com os scripts de upgrade/downgrade. O **time de DBA é dono do
conteúdo** deste diretório; o time de backend possui sua localização e o
wiring com [[br_file_root_alembic_ini]] e [[br_file_db_base_py]].

Por que mantemos isto *dentro* do package da aplicação:

- Migrações vivem com o código que depende delas — versionadas juntas,
  shipadas juntas, revertidas juntas.
- A imagem Docker (de [[br_file_root_Dockerfile]]) shipa as migrações
  para o hook de deploy rodar `alembic upgrade head` antes de aceitar
  tráfego.
- O time de DBA pode submeter PRs a esta pasta sem precisar navegar
  pela base mais ampla.

## Children (layout canônico)

```
app/db/migrations/
├── env.py               # importa Base.metadata de app.db.base
├── script.py.mako
└── versions/
    ├── 20260601_0001_init_users_patients.py
    ├── 20260615_0002_add_anamnesis.py
    └── ...
```

## Allowed dependencies
- `alembic`, `sqlalchemy`.
- [[br_file_db_base_py]] (lê `Base.metadata`).
- Standard library.

## Forbidden imports
- **NÃO PODE** importar de [[br_dir_app_domain]],
  [[br_dir_app_services]] ou [[br_dir_app_use_cases]]. Migrações operam
  no nível de schema apenas; importar código de aplicação no momento de
  migrar bloqueia o bootstrap de bancos novos quando o próprio código
  importa de um DB ainda não migrado.

## Patterns
- **Histórico linear** — branching é proibido. Se dois PRs precisam de
  migração, o segundo rebaseia sua revisão sobre a primeira.
- **Migrações idempotentes** — todo `upgrade` e `downgrade` deve rodar
  limpo duas vezes; CI roda `alembic upgrade head && alembic downgrade -1
  && alembic upgrade head` em todo PR.
- **Migrações de dados são revisões separadas** das migrações de schema;
  misturar bloqueia rollouts paralelos.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_file_root_alembic_ini]]

#directory #db #migrations #alembic #pt-br
