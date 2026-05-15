---
id: ADR-002
title: "JWT stdlib HS256 — Implementação HMAC Personalizada Sem Bibliotecas JWT de Terceiros"
status: accepted
date: 2026-05-11
language: pt-BR
mirrors: "[[ADR-002-jwt-stdlib-hs256]]"
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - jwt
  - seguranca
  - auth
  - stdlib
  - pt-br
related:
  - "[[br_file_core_security_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_008_AuthN_Strategy]]"
  - "[[br_file_presentation_routers_auth_py]]"
---

# ADR-002 — JWT stdlib HS256: Implementação HMAC Personalizada Sem Bibliotecas JWT de Terceiros

## Status

**Aceito** — 2026-05-11

---

## Contexto

O backend SXFp requer autenticação baseada em JWT. O plano original chamava
para assinatura assimétrica RS256 usando `python-jose` ou `PyJWT`.

Durante o Sprint 4, tanto `python-jose` quanto `PyJWT` falharam na importação
no ambiente de implantação. Ambas as bibliotecas dependem do pacote
`cryptography`, que fornece uma extensão Rust/C. A extensão falhou ao carregar
devido a um link `libssl` quebrado no host alvo. O erro impediu o início da
aplicação.

A equipe precisava de uma implementação JWT funcional que pudesse ser
implantada no host atual sem dependências externas além da biblioteca padrão
do Python.

---

## Decisão

Implementamos assinatura e verificação JWT usando **apenas a biblioteca padrão
do Python**: `hmac`, `hashlib` e `base64`. O algoritmo é **HS256**
(HMAC-SHA-256). A chave de assinatura é a string `settings.secret_key`
codificada como bytes UTF-8.

A estrutura do token segue a RFC 7519:
- Header: `{"alg": "HS256", "typ": "JWT"}`
- Payload: `{"sub": str(usuario_id), "role": role, "sid": sessao_id, "iat": iat, "exp": exp}`
- Assinatura: `HMAC-SHA256(base64url(header) + "." + base64url(payload), key)`

Decisões de implementação em `app/core/security.py`:

- `_ACCESS_TOKEN_TTL_SECONDS = 1800` (30 minutos).
- Verificação de assinatura usa `hmac.compare_digest()` — comparação em tempo
  constante que previne forjamento de assinatura baseado em temporização.
- `verify_access_token()` levanta `JWTError` em qualquer falha: token mal
  formado, assinatura inválida ou timestamp expirado. O chamador
  (`get_current_doctor`) captura `JWTError` e levanta HTTP 401.

```python
# Emissão
sig = base64.urlsafe_b64encode(
    hmac.new(key_bytes, f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
).rstrip(b"=")

# Verificação (tempo constante)
hmac.compare_digest(signature_bytes, expected_sig_bytes)
```

---

## Consequências

**Positivas:**

- Zero dependências externas para JWT; nenhuma extensão Rust/C necessária.
- Totalmente auditável: toda a implementação JWT é ~80 linhas em um arquivo.
- `hmac.compare_digest()` garante verificação segura contra ataques de temporização.

**Negativas:**

- HS256 é simétrico: o mesmo segredo assina e verifica. Se múltiplos serviços
  precisarem verificar tokens, todos precisam da chave secreta.
- Sem rotação automática de chave — rotacionar `secret_key` invalida todas as
  sessões existentes.
- A implementação não suporta JWK, endpoints JWKS ou introspecção de token.

---

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| `python-jose` | Falhou na importação; extensão Rust/C indisponível no host. |
| `PyJWT` | Mesma causa raiz; mesma dependência da extensão `cryptography`. |
| `authlib` | Também depende de `cryptography`; mesmo modo de falha. |
| RS256 com stdlib personalizada | Análise de chave RSA requer `cryptography` ou pacote `rsa`. |

#adr #jwt #seguranca #auth #stdlib #hs256 #pt-br
