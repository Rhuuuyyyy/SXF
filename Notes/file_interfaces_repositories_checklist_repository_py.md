---
title: checklist_repository.py
type: File
status: Active
language: python
path: app/interfaces/repositories/checklist_repository.py
created_date: 2026-05-08
updated_date: 2026-05-08
sprint: 3
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - adapter
  - outbound
  - checklist
related:
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[file_application_dtos_anamnesis_py]]"
  - "[[file_db_database_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/interfaces/repositories/checklist_repository.py` — Checklist Outbound Adapter

## Context & Purpose

Concrete outbound adapter that bulk-inserts per-symptom answers for one
clinical evaluation into `respostas_checklist`. Uses `sqlalchemy.text()`
exclusively.

## Logic Breakdown

**`insert_respostas(avaliacao_id, respostas) -> None`**
- Iterates over `list[ChecklistItemDTO]` (application DTO — not the HTTP
  schema) and issues one parameterised INSERT per symptom answer.
- Fields written: `avaliacao_id`, `sintoma_id`, `presente`, `observacao`.
- No return value — called for side effects inside the unit of work.

> **Future optimisation:** replace the loop with a bulk `INSERT ... VALUES`
> using `executemany` or a Postgres `UNNEST` approach if checklist sizes
> grow beyond ~50 symptoms.

## Dependencies
- **Internal:**
  - [[file_db_database_py]] (AsyncSession injected via constructor).
  - [[file_presentation_schemas_anamnesis_py]] (`RespostaSintomaSchema`).
- **External:** `sqlalchemy`.

## Consumers
- [[file_application_use_cases_submit_anamnesis_py]] (Step 3 of anamnesis
  flow).

## Invariants / Pitfalls
- Runs inside the same `AsyncSession` as `AvaliacaoRepository` — all
  inserts are part of a single unit of work committed by `get_db_session`.
- If any INSERT fails (e.g., FK violation on `sintoma_id`), the entire
  transaction rolls back automatically.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]

#file #interfaces #repository #adapter #outbound #checklist
