---
id: file-domain-scoring
title: "symptom_scoring_orchestrator.py (domain service)"
type: File
status: Active
language: python
path: app/domain/services/symptom_scoring_orchestrator.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - service
  - scoring
  - active-database
related:
  - "[[file_application_use_cases_submit_anamnesis_py]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[file_db_database_py]]"
---

# `app/domain/services/symptom_scoring_orchestrator.py` — Clinical Score Computation

## Context & Purpose

Delegates FXS screening score computation to the PostgreSQL stored function
`fn_calcular_score_triagem(:avaliacao_id)`. The function atomically:

1. Calculates the weighted symptom score.
2. Updates `tb_avaliacoes` with `score_final`, `limiar_usado`, `recomenda_exame`.
3. Closes the open `tb_log_analises` entry.
4. Writes to `tb_auditoria`.

All four side-effects in one atomic DB call — which is precisely why scoring
was delegated to the database (see [[ADR-001-active-database-pattern]]).

This service sits in `domain/services/` because it owns the scoring port, but
it is not a pure domain service in the strict DDD sense: it depends on
`AsyncSession`. The dependency is accepted because the scoring logic is entirely
inside the database and Python only issues the SQL call.

## Public Surface

```python
@dataclass(frozen=True)
class ScoringResult:
    score_final: float
    limiar_usado: float
    recomenda_exame: bool
    versao_param: str       # version stamp from scoring parameter table

class SymptomScoringOrchestrator:
    async def execute_scoring(
        self, avaliacao_id: int, session: AsyncSession
    ) -> ScoringResult: ...
```

## Logic Walkthrough

```python
async def execute_scoring(self, avaliacao_id: int, session: AsyncSession) -> ScoringResult:
    result = await session.execute(
        text("SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)"),
        {"avaliacao_id": avaliacao_id},
    )
    row = result.mappings().first()
    if row is None:
        raise ValueError(f"Falha ao calcular score para avaliação {avaliacao_id}")

    return ScoringResult(
        score_final=cast(float, row["score_final"]),
        limiar_usado=cast(float, row["limiar_usado"]),
        recomenda_exame=cast(bool, row["recomenda_exame"]),
        versao_param=cast(str, row["versao_param"]),
    )
```

1. Execute `SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)` — parameterised,
   safe from SQL injection.
2. `result.mappings().first()` — returns a mapping (column-name keyed dict) of
   the single returned row, or `None` if the function returned no rows.
3. `None` raises `ValueError` — propagates as `DomainError` (caught by the
   global handler → HTTP 422). This should never happen in normal operation.
4. Return frozen `ScoringResult` — immutable, carries all scoring output
   including `versao_param` (the parameter set version used for this evaluation).

## `ScoringResult` Fields

| Field | Type | Source |
|---|---|---|
| `score_final` | `float` | Weighted symptom sum |
| `limiar_usado` | `float` | Threshold from current parameter version |
| `recomenda_exame` | `bool` | `score_final >= limiar_usado` |
| `versao_param` | `str` | Version string from scoring parameter table |

## Dependencies

- **External:** `sqlalchemy.ext.asyncio.AsyncSession`, `sqlalchemy.text`.
- **Internal:** none (no imports from other app layers).

## Consumers

| Consumer | Usage |
|---|---|
| [[file_application_use_cases_submit_anamnesis_py]] | Calls `execute_scoring(avaliacao_id, session)` as Step 4; returns `ScoringResult` in `AnamnesisResult` |
| Sprint 6 test suite | `AsyncMock(spec=SymptomScoringOrchestrator)` provides controlled `ScoringResult` |

## Invariants / Pitfalls

- **`session` must have the PGP key injected** before `execute_scoring` is
  called — but since the key is injected in `get_db_session()` as the first
  statement, this is guaranteed for all request-scoped sessions.
- `fn_calcular_score_triagem` is a PostgreSQL function — its version is tracked
  via `versao_param`. Changing the scoring algorithm requires a DB migration AND
  a new ADR (per [[ADR-001-active-database-pattern]]).
- `recomenda_exame` is authoritative — the Python layer does NOT make this
  decision; it only reads the DB function's output.
- `ScoringResult` is frozen (`@dataclass(frozen=True)`) — it cannot be mutated
  after construction.

## Related ADRs

- [[ADR-001-active-database-pattern]] — why scoring is in the DB, not Python.
- [[003_Hexagonal_Architecture_Strategy]] — why this sits in domain/services/ despite DB dependency.

#file #domain #service #scoring #active-database
