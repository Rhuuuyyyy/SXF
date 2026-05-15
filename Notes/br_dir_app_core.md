---
id: dir-core
title: "app/core — Preocupações Transversais"
type: DirGuide
status: living
language: pt-BR
mirrors: "[[dir_app_core]]"
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_core_config_py]]"
  - "[[br_file_core_exceptions_py]]"
  - "[[br_file_core_security_py]]"
tags:
  - directory
  - core
  - transversal
  - infrastructure-leve
  - pt-br
related:
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
  - "[[br_file_root_main_py]]"
---

# `app/core/` — Preocupações Transversais

## Propósito

`app/core/` contém **primitivas de processo, levemente acopladas ao framework**,
das quais todas as outras camadas dependem, mas que não dependem de nada
específico da aplicação. São os três arquivos que qualquer módulo pode importar
sem restrições: configurações, exceções e segurança JWT.

Em uma leitura estrita de [[br_Hexagonal_Architecture]], elas dividir-se-iam
entre *configuração* (valores puros) e *adapters de infraestrutura* (ex.: JWT).
Colapsamos em um único package `core/` porque são pequenas, estáveis e não têm
semântica de negócio.

## Filhos

| Arquivo | Função |
|---|---|
| [[br_file_core_config_py]] | `Settings` tipado via `pydantic-settings`; singleton com `@lru_cache` |
| [[br_file_core_exceptions_py]] | Hierarquia de exceções neutras ao domínio (`SXFpError` → códigos HTTP) |
| [[br_file_core_security_py]] | Emissão/verificação JWT via `hmac` + `hashlib` stdlib (HS256) |

## Dependências Permitidas

- Biblioteca padrão Python (`hmac`, `hashlib`, `base64`, `json`, `datetime`).
- `pydantic`, `pydantic-settings`.
- **Nenhuma biblioteca criptográfica de terceiros** — veja [[br_ADR-002-jwt-stdlib-hs256]].

## Importações Proibidas

- **NÃO DEVE** importar de [[br_dir_app_domain]], [[br_dir_app_use_cases]],
  [[br_dir_app_interfaces]] ou [[br_dir_app_db]].
- **NÃO DEVE** importar `fastapi` — `core/` é neutro ao framework.
- `passlib` e `python-jose` **não são usados** — ambos falharam na importação
  devido a uma extensão Rust/C do sistema quebrada (veja [[br_ADR-002-jwt-stdlib-hs256]]).

## Padrões Chave

- **Singleton via `lru_cache`** — `get_settings()` retorna a mesma instância
  `Settings` durante a vida do processo.
- **Segredos tipados** — `database_url` e `pgp_key` são `SecretStr`;
  `.get_secret_value()` deve ser chamado explicitamente. `secret_key` é `str`
  simples (a chave HS256 deve ser passada diretamente ao `hmac`).
- **Hierarquia de exceções** — `SXFpError → DomainError | NotFoundError | ConflictError | AuthenticationError | AuthorizationError | LGPDComplianceError`.
- **Verificação JWT em tempo constante** — `hmac.compare_digest()` previne
  forjamento por análise de tempo.

## Invariantes

- `core/` não tem estado em runtime além da instância de configurações com `@lru_cache`.
- Adicionar uma nova classe de exceção aqui requer uma entrada correspondente
  no mapa de handlers em [[br_file_root_main_py]].
- `_ACCESS_TOKEN_TTL_SECONDS = 1800` é a única fonte de verdade para o tempo
  de vida do token.

## ADRs Relacionados

- [[br_ADR-002-jwt-stdlib-hs256]] — por que stdlib HS256 em vez de python-jose/PyJWT.
- [[br_003_Hexagonal_Architecture_Strategy]] — por que `core/` é sua própria camada.
- [[br_006_LGPD_PII_Strategy]] — `pgp_key` e `secret_key` como `SecretStr`.

#directory #core #transversal #pt-br
