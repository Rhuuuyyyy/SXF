---
title: avaliacao_repository.py
type: File
status: Active
language: python
path: app/interfaces/repositories/avaliacao_repository.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - adapter
  - outbound
  - avaliacao
related:
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[file_db_database_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/interfaces/repositories/avaliacao_repository.py` — Avaliação Outbound Adapter

## Context & Purpose

Concrete outbound adapter that interacts with the `avaliacoes` view and the
`tb_log_analises` table. Manages the lifecycle of a clinical evaluation
record. Uses `sqlalchemy.text()` exclusively — no ORM models.

## Logic Breakdown

**`create_rascunho(paciente_id, usuario_id, observacoes, diagnostico_previo_fxs) -> int`**
- INSERTs a new evaluation into the `avaliacoes` view with implicit
  `status='rascunho'` (set by the DB `INSTEAD OF` trigger).
- Returns the auto-generated `avaliacao_id` via `RETURNING id`.

**`open_log_analise(avaliacao_id, usuario_id, sessao_id) -> int`**
- INSERTs into `tb_log_analises` to timestamp when the doctor opened the form.
- Returns the `log_analise` id.
- The DB function `fn_calcular_score_triagem` closes this record atomically.

## Dependencies
- **Internal:** [[file_db_database_py]] (AsyncSession injected via constructor).
- **External:** `sqlalchemy`.

## Consumers
- [[file_application_use_cases_submit_anamnesis_py]] (Steps 1 and 2 of the
  anamnesis flow).

## Invariants / Pitfalls
- Both methods raise `RuntimeError` if the DB returns no row — this indicates
  a trigger misconfiguration or permission issue on the view.
- The `RETURNING id` clause requires that the `avaliacoes` view's `INSTEAD OF
  INSERT` trigger returns the generated PK.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]

#file #interfaces #repository #adapter #outbound #avaliacao
