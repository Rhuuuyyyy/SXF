---
title: get_patient_history.py
type: File
status: Active
language: python
path: app/application/use_cases/get_patient_history.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - history
  - patient
  - rbac
  - pagination
related:
  - "[[file_interfaces_repositories_avaliacao_read_repository_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
---

# `app/application/use_cases/get_patient_history.py` — GetPatientHistoryUseCase

## Context & Purpose

Orchestrates paginated retrieval of clinical evaluation history for one patient.
HTTP-blind: raises domain exceptions only. RBAC is delegated to the repository
query (JOIN on `pacientes.criado_por`).

## Logic Breakdown

**`PatientHistoryResult`** — frozen dataclass returned to the router:
- `items: list[AvaliacaoHistoricoItem]`
- `total: int`, `limit: int`, `offset: int`

**`GetPatientHistoryUseCase.execute(*, paciente_id, usuario_id, limit, offset)`**:

1. Enforce `limit <= 200` — hard cap to prevent unbounded result sets.
2. `count_by_paciente(...)` — fetch total for pagination metadata.
3. `list_by_paciente(...)` — fetch the page of items.
4. Return `PatientHistoryResult`.

An empty result (`total=0, items=[]`) is valid — the patient exists but has
no evaluations yet. No `NotFoundError` is raised in this case.

## Dependencies
- **Internal:** [[file_interfaces_repositories_avaliacao_read_repository_py]]
- **External:** stdlib only.

## Consumers
- [[file_presentation_routers_history_py]]

## Invariants / Pitfalls
- MUST NEVER import `fastapi`.
- `usuario_id` must come from the verified JWT — the use case trusts it as
  already authenticated by `get_current_doctor`.
- The 200-item hard cap is enforced here, not in the router or repository.

## Related ADRs
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]

#file #application #use-case #history #patient #rbac
