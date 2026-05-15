---
id: file-core-config
title: "config.py (core)"
type: File
status: Active
language: python
path: app/core/config.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_core]]"
tags:
  - file
  - core
  - configuration
  - pydantic
  - singleton
  - secrets
related:
  - "[[file_root_env_example]]"
  - "[[file_root_main_py]]"
  - "[[file_core_security_py]]"
  - "[[file_db_database_py]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/core/config.py` — Typed Application Settings

## Context & Purpose

Centralises every environment-dependent value behind a single typed class,
`Settings`. Two design goals:

1. **No `os.environ` look-ups outside this file.** Consumers receive `Settings`
   via `get_settings()`; tests inject overrides via `app.dependency_overrides`.
2. **Type safety + secret protection.** `pydantic-settings` validates types on
   startup, failing fast if the environment is malformed. Sensitive values
   (`database_url`, `pgp_key`) are `SecretStr` — they cannot be accidentally
   logged or serialised.

## Public Surface

```python
class Settings(BaseSettings):
    database_url: SecretStr         # postgresql+asyncpg://...
    pgp_key: SecretStr              # PGP symmetric key for DB field encryption
    secret_key: str                 # HS256 HMAC key (min_length=8; plain str)
    cors_origins: list[str]         # Allowed CORS origins
    api_prefix: str = "/api/v1"
    environment: str = "development"
    debug: bool = False

@lru_cache
def get_settings() -> Settings: ...
```

## Logic Walkthrough

1. `Settings` inherits `BaseSettings` from `pydantic_settings`.
2. `SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")` —
   reads from `.env` file and process environment. `extra="ignore"` prevents
   unknown keys from crashing startup.
3. `database_url: SecretStr` — the connection URL is wrapped in `SecretStr`
   so it never appears in `repr(settings)` or `logging.info(settings)`.
   Callers must call `.get_secret_value()` explicitly.
4. `pgp_key: SecretStr` — the PGP symmetric key passed to PostgreSQL via
   `set_config()` before each session. Same `SecretStr` protection as the DB URL.
5. `secret_key: str` — the HMAC-SHA256 signing key for JWTs. Note: plain `str`,
   NOT `SecretStr`. This is intentional: the `hmac` stdlib call requires bytes
   directly; wrapping in `SecretStr` adds a mandatory `.get_secret_value()` call
   at every JWT operation. `min_length=8` is enforced by Pydantic's `Field`.
6. `get_settings()` is cached with `@lru_cache` — returns the same `Settings`
   instance for the process lifetime, compatible with FastAPI's DI graph.

## Dependencies

- **External:** `pydantic`, `pydantic-settings`.
- **Reads:** `.env` file (schema documented in [[file_root_env_example]]) or
  OS environment variables.

## Consumers

| Consumer | Fields used |
|---|---|
| [[file_root_main_py]] | `api_prefix`, `cors_origins`, `environment`, `debug` |
| [[file_core_security_py]] | `secret_key` |
| [[file_db_database_py]] | `database_url`, `pgp_key` |
| [[file_presentation_routers_patients_py]] | (via injected DB session) |

## Invariants / Pitfalls

- **Add a field here AND in [[file_root_env_example]] in the same commit.**
- `database_url` and `pgp_key` are `SecretStr` — call `.get_secret_value()`
  before passing to SQLAlchemy or `set_config()`.
- `secret_key` is plain `str` — do NOT log it; it is a bearer credential.
- The `@lru_cache` means a hot reload during development keeps stale settings;
  call `get_settings.cache_clear()` in tests that mutate environment variables.
- `echo=debug` in [[file_db_database_py]] — ensure `debug=False` in production
  to prevent SQL being written to application logs.

## Related ADRs

- [[ADR-002-jwt-stdlib-hs256]] — why `secret_key` is `str`, not `SecretStr`.
- [[006_LGPD_PII_Strategy]] — why `database_url` and `pgp_key` are `SecretStr`.
- [[001_Architecture_and_Context]]

#file #core #configuration #pydantic #secrets
