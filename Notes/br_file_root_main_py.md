---
title: main.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_root_main_py]]"
file_language: python
path: app/main.py
created_date: 2026-05-03
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
tags:
  - file
  - entrypoint
  - presentation
  - fastapi
  - composition-root
  - pt-br
related:
  - "[[br_file_core_config_py]]"
  - "[[br_dir_app_interfaces]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_002_Framework_Selection_FastAPI]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_007_Audit_Logging_Middleware]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
---

# `main.py` — Entry Point ASGI da Aplicação

> **Nota sobre o caminho:** `main.py` é o *papel*. A implementação atual
> vive em `app/main.py`. Se/quando o time mover para a raiz por
> simplicidade Docker, o `path:` da frontmatter precisa ser atualizado
> sob a Regra 2 de [[br_000_AI_OBSIDIAN_PROTOCOL]].

## Context & Purpose

`main.py` é o **entry point ASGI** e o **composition root** da
arquitetura hexagonal (ver [[br_003_Hexagonal_Architecture_Strategy]]).
É o único lugar onde:

1. A instância da aplicação [[br_FastAPI]] é construída.
2. Middlewares cross-cutting são montados ([[br_007_Audit_Logging_Middleware]],
   request-id, CORS).
3. APIRouters de [[br_dir_app_interfaces]] são incluídos sob
   `settings.api_prefix`.
4. Adapters concretos da infraestrutura são bound aos Ports abstratos
   definidos em [[br_dir_app_domain]] (via [[br_Dependency_Injection]]).
5. O hook de lifespan abre/fecha recursos de longa duração (DB pools,
   workers da pipeline de auditoria).

É o **único arquivo** que pode importar de toda outra camada.

## Logic Breakdown

Dois símbolos públicos:

- `create_app() -> FastAPI` — factory pura, usada por testes com
  overrides de adapter. Lê `Settings` de [[br_file_core_config_py]]
  uma vez e monta a instância FastAPI com title, version, OpenAPI URL
  e lifespan.
- `app: FastAPI` — instância em nível de módulo produzida por
  `create_app()`. É o que `uvicorn app.main:app` boota em
  [[br_file_root_Dockerfile]] e [[br_file_root_docker_compose_yml]].

Dentro de `create_app()`, em ordem:

1. `settings = get_settings()` — singleton via `lru_cache`.
2. Constrói `app = FastAPI(...)` com metadata para geração de
   [[br_OpenAPI]].
3. Adiciona middlewares (ordem importa): `CORSMiddleware` →
   `RequestIdMiddleware` → `AuditMiddleware`. Ver
   [[br_007_Audit_Logging_Middleware]] para o racional de ordem.
4. `app.include_router(...)` para cada um dos quatro routers sob
   [[br_dir_app_interfaces]]: `anamnesis`, `auth`, `patients` e
   `history` (histórico do paciente + dashboard). Todos montados sob
   `settings.api_prefix`.
5. Registra handlers de exceção de domínio (mapa completo):
   - `NotFoundError` → HTTP 404
   - `ConflictError` → HTTP 409
   - `AuthenticationError` → HTTP 401
   - `AuthorizationError` → HTTP 403
   - `LGPDComplianceError` → HTTP 422
   - `DomainError` → HTTP 422
   - `SXFpError` → HTTP 500
6. Registra um endpoint mínimo `/health` fora do prefixo para liveness
   probes.
7. Liga overrides de dependência para testes, se
   `settings.environment == "test"`.

## Dependencies
- **Internas:** [[br_file_core_config_py]], [[br_dir_app_interfaces]],
  middlewares de [[br_dir_app_presentation]] (planejado).
- **Externas:** `fastapi`, `uvicorn[standard]`, `starlette`.

## Consumers
- ASGI server (`uvicorn`).
- Suite de testes (`from app.main import create_app`).
- [[br_file_root_Dockerfile]] (`CMD ["uvicorn", "app.main:app", ...]`).

## Invariants / Pitfalls
- `main.py` PODE importar de qualquer camada; **nenhum outro arquivo**
  pode. Aplicado por regras `import-linter` listadas em
  [[br_004_Directory_Structure]] *(planejado)*.
- Imports com side-effect são proibidos — trabalho pesado pertence a
  `lifespan`.
- A ordem de adição dos middlewares é o *inverso* da ordem em que
  envolvem a resposta. CORS primeiro, audit por último (mais interno)
  para que o audit log capture os pre-flights rejeitados.
- Adapters bound aqui DEVEM satisfazer os `Protocol`s definidos em
  [[br_dir_app_domain]] (especificamente
  [[br_file_interfaces_repositories_base_py]] e cia.).

## Related ADRs
- [[br_002_Framework_Selection_FastAPI]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_ADR-002-jwt-stdlib-hs256]]

#file #entrypoint #composition-root #fastapi #pt-br
