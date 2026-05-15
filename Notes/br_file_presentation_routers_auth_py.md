---
title: routers/auth.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_routers_auth_py]]"
file_language: python
path: app/presentation/api/v1/routers/auth.py
created_date: 2026-05-08
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - fastapi
  - auth
  - login
  - http
  - pt-br
related:
  - "[[br_file_services_auth_service_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_file_root_main_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_007_Audit_Logging_Middleware]]"
  - "[[br_008_AuthN_Strategy]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
---

# `app/presentation/api/v1/routers/auth.py` — Router HTTP de Autenticação

## Contexto e Propósito

`APIRouter` FastAPI para endpoints de autenticação, montado em
`/api/v1/auth` por [[br_file_root_main_py]]. Implementa verificação de
credenciais com JWT HS256 via stdlib (ver [[br_ADR-002-jwt-stdlib-hs256]]).

## Logic Breakdown

**`POST /api/v1/auth/login`** (`login`)
1. Guard anti-brute-force: chama `check_brute_force(ip_origem)` — aborta
   com HTTP 429 se o threshold for excedido. **Executa ANTES de
   `authenticate_doctor`** para prevenir enumeração de usuários por timing.
2. Autentica via `authenticate_doctor(email, senha_plain)` — retorna
   `usuario_id` ou `None`.
3. Sempre: registra tentativa via `log_tentativa_login()` (auditoria append-only).
4. Em caso de falha: levanta HTTP 401 com `WWW-Authenticate: Bearer`.
5. Em caso de sucesso: retorna `TokenLoginResponse(access_token=..., token_type="bearer")`
   com JWT HS256 gerado por `create_access_token` de
   [[br_file_core_security_py]].

Usa `OAuth2PasswordRequestForm` para que o Swagger UI exiba o botão
"Authorize". O campo `username` mapeia para email (convenção RFC 6749).

**`POST /api/v1/auth/logout`** (`logout`)
- Invalida o token do lado do servidor (registro de revogação).
- Retorna 204 No Content.

## Dependências
- **Interno:** [[br_file_services_auth_service_py]], [[br_file_db_database_py]],
  [[br_file_core_security_py]].
- **Externo:** `fastapi`, `fastapi.security`, `sqlalchemy`.

## Consumidores
- [[br_file_root_main_py]] (`app.include_router(auth.router, ...)`).

## Invariantes / Armadilhas
- `form_data.password` (texto plano) NUNCA DEVE ser logado. O `AuthService`
  o recebe e passa diretamente ao banco via parâmetro bound.
- `check_brute_force` **DEVE** sempre rodar antes de `authenticate_doctor` —
  previne enumeração de usuários por timing em ataques de brute force.
- A resposta é `TokenLoginResponse(access_token=..., token_type="bearer")` —
  não um dict Python avulso. O modelo Pydantic garante serialização consistente.
- Não há RS256 nem `python-jose`. O JWT é HS256 com stdlib conforme
  [[br_ADR-002-jwt-stdlib-hs256]].

## ADRs Relacionados
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_ADR-002-jwt-stdlib-hs256]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #presentation #router #fastapi #auth #login #http #pt-br
