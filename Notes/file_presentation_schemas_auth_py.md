---
title: auth.py (schemas)
type: File
status: Active
language: python
path: app/presentation/api/v1/schemas/auth.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - auth
  - jwt
related:
  - "[[file_presentation_routers_auth_py]]"
  - "[[file_core_security_py]]"
  - "[[008_AuthN_Strategy]]"
---

# `app/presentation/api/v1/schemas/auth.py` — Auth Response Schemas

## Context & Purpose

Pydantic response models for authentication endpoints. Separating schemas
from router logic keeps the router file clean and makes the API contract
explicit and testable independently.

## Logic Breakdown

**`TokenLoginResponse`** — response model for `POST /auth/login`:
- `access_token: str` — signed JWT string.
- `token_type: str = "Bearer"` — fixed per OAuth2 spec.
- `sessao_id: int` — FK to `tb_log_sessoes` so the client can call logout.
- `model_config = ConfigDict(extra="forbid")`.

## Dependencies
- **External:** `pydantic` v2.

## Consumers
- [[file_presentation_routers_auth_py]] — return type + `response_model`.

## Invariants / Pitfalls
- `access_token` MUST NOT be logged — it is a credential under
  [[006_LGPD_PII_Strategy]].

## Related ADRs
- [[008_AuthN_Strategy]] *(planned)*

#file #presentation #schemas #auth #jwt
