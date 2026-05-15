---
title: routers/anamnesis.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_routers_anamnesis_py]]"
file_language: python
path: app/presentation/api/v1/routers/anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - fastapi
  - anamnesis
  - http
  - pt-br
related:
  - "[[br_file_application_dtos_anamnesis_py]]"
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_presentation_schemas_anamnesis_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_file_root_main_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/presentation/api/v1/routers/anamnesis.py` — Router HTTP de Anamnese

## Contexto e Propósito

`APIRouter` FastAPI para endpoints de avaliação clínica, montado em
`/api/v1/avaliacoes` por [[br_file_root_main_py]]. O Sprint 3 entrega um
endpoint; o Sprint 4 adicionará `GET /avaliacoes/{id}` e autenticação JWT.

## Logic Breakdown

**`_build_use_case(session) -> SubmitAnamnesisUseCase`**
- Factory de composição: conecta `AvaliacaoRepository`, `ChecklistRepository`
  e `SymptomScoringOrchestrator` no use case.

**`_to_dto(payload) -> SubmitAnamnesisDTO`**
- Traduz `SubmitAnamnesisRequest` (schema HTTP Pydantic) →
  `SubmitAnamnesisDTO` (DTO de aplicação), isolando concerns de transporte.

**`POST /api/v1/avaliacoes`** (`submit_anamnesis`)
- Aceita payload `SubmitAnamnesisRequest`.
- `usuario_id` está hardcoded como `1` até o guard JWT do Sprint 4.
- Delega para `SubmitAnamnesisUseCase.execute()`.
- Mapeia `RuntimeError` → HTTP 502 Bad Gateway.
- Retorna `AvaliacaoResponse` com 201 Created.

## Dependências
- **Interno:**
  - [[br_file_application_dtos_anamnesis_py]]
  - [[br_file_application_use_cases_submit_anamnesis_py]]
  - [[br_file_presentation_schemas_anamnesis_py]]
  - [[br_file_db_database_py]] (`get_db_session`)
  - `AvaliacaoRepository`, `ChecklistRepository`, `SymptomScoringOrchestrator`
- **Externo:** `fastapi`, `sqlalchemy`.

## Consumidores
- [[br_file_root_main_py]] (`app.include_router(anamnesis.router, ...)`).

## Invariantes / Armadilhas
- `usuario_id_placeholder = 1` DEVE ser substituído no Sprint 4 pelo id
  inteiro extraído do claim `sub` do JWT verificado.
- Sem guard de autenticação no Sprint 3 — endpoint publicamente acessível.
  Adicionar `Depends(get_current_doctor)` no Sprint 4.
- O `session` do `Depends(get_db_session)` é o dono do unit of work;
  o use case não deve commitar ou fazer rollback independentemente.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_008_AuthN_Strategy]] *(planejado)*

#file #presentation #router #fastapi #anamnesis #http #pt-br
