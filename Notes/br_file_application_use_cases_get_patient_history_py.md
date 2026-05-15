---
title: get_patient_history.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_use_cases_get_patient_history_py]]"
file_language: python
path: app/application/use_cases/get_patient_history.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - history
  - patient
  - rbac
  - pagination
  - pt-br
related:
  - "[[br_file_interfaces_repositories_avaliacao_read_repository_py]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
---

# `app/application/use_cases/get_patient_history.py` — GetPatientHistoryUseCase

## Contexto & Propósito

Orquestra a recuperação paginada do histórico de avaliações clínicas de um
paciente. É agnóstico à HTTP: eleva apenas exceções de domínio. RBAC é
delegado à query do repositório (JOIN em `pacientes.criado_por`).

## Logic Breakdown

**`PatientHistoryResult`** — dataclass congelada retornada ao router:
- `items: list[AvaliacaoHistoricoItem]`
- `total: int`, `limit: int`, `offset: int`

**`GetPatientHistoryUseCase.execute(*, paciente_id, usuario_id, limit, offset)`**:

1. Impõe `limit <= 200` — teto fixo para evitar result sets ilimitados.
2. `count_by_paciente(...)` — busca o total para metadados de paginação.
3. `list_by_paciente(...)` — busca a página de itens.
4. Retorna `PatientHistoryResult`.

Um resultado vazio (`total=0, items=[]`) é válido — o paciente existe mas
ainda não possui avaliações. Nenhum `NotFoundError` é elevado neste caso.

## Dependencies
- **Internas:** [[br_file_interfaces_repositories_avaliacao_read_repository_py]]
- **Externas:** apenas stdlib.

## Consumers
- [[br_file_presentation_routers_history_py]]

## Invariants / Pitfalls
- NUNCA importar `fastapi`.
- `usuario_id` deve vir do JWT verificado — o caso de uso confia que já
  foi autenticado por `get_current_doctor`.
- O teto de 200 itens é aplicado aqui, não no router ou repositório.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]

#file #application #use-case #history #patient #rbac #pt-br
