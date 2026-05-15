---
title: routers/anamnesis.py
type: File
status: Active
language: python
path: app/presentation/api/v1/routers/anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - fastapi
  - anamnesis
  - http
related:
  - "[[file_application_dtos_anamnesis_py]]"
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[file_presentation_schemas_anamnesis_py]]"
  - "[[file_db_database_py]]"
  - "[[file_root_main_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/presentation/api/v1/routers/anamnesis.py` — Anamnesis HTTP Router

## Context & Purpose

FastAPI `APIRouter` for clinical evaluation endpoints, mounted at
`/api/v1/avaliacoes` by [[file_root_main_py]]. Sprint 3 ships one endpoint;
Sprint 4 will add `GET /avaliacoes/{id}` and authentication guard.

## Logic Breakdown

**`_build_use_case(session) -> SubmitAnamnesisUseCase`**
- Composition factory: wires `AvaliacaoRepository`, `ChecklistRepository`,
  and `SymptomScoringOrchestrator` into the use case.

**`_to_dto(payload) -> SubmitAnamnesisDTO`**
- Translates `SubmitAnamnesisRequest` (Pydantic HTTP schema) →
  `SubmitAnamnesisDTO` (application DTO), isolating transport concerns.

**`POST /api/v1/avaliacoes`** (`submit_anamnesis`)
- Accepts `SubmitAnamnesisRequest` payload.
- `usuario_id` is hardcoded to `1` until Sprint 4 JWT guard.
- Delegates to `SubmitAnamnesisUseCase.execute()`.
- Maps `RuntimeError` → HTTP 502 Bad Gateway.
- Returns `AvaliacaoResponse` with 201 Created.

## Dependencies
- **Internal:**
  - [[file_application_dtos_anamnesis_py]]
  - [[file_application_use_cases_submit_anamnesis_py]]
  - [[file_presentation_schemas_anamnesis_py]]
  - [[file_db_database_py]] (`get_db_session`)
  - `AvaliacaoRepository`, `ChecklistRepository`, `SymptomScoringOrchestrator`
- **External:** `fastapi`, `sqlalchemy`.

## Consumers
- [[file_root_main_py]] (`app.include_router(anamnesis.router, ...)`).

## Invariants / Pitfalls
- `usuario_id_placeholder = 1` MUST be replaced in Sprint 4 with the integer
  id extracted from the verified JWT `sub` claim.
- No authentication guard in Sprint 3 — endpoint is publicly accessible.
  Add `Depends(get_current_doctor)` in Sprint 4.
- The `session` from `Depends(get_db_session)` is the unit-of-work owner;
  the use case must not commit or rollback independently.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[008_AuthN_Strategy]] *(planned)*

#file #presentation #router #fastapi #anamnesis #http
