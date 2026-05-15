---
title: anamnesis.py (schemas)
type: File
status: Active
language: python
path: app/presentation/api/v1/schemas/anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - pydantic
  - openapi
  - anamnesis
related:
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[file_interfaces_repositories_checklist_repository_py]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/presentation/api/v1/schemas/anamnesis.py` — Anamnesis Request/Response Schemas

## Context & Purpose

Pydantic V2 request and response schemas for the anamnesis (clinical evaluation)
endpoints. These are the **OpenAPI source of truth** consumed by the frontend
team. No business logic lives here — that belongs in use cases and domain
services.

## Logic Breakdown

**Request schemas:**
- `RespostaSintomaSchema` — one symptom answer: `sintoma_id`, `presente` (bool),
  `observacao` (optional string, max 500 chars).
- `SubmitAnamnesisRequest` — full checklist submission: `paciente_id`,
  `sessao_id`, `observacoes`, `diagnostico_previo_fxs`, and a
  `respostas: list[RespostaSintomaSchema]` (min 1 item).

**Response schemas:**
- `AvaliacaoResponse` — returned after score computation: `avaliacao_id`,
  `paciente_id`, `score_final`, `limiar_usado`, `recomenda_exame`,
  `versao_param`, `status`.

All models use `ConfigDict(extra="forbid")` to reject unknown fields.

## Dependencies
- **External:** `pydantic` only.
- **Internal:** none (presentation layer — no domain imports).

## Consumers
- HTTP routers in `app/presentation/api/v1/routers/` *(Sprint 3)*.
- [[file_application_use_cases_submit_anamnesis_py]] (`SubmitAnamnesisRequest`
  passed as the command object).
- [[file_interfaces_repositories_checklist_repository_py]] (`RespostaSintomaSchema`
  used for bulk-insert mapping).

## Invariants / Pitfalls
- `respostas` has `min_length=1` — prevents empty checklist submissions.
- `diagnostico_previo_fxs=True` suppresses the exam recommendation in the
  response but the DB function still computes the score.
- These schemas are versioned under `v1/` — breaking field changes require a
  `v2/` namespace.

## Related ADRs
- [[005_Integration_Contracts_DTOs]]
- [[003_Hexagonal_Architecture_Strategy]]

#file #presentation #schemas #pydantic #openapi #anamnesis
