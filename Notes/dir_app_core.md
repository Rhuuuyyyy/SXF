---
id: dir-core
title: "app/core — Cross-Cutting Concerns"
type: DirGuide
status: living
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_core_config_py]]"
  - "[[file_core_exceptions_py]]"
  - "[[file_core_security_py]]"
tags:
  - directory
  - core
  - cross-cutting
  - infrastructure-light
related:
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[ADR-002-jwt-stdlib-hs256]]"
  - "[[file_root_main_py]]"
---

# `app/core/` — Cross-Cutting Concerns

## Purpose

`app/core/` holds **process-wide, framework-light primitives** that every other
layer depends on, but which themselves depend on nothing application-specific.
These are the three files every other module imports without restriction:
settings for configuration, exceptions for error signalling, and security for
JWT operations.

In a strict [[Hexagonal_Architecture]] reading, these would split between
*configuration* (pure values) and *infrastructure adapters* (e.g. JWT). We
collapse them into a single `core/` package because:

- They are tiny, stable, and carry no business meaning.
- Splitting them across `domain/` and `infrastructure/` would create churn for
  trivial helpers.
- Keeping `core/` framework-agnostic means it can be imported by *any* layer
  without violating the dependency rule.

## Children

| File | Role |
|---|---|
| [[file_core_config_py]] | Typed `Settings` via `pydantic-settings`; `@lru_cache` singleton |
| [[file_core_exceptions_py]] | Domain-neutral exception hierarchy (`SXFpError` → HTTP codes) |
| [[file_core_security_py]] | JWT issue/verify via stdlib `hmac` + `hashlib` (HS256) |

## Allowed Dependencies

- Python standard library (`hmac`, `hashlib`, `base64`, `json`, `datetime`).
- `pydantic`, `pydantic-settings`.
- **No third-party cryptography library** — see [[ADR-002-jwt-stdlib-hs256]].

## Forbidden Imports

- **MUST NOT** import from [[dir_app_domain]], [[dir_app_use_cases]],
  [[dir_app_interfaces]], or [[dir_app_db]].
- **MUST NOT** import from `fastapi` — `core/` is framework-neutral. The
  presentation layer wires `Depends(get_settings)` externally.
- `passlib` and `python-jose` are **not used** — both failed at import due to
  a broken system `cryptography` Rust/C extension (see [[ADR-002-jwt-stdlib-hs256]]).

## Key Patterns

- **Singleton via `lru_cache`** — `get_settings()` in [[file_core_config_py]]
  returns the same `Settings` instance for the process lifetime.
- **Typed secrets** — `database_url` and `pgp_key` are `SecretStr`; `.get_secret_value()`
  must be called explicitly. `secret_key` is a plain `str` (HS256 key must be
  passed directly to `hmac`).
- **Exception hierarchy** — [[file_core_exceptions_py]] defines
  `SXFpError → DomainError | NotFoundError | ConflictError | AuthenticationError | AuthorizationError | LGPDComplianceError`.
  The global handler in [[file_root_main_py]] maps each to an HTTP status code.
- **Constant-time JWT verification** — [[file_core_security_py]] uses
  `hmac.compare_digest()` to prevent timing-based signature forgery.

## Invariants

- `core/` has zero runtime state beyond the `@lru_cache` settings instance.
- Adding a new exception class here requires a corresponding entry in the
  exception handler map in [[file_root_main_py]].
- `_ACCESS_TOKEN_TTL_SECONDS = 1800` in [[file_core_security_py]] is the
  single source of truth for token lifetime.

## Related ADRs

- [[ADR-002-jwt-stdlib-hs256]] — why stdlib HS256 instead of python-jose/PyJWT.
- [[003_Hexagonal_Architecture_Strategy]] — why core/ is its own layer.
- [[006_LGPD_PII_Strategy]] — `pgp_key` and `secret_key` as `SecretStr`.

#directory #core #cross-cutting
