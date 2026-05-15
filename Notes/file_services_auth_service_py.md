---
title: auth_service.py
type: File
status: Active
language: python
path: app/services/auth_service.py
created_date: 2026-05-03
updated_date: 2026-05-08
sprint: 3
author: backend-team
project: SXFp
parent: "[[dir_app_services]]"
tags:
  - file
  - services
  - auth
  - session
  - brute-force
  - audit
related:
  - "[[file_core_exceptions_py]]"
  - "[[file_db_database_py]]"
  - "[[file_presentation_routers_auth_py]]"
  - "[[008_AuthN_Strategy]]"
  - "[[007_Audit_Logging_Middleware]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/services/auth_service.py` — Authentication & Session Lifecycle Service

## Context & Purpose

Sprint 2 scope: manages **session lifecycle** and **login audit trail**
against `tb_log_sessoes` and `tb_log_tentativas_login`. The complete JWT
issuance flow is Sprint 3 (ADR-008).

The `usuarios` table uses bcrypt via the DB trigger `trg_hash_senha_usuario`.
Password verification uses PostgreSQL's native `crypt()` — the Python layer
never handles bcrypt directly.

## Logic Breakdown

**`open_session(usuario_id, ip_origem, user_agent) -> int`**
- INSERTs into `tb_log_sessoes`, returns `sessao_id` (BIGSERIAL).
- The returned `sessao_id` MUST be embedded in the JWT as claim `sid`.

**`close_session(sessao_id, tipo_encerramento) -> None`**
- UPDATEs `tb_log_sessoes` setting `encerrada_em = NOW()`.
- `tipo_encerramento`: `'logout' | 'timeout' | 'forcado' | 'expirado'`.

**`log_tentativa_login(email_tentado, ip_origem, user_agent, sucesso, ...) -> None`**
- Append-only INSERT into `tb_log_tentativas_login`.
- `UPDATE`/`DELETE` are revoked for all roles — immutable by DB policy.
- Call on every login attempt (success and failure).

**`check_brute_force(ip_origem, janela_minutos=10, max_falhas=5) -> bool`**
- Counts failures from `ip_origem` in the sliding window.
- Returns `True` if threshold exceeded — caller must abort login.
- Uses `CAST(:ip AS INET)` (PostgreSQL-specific type).
- Must be called BEFORE credential verification.

**`authenticate_doctor(email, senha_plain) -> int | None`** *(Sprint 3)*
- Verifies credentials using PostgreSQL native `crypt()` — Python never
  touches bcrypt.
- Returns integer PK (`id`) if valid and `ativo = TRUE`, else `None`.
- `email` is lowercased in the query.
- `senha_plain` MUST NEVER be logged — LGPD constraint.

## Dependencies
- **Internal:** [[file_db_database_py]] (`AsyncSession` injected).
- **External:** `sqlalchemy`.

## Consumers
- [[file_presentation_routers_auth_py]] (login + logout endpoints).
- Future `RefreshTokenUseCase`, `ChangePasswordUseCase`.

## Invariants / Pitfalls
- **Log neither password nor email** in plaintext. Token strings are
  credentials — never log them.
- `check_brute_force` must run before credential verification to prevent
  timing-based enumeration.
- Sprint 3 will add `authenticate_doctor()` using `SELECT crypt(:pwd,
  senha_hash) = senha_hash FROM usuarios WHERE email = :email`.

## Related ADRs
- [[006_LGPD_PII_Strategy]]
- [[007_Audit_Logging_Middleware]]
- [[008_AuthN_Strategy]] *(planned)*
- [[009_Authorization_RBAC]] *(planned)*

#file #services #auth #session #brute-force #audit
