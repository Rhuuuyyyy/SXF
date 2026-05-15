---
title: dtos/anamnesis.py
type: File
status: Active
language: python
path: app/application/dtos/anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - dto
  - anamnesis
related:
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[file_interfaces_repositories_checklist_repository_py]]"
  - "[[file_presentation_routers_anamnesis_py]]"
  - "[[005_Integration_Contracts_DTOs]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/dtos/anamnesis.py` — Anamnesis Application DTOs

## Context & Purpose

Defines the **application-layer Data Transfer Objects** for the anamnesis
submission flow. These frozen dataclasses decouple the use case and outbound
adapters from the HTTP presentation schemas (`SubmitAnamnesisRequest`,
`RespostaSintomaSchema`).

The HTTP router translates Pydantic schemas → DTOs before passing them to
the use case. The use case and adapters never import from `presentation/`.

## Logic Breakdown

**`ChecklistItemDTO`** — frozen dataclass for one symptom answer:
- `sintoma_id: int`
- `presente: bool`
- `observacao: str = ""`

**`SubmitAnamnesisDTO`** — frozen dataclass carrying the full submission:
- `paciente_id: int`
- `sessao_id: int`
- `observacoes: str`
- `diagnostico_previo_fxs: bool`
- `respostas: list[ChecklistItemDTO]`

Both are `frozen=True` — immutable once constructed, safe to pass across layers.

## Dependencies
- **External:** standard library only (`dataclasses`).
- **No framework imports** — portable across transport layers.

## Consumers
- [[file_application_use_cases_submit_anamnesis_py]] (`SubmitAnamnesisDTO`
  as the `execute()` request parameter).
- [[file_interfaces_repositories_checklist_repository_py]] (`ChecklistItemDTO`
  as the item type in `insert_respostas()`).
- [[file_presentation_routers_anamnesis_py]] (`_to_dto()` factory translates
  `SubmitAnamnesisRequest` → `SubmitAnamnesisDTO`).

## Invariants / Pitfalls
- DTOs are transport-layer agnostic — they must never import from `fastapi`,
  `pydantic`, or any presentation schema.
- The `respostas` field uses `field(default_factory=list)` because mutable
  defaults in dataclasses require a factory.

## Related ADRs
- [[005_Integration_Contracts_DTOs]]
- [[003_Hexagonal_Architecture_Strategy]]

#file #application #dto #anamnesis
