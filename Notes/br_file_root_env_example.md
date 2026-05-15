---
title: .env.example
type: File
status: Active
language: pt-BR
mirrors: "[[file_root_env_example]]"
file_language: dotenv
path: .env.example
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - configuration
  - secrets-template
  - pt-br
related:
  - "[[br_file_core_config_py]]"
  - "[[br_file_root_gitignore]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_000_AI_OBSIDIAN_PROTOCOL]]"
---

# `.env.example` — Template de Variáveis de Ambiente

## Context & Purpose

Template público, versionado, enumerando toda variável de ambiente que
[[br_file_core_config_py]] (a classe `Settings` tipada) espera encontrar
no start do processo. Devs copiam este arquivo para `.env` e preenchem
valores reais localmente. O `.env` real fica git-ignored (ver
[[br_file_root_gitignore]]) para que secrets nunca cheguem ao remote.

## Logic Breakdown

Linhas `KEY=VALUE` em texto puro, sem interpolação de shell, sem aspas
necessárias. Parseado por `pydantic-settings` via
`SettingsConfigDict(env_file=".env")`.

| Chave | Tipo | Propósito |
|---|---|---|
| `APP_NAME` | str | Branding & título OpenAPI |
| `APP_VERSION` | str | `info.version` do OpenAPI |
| `ENVIRONMENT` | enum | `development` / `staging` / `production` |
| `DEBUG` | bool | Tracebacks verbosos; PROIBIDO em produção |
| `API_PREFIX` | str | Caminho de mount; default `/api/v1` |
| `SECRET_KEY` | str | Assinatura JWT/cookie — ver [[br_file_core_security_py]] |
| `CORS_ORIGINS` | csv | Allowlist fornecida pelo [[br_Frontend_Team]] |

Chaves futuras (planejadas): `DATABASE_URL`, `AUDIT_SINK_DSN`,
`SENTRY_DSN`, `OAUTH_PUBLIC_KEY_PATH`, `OAUTH_PRIVATE_KEY_PATH`.

## Dependencies
- **Consumido por:** [[br_file_core_config_py]].
- **Tooling externo:** `python-dotenv` (transitivo via
  `pydantic-settings`).

## Consumers
- [[br_file_root_main_py]] (indiretamente, via `Settings`).
- [[br_file_core_security_py]] (lê `SECRET_KEY`).
- [[br_file_db_database_py]] (lê `DATABASE_URL`, futuro).

## Invariants / Pitfalls
- **Nunca commite um `.env` populado** — ver Regra 2 de
  [[br_000_AI_OBSIDIAN_PROTOCOL]] e a política em
  [[br_file_root_gitignore]].
- Toda variável nova aqui DEVE aparecer em [[br_file_core_config_py]] e
  o inverso também — drift é violação do protocolo.
- Secrets de produção vivem no vault de deploy (Kubernetes Secret / AWS
  SSM Parameter Store), não em nenhum `.env`. Este arquivo é dev-only.
- O placeholder literal `change-me-in-environment` para `SECRET_KEY` é
  rejeitado pelo CI em ambientes não-`development`.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_006_LGPD_PII_Strategy]] (obrigações LGPD para secrets)

#file #root #configuration #secrets-template #pt-br
