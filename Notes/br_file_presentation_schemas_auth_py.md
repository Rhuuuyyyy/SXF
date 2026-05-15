---
title: auth.py (schemas)
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_schemas_auth_py]]"
file_language: python
path: app/presentation/api/v1/schemas/auth.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - auth
  - jwt
  - pt-br
related:
  - "[[br_file_presentation_routers_auth_py]]"
  - "[[br_file_core_security_py]]"
  - "[[br_008_AuthN_Strategy]]"
---

# `app/presentation/api/v1/schemas/auth.py` — Schemas de Resposta de Autenticação

## Contexto e Propósito

Modelos de resposta Pydantic para endpoints de autenticação. Separar schemas
da lógica de router mantém o arquivo de router limpo e torna o contrato da API
explícito e testável independentemente.

## Logic Breakdown

**`TokenLoginResponse`** — modelo de resposta para `POST /auth/login`:
- `access_token: str` — string JWT assinada.
- `token_type: str = "Bearer"` — fixo por spec OAuth2.
- `sessao_id: int` — FK para `tb_log_sessoes` para que o cliente possa chamar logout.
- `model_config = ConfigDict(extra="forbid")`.

## Dependências
- **Externo:** `pydantic` v2.

## Consumidores
- [[br_file_presentation_routers_auth_py]] — tipo de retorno + `response_model`.

## Invariantes / Armadilhas
- `access_token` NUNCA deve ser logado — é uma credencial sob [[br_006_LGPD_PII_Strategy]].

## ADRs Relacionados
- [[br_008_AuthN_Strategy]] *(planejado)*

#file #presentation #schemas #auth #jwt #pt-br
