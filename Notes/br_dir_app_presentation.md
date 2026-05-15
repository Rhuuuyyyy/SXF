---
id: dir-presentation
title: "app/presentation — Camada de Apresentação HTTP"
type: DirGuide
status: living
language: pt-BR
mirrors: "[[dir_app_presentation]]"
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_root_main_py]]"
  - "[[br_file_presentation_routers_anamnesis_py]]"
  - "[[br_file_presentation_routers_auth_py]]"
  - "[[br_file_presentation_routers_patients_py]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_file_presentation_schemas_anamnesis_py]]"
  - "[[br_file_presentation_schemas_auth_py]]"
  - "[[br_file_presentation_schemas_patient_py]]"
  - "[[br_file_presentation_schemas_history_py]]"
tags:
  - directory
  - presentation
  - http
  - fastapi
  - routers
  - schemas
  - pt-br
related:
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_ADR-002-jwt-stdlib-hs256]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
---

# `app/presentation/` — Camada de Apresentação HTTP

## Propósito

`app/presentation/` é a **camada mais externa** do hexágono — a única camada
autorizada a conhecer HTTP. Traduz requisições HTTP de entrada em chamadas de
caso de uso e resultados de caso de uso de volta em respostas HTTP.

Dois sub-namespaces:

- **`routers/`** — operações de caminho FastAPI `APIRouter`. Cada router
  conecta um ou mais casos de uso com seus adaptadores de repositório.
- **`schemas/`** — modelos Pydantic de request/response. São a superfície de
  contrato de API consumida pelo frontend e documentada pelo OpenAPI.

`app/main.py` fica na raiz de `app/` e é a raiz de composição: cria a
aplicação FastAPI, registra todos os routers e mapeia exceções de domínio para
respostas HTTP RFC 7807.

## Layout do Diretório

```
app/
├── main.py                          # factory create_app(); handlers de exceção globais
└── presentation/
    └── api/
        └── v1/
            ├── routers/
            │   ├── anamnesis.py     # POST /api/v1/anamnesis
            │   ├── auth.py          # POST /api/v1/auth/login, /logout
            │   ├── patients.py      # POST /api/v1/pacientes, GET /api/v1/pacientes
            │   └── history.py       # GET /pacientes/{id}/historico, /dashboard/*
            └── schemas/
                ├── anamnesis.py     # AnamnesisRequest, AnamnesisResponse
                ├── auth.py          # LoginRequest, TokenLoginResponse
                ├── patient.py       # PatientCreateRequest, PatientResponse, PatientListResponse
                └── history.py       # HistoryResponse, DashboardStatsResponse
```

## Filhos

### `app/main.py`

| Preocupação | Detalhe |
|---|---|
| Padrão Factory | `create_app() -> FastAPI` — único arquivo autorizado a importar de todas as camadas |
| Lifespan | `async with lifespan(app)` — cede então `await engine.dispose()` |
| Mapa de exceções | `NotFoundError→404`, `ConflictError→409`, `AuthenticationError→401`, `AuthorizationError→403`, `LGPDComplianceError→422`, `DomainError→422`, `SXFpError→500` |
| Formato de resposta | RFC 7807 `{"type": code, "title": ..., "detail": ...}` |
| Endpoint de saúde | `GET /health` — fora do prefixo de API, sem auth |
| CORS | `CORSMiddleware` com origens de `settings.cors_origins` |

### Routers

| Arquivo | Endpoints | Auth |
|---|---|---|
| [[br_file_presentation_routers_auth_py]] | `POST /auth/login`, `POST /auth/logout` | Login: nenhuma; Logout: JWT |
| [[br_file_presentation_routers_patients_py]] | `POST /pacientes`, `GET /pacientes` | JWT obrigatório |
| [[br_file_presentation_routers_anamnesis_py]] | `POST /anamnesis` | JWT obrigatório |
| [[br_file_presentation_routers_history_py]] | `GET /pacientes/{id}/historico`, `GET /dashboard/stats`, `POST /dashboard/refresh` | JWT obrigatório; refresh requer `role == "admin"` |

### Schemas

| Arquivo | Modelos principais |
|---|---|
| [[br_file_presentation_schemas_auth_py]] | `LoginRequest`, `TokenLoginResponse` |
| [[br_file_presentation_schemas_patient_py]] | `PatientCreateRequest`, `AcompanhanteCreateRequest`, `PatientResponse` (mascarado LGPD), `PatientListResponse` |
| [[br_file_presentation_schemas_anamnesis_py]] | `AnamnesisRequest`, `AnamnesisResponse` |
| [[br_file_presentation_schemas_history_py]] | `HistoryResponse`, `DashboardStatsResponse` |

## Dependências Permitidas

- `fastapi`, `fastapi.security`, `fastapi.middleware.cors`.
- [[br_dir_app_use_cases]] — classes de caso de uso.
- [[br_dir_app_interfaces]] — adaptadores de repositório.
- [[br_file_interfaces_api_dependencies_py]] — `get_current_doctor`, `AuthenticatedDoctor`.
- [[br_dir_app_core]] — `settings`, `exceptions`.
- `pydantic` — para definições de schema.

## Importações Proibidas

- **Routers NÃO DEVEM** conter lógica de negócio. Validação pertence às
  entidades; orquestração pertence aos casos de uso.
- **Schemas NÃO DEVEM** importar diretamente de entidades [[br_dir_app_domain]].
- **`main.py`** é o único arquivo autorizado a importar entre todas as camadas.

## Padrões Chave

- **Mascaramento LGPD na fronteira do router** — `PatientResponse.nome_masked`
  é calculado no router (primeiro nome mantido; demais partes recebem `[0]***`).
- **`extra="forbid"` em todos os schemas** — campos desconhecidos em requisições
  levantam HTTP 422.
- **Guarda de força bruta antes da verificação de credenciais** — `auth.py`
  chama `AuthService.check_brute_force()` antes de `authenticate_doctor()`.
- **Verificação de role inline para admin** — `history.py` verifica
  `doctor.role != "admin"` inline para o endpoint de refresh.
- **Envelope de erro RFC 7807** — todas as respostas de erro retornam
  `{"type": "...", "title": "...", "detail": "..."}` via handler global.

## Invariantes

- O prefixo de API `/api/v1` está em `settings.api_prefix`; não é hardcoded
  em nenhum router individual.
- `GET /health` NUNCA deve exigir autenticação — é o probe de liveness.
- Campos `id` expostos em respostas são UUIDs; PKs inteiras internas nunca
  são expostas a menos que nomeadas com a convenção `_db_id`.

## ADRs Relacionados

- [[br_ADR-002-jwt-stdlib-hs256]] — verificação JWT em `get_current_doctor`.
- [[br_003_Hexagonal_Architecture_Strategy]] — por que routers são a camada mais externa.
- [[br_005_Integration_Contracts_DTOs]] — superfícies de contrato.
- [[br_006_LGPD_PII_Strategy]] — mascaramento LGPD na fronteira de resposta.

#directory #presentation #http #fastapi #routers #pt-br
