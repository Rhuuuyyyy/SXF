---
id: file-uc-submit-anamnesis
title: "submit_anamnesis.py (use case)"
type: File
status: Active
language: python
path: app/application/use_cases/submit_anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - anamnesis
  - clinical
  - scoring
related:
  - "[[file_interfaces_repositories_avaliacao_repository_py]]"
  - "[[file_interfaces_repositories_checklist_repository_py]]"
  - "[[file_domain_services_symptom_scoring_orchestrator_py]]"
  - "[[file_application_dtos_anamnesis_py]]"
  - "[[file_presentation_routers_anamnesis_py]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/submit_anamnesis.py` — SubmitAnamnesisUseCase

## Context & Purpose

Orchestrates the **critical clinical write path** — the full flow from
receiving a validated checklist payload to returning a scored result.
HTTP-blind by design: raises domain exceptions, never `HTTPException`.

## Public Surface

```python
@dataclass(frozen=True)
class AnamnesisResult:
    avaliacao_id: int
    scoring: ScoringResult   # from SymptomScoringOrchestrator

class SubmitAnamnesisUseCase:
    def __init__(
        self,
        avaliacoes: AvaliacaoRepository,
        checklist: ChecklistRepository,
        scoring: SymptomScoringOrchestrator,
    ) -> None: ...

    async def execute(
        self, *, request: SubmitAnamnesisDTO, usuario_id: int, session: AsyncSession
    ) -> AnamnesisResult: ...
```

## Logic Walkthrough

All five steps share the same `AsyncSession` (unit of work). Any failure rolls back
the entire transaction via `get_db_session()`.

**Step 1 — Create rascunho**
```python
avaliacao_id = await self._avaliacoes.create_rascunho(
    paciente_id=request.paciente_id,
    usuario_id=usuario_id,
    observacoes=request.observacoes,
    diagnostico_previo_fxs=request.diagnostico_previo_fxs,
)
```
Creates the evaluation record in `tb_avaliacoes` with `status='rascunho'`.

**Step 2 — Open log**
```python
await self._avaliacoes.open_log_analise(
    avaliacao_id=avaliacao_id, usuario_id=usuario_id, sessao_id=request.sessao_id
)
```
Timestamps when the doctor opened the checklist form in `tb_log_analises`.

**Step 3 — Insert answers**
```python
await self._checklist.insert_respostas(
    avaliacao_id=avaliacao_id, respostas=request.respostas
)
```
Bulk-inserts per-symptom answers (`ChecklistItemDTO` list).

**Step 4 — Score (Active DB pattern)**
```python
scoring_result = await self._scoring.execute_scoring(
    avaliacao_id=avaliacao_id, session=session
)
```
Calls `fn_calcular_score_triagem(:avaliacao_id)` — atomically scores, updates
`tb_avaliacoes`, closes `tb_log_analises`, and writes `tb_auditoria`.
See [[ADR-001-active-database-pattern]].

**Step 5 — Return**
```python
return AnamnesisResult(avaliacao_id=avaliacao_id, scoring=scoring_result)
```

## `SubmitAnamnesisDTO` Fields

| Field | Type | Notes |
|---|---|---|
| `paciente_id` | `int` | FK to `tb_pacientes.id` |
| `usuario_id` | `int` | Doctor's DB integer PK |
| `sessao_id` | `int` | Active session from JWT claim `sid` |
| `observacoes` | `str \| None` | Free-text clinical notes |
| `diagnostico_previo_fxs` | `bool` | Prior FXS diagnosis flag |
| `respostas` | `list[ChecklistItemDTO]` | `sintoma_id` + `presente` per symptom |

## Dependencies

- **Internal:**
  - [[file_interfaces_repositories_avaliacao_repository_py]]
  - [[file_interfaces_repositories_checklist_repository_py]]
  - [[file_domain_services_symptom_scoring_orchestrator_py]]
  - [[file_application_dtos_anamnesis_py]]
- **External:** `sqlalchemy.ext.asyncio.AsyncSession`.

## Consumers

- [[file_presentation_routers_anamnesis_py]] (`POST /api/v1/anamnesis`).

## Invariants / Pitfalls

- MUST NOT import `fastapi`.
- `usuario_id` is the integer PK from the JWT `sub` claim — not a UUID.
- The `session` parameter is the unit-of-work owner; the use case MUST NOT
  call `commit()` or `rollback()`.
- `ScoringResult.recomenda_exame` is authoritative — Python does not make
  the clinical recommendation decision.

## Related ADRs

- [[ADR-001-active-database-pattern]] — why scoring is delegated to the DB function.
- [[003_Hexagonal_Architecture_Strategy]] — use case layer independence.
- [[005_Integration_Contracts_DTOs]] — `SubmitAnamnesisDTO` as application DTO.

#file #application #use-case #anamnesis #clinical #scoring
