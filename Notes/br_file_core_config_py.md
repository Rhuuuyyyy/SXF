---
title: config.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_core_config_py]]"
file_language: python
path: app/core/config.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_core]]"
tags:
  - file
  - core
  - configuration
  - pydantic
  - singleton
  - pt-br
related:
  - "[[br_file_root_env_example]]"
  - "[[br_file_root_main_py]]"
  - "[[br_file_core_security_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/core/config.py` — Settings Tipadas da Aplicação

## Context & Purpose

Centraliza todo valor dependente de ambiente atrás de uma única classe
tipada, `Settings`. Duas forças de design:

1. **Sem look-ups de `os.environ` fora deste arquivo.** Dependentes
   recebem `Settings` via `Depends(get_settings)` do FastAPI; testes
   injetam overrides.
2. **Type safety.** `pydantic-settings` valida tipos no startup,
   falhando rápido se o ambiente está malformado — bem melhor que
   descobrir má-configuração na primeira request.

## Logic Breakdown

Dois símbolos públicos:

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    app_name: str = "SXFp Backend"
    app_version: str = "0.1.0"
    environment: str = Field(default="development")
    debug: bool = False
    api_prefix: str = "/api/v1"
    secret_key: str = Field(default="change-me-in-environment", min_length=8)
    cors_origins: list[str] = Field(default_factory=list)
    database_url: SecretStr
    pgp_key: SecretStr


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- `Settings` herda de `BaseSettings` de `pydantic_settings` (sucessor
  do `BaseSettings` v1).
- `model_config` define a fonte `.env`, encoding e `extra="ignore"`
  para que chaves desconhecidas nunca derrubem a app — só avisem em
  lint de CI.
- `database_url: SecretStr` — URL de conexão PostgreSQL; envolta em
  `SecretStr` para evitar exposição em logs e tracebacks.
- `pgp_key: SecretStr` — chave PGP usada pelo banco para encriptar e
  decriptar dados PII; mantida como `SecretStr` pela mesma razão.
- `secret_key: str` — chave HMAC usada pela implementação HS256 stdlib
  em [[br_file_core_security_py]]. Permanece `str` simples (não
  `SecretStr`) porque `hmac.new()` da stdlib recebe `bytes` diretamente
  via `.encode()`, sem precisar de `.get_secret_value()`.
- `cors_origins: list[str]` default vazio; o [[br_Frontend_Team]]
  fornece valores via env no momento do deploy.
- `get_settings()` é cacheada com `functools.lru_cache` para virar um
  singleton verdadeiro compatível com o grafo DI do FastAPI.

## Dependencies
- **Externo:** `pydantic`, `pydantic-settings`.
- **Lê:** schema de [[br_file_root_env_example]], valores reais de
  `.env` / env do processo / keystore do OS.

## Consumers
- [[br_file_root_main_py]] — pega `app_name`, `app_version`,
  `api_prefix` para metadata FastAPI.
- [[br_file_core_security_py]] — lê `secret_key` para o HMAC HS256.
- [[br_file_db_database_py]] — lê `database_url` e `pgp_key`.
- Qualquer use case futuro que precise de config injeta via
  `Depends(get_settings)`.

## Invariants / Pitfalls
- **Adicionar campo aqui E em [[br_file_root_env_example]]** no mesmo
  commit. Drift entre os dois é violação da Regra 2
  ([[br_000_AI_OBSIDIAN_PROTOCOL]]).
- Nunca leia `os.environ` em outro lugar; o linter proíbe via regra
  ruff customizada (planejada em [[br_201_CI_Pipeline]]).
- O `lru_cache` significa que hot reload em dev mantém settings
  velhas; limpe com `get_settings.cache_clear()` em testes se mutação
  de env é necessária.
- Secrets lidos aqui NÃO PODEM ser logados.
  [[br_file_utils_logger_py]] redige o campo `secret_key` por nome.
- `secret_key` é `str` (não `SecretStr`) deliberadamente — a
  implementação `hmac` stdlib chama `.encode()` diretamente.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_002_Framework_Selection_FastAPI]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_ADR-002-jwt-stdlib-hs256]]

#file #core #configuration #pydantic #pt-br
