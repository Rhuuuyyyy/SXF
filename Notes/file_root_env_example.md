---
title: .env.example
type: File
status: Active
language: dotenv
path: .env.example
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - configuration
  - secrets-template
related:
  - "[[file_core_config_py]]"
  - "[[file_root_gitignore]]"
  - "[[001_Architecture_and_Context]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[000_AI_OBSIDIAN_PROTOCOL]]"
---

# `.env.example` — Environment-Variable Template

## Context & Purpose

Public, version-controlled template enumerating every environment variable
that [[file_core_config_py]] (the typed `Settings` class) expects to find at
process start. Developers copy this file to `.env` and fill in real values
locally. The actual `.env` is git-ignored (see [[file_root_gitignore]]) so
secrets never reach the remote.

## Logic Breakdown

Plain `KEY=VALUE` lines, no shell interpolation, no quoting required. Parsed
by `pydantic-settings` via `SettingsConfigDict(env_file=".env")`.

| Key | Type | Purpose |
|---|---|---|
| `APP_NAME` | str | Branding & OpenAPI title |
| `APP_VERSION` | str | OpenAPI `info.version` |
| `ENVIRONMENT` | enum | `development` / `staging` / `production` |
| `DEBUG` | bool | Verbose tracebacks; FORBIDDEN in production |
| `API_PREFIX` | str | Mounting path; default `/api/v1` |
| `SECRET_KEY` | str | JWT/cookie signing — see [[file_core_security_py]] |
| `CORS_ORIGINS` | csv | Allowlist provided by the [[Frontend_Team]] |

Future keys (planned): `DATABASE_URL`, `AUDIT_SINK_DSN`, `SENTRY_DSN`,
`OAUTH_PUBLIC_KEY_PATH`, `OAUTH_PRIVATE_KEY_PATH`.

## Dependencies
- **Consumed by:** [[file_core_config_py]].
- **External tooling:** `python-dotenv` (transitive via `pydantic-settings`).

## Consumers
- [[file_root_main_py]] (indirectly, through `Settings`).
- [[file_core_security_py]] (reads `SECRET_KEY`).
- [[file_db_database_py]] (reads `DATABASE_URL`, future).

## Invariants / Pitfalls
- **Never commit a populated `.env`** — see Rule 2 of
  [[000_AI_OBSIDIAN_PROTOCOL]] and the `.gitignore` policy in
  [[file_root_gitignore]].
- Every new variable here MUST appear in [[file_core_config_py]] and the
  reverse must hold — drift is a protocol violation.
- Production secrets live in the deployment vault (Kubernetes Secret / AWS
  SSM Parameter Store), not in any `.env`. This file is dev-only.
- The literal `change-me-in-environment` placeholder for `SECRET_KEY` is
  rejected by CI in non-`development` environments.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[006_LGPD_PII_Strategy]] (secret-handling LGPD obligations)

#file #root #configuration #secrets-template
