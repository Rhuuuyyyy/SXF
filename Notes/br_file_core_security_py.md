---
title: security.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_core_security_py]]"
file_language: python
path: app/core/security.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_core]]"
tags:
  - file
  - core
  - security
  - authentication
  - jwt
  - hs256
  - stdlib
  - pt-br
related:
  - "[[br_file_core_config_py]]"
  - "[[br_file_services_auth_service_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
---

# `app/core/security.py` — Primitivas Criptográficas

## Context & Purpose

Hospeda os **adapters criptográficos de baixo nível** dos quais o resto
da base depende. Separá-los aqui (vs. inline em
[[br_file_services_auth_service_py]]) permite:

- Testar comportamento crypto sem subir fluxos de auth.
- Trocar implementações sem recablar callers.
- Expor superfícies estáveis que a [[br_Hexagonal_Architecture]] respeita.

Ver [[br_ADR-002-jwt-stdlib-hs256]] para a decisão de usar stdlib em vez
de bibliotecas de terceiros.

## Logic Breakdown

A implementação usa exclusivamente **stdlib Python** — `hmac`, `hashlib`
e `base64` — sem dependência de `python-jose`, `pyjwt` ou `passlib`.

Constante pública:

```python
_ACCESS_TOKEN_TTL_SECONDS = 1800  # 30 minutos
```

API pública:

```python
def create_access_token(subject: str, role: str, settings: Settings) -> str:
    """Gera JWT HS256 assinado com stdlib hmac + hashlib."""
    ...

def verify_access_token(token: str, settings: Settings) -> TokenClaims:
    """Verifica assinatura HS256 e validade temporal; lança em caso de falha."""
    ...
```

Por que essas escolhas:

- **HS256 com stdlib** — `hmac.new(key, msg, hashlib.sha256)` sem
  dependência de terceiros. Conforme [[br_ADR-002-jwt-stdlib-hs256]]:
  HS256 simétrico é suficiente para o contexto single-service atual;
  elimina a superfície de ataque de bibliotecas externas de JWT.
- **`base64` (URL-safe)** — codificação/decodificação dos segmentos do
  token conforme RFC 7519.
- **`hashlib`** — digest SHA-256 para a assinatura HMAC.
- **Token claims** incluem `sub` (id do médico), `role`, `iat`, `exp`.
- **TTL de 1800 segundos** (30 min) — balanceia segurança e usabilidade
  conforme [[br_006_LGPD_PII_Strategy]].

## Dependencies
- **Externo:** apenas stdlib (`hmac`, `hashlib`, `base64`, `json`,
  `time`). Sem `python-jose`, sem `passlib`, sem `pyjwt`.
- **Interno:** [[br_file_core_config_py]] (`secret_key`, `environment`).

## Consumers
- [[br_file_services_auth_service_py]] (login).
- [[br_file_interfaces_api_dependencies_py]] (dependency
  `get_current_doctor` via `verify_access_token`).

## Invariants / Pitfalls
- **Sem `python-jose` ou `passlib`.** Qualquer PR que adicione essas
  dependências precisa revisar o [[br_ADR-002-jwt-stdlib-hs256]] primeiro.
- Nunca logue strings de token ou material de senha —
  [[br_file_utils_logger_py]] redige por nome de campo.
- O literal `secret_key = "change-me-in-environment"` DEVE levantar no
  startup se `environment != "development"`. Fail-loud é parte de
  [[br_006_LGPD_PII_Strategy]].
- `secret_key` é lido como `str` de `Settings` e convertido para
  `bytes` via `.encode()` antes de ser passado ao `hmac.new()`.

## Related ADRs
- [[br_ADR-002-jwt-stdlib-hs256]]
- [[br_006_LGPD_PII_Strategy]]

#file #core #security #crypto #jwt #hs256 #stdlib #pt-br
