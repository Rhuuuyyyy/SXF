---
id: file-repo-avaliacao-read
title: "avaliacao_read_repository.py (interface)"
type: File
status: Active
language: python
path: app/interfaces/repositories/avaliacao_read_repository.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - read-model
  - history
  - rbac
related:
  - "[[file_application_use_cases_get_patient_history_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[file_db_database_py]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/interfaces/repositories/avaliacao_read_repository.py` — Evaluation History Read Adapter

## Context & Purpose

Read-only adapter for fetching evaluation history from the `avaliacoes` view.
Returns lightweight `AvaliacaoHistoricoItem` dataclasses — no full domain
entities, no invariants to preserve.

RBAC is enforced at the SQL level via a JOIN on `pacientes`:
`JOIN pacientes p ON p.id = a.paciente_id WHERE ... AND p.criado_por = :usuario_id`.
This ensures a doctor can only retrieve history for patients they registered.

## Public Surface

```python
@dataclass(frozen=True)
class AvaliacaoHistoricoItem:
    avaliacao_id: int
    paciente_id: int
    usuario_id: int
    data_avaliacao: datetime
    score_final: float | None
    recomenda_exame: bool | None

class AvaliacaoReadRepository:
    def __init__(self, session: AsyncSession) -> None: ...

    async def list_by_paciente(
        self, *, paciente_id: int, usuario_id: int, limit: int, offset: int
    ) -> list[AvaliacaoHistoricoItem]: ...

    async def count_by_paciente(
        self, *, paciente_id: int, usuario_id: int
    ) -> int: ...
```

## Logic Walkthrough

### `list_by_paciente()`

```sql
SELECT a.id, a.paciente_id, a.usuario_id, a.data_avaliacao,
       a.score_final, a.recomenda_exame
FROM   avaliacoes a
JOIN   pacientes p ON p.id = a.paciente_id
WHERE  a.paciente_id = :paciente_id
  AND  p.criado_por = :usuario_id
ORDER  BY a.data_avaliacao ASC
LIMIT  :limit OFFSET :offset
```

- `ORDER BY data_avaliacao ASC` — chronological (oldest first), consistent
  with clinical chart conventions.
- RBAC JOIN: `p.criado_por = :usuario_id` — without this join, a doctor could
  request history for any `paciente_id` they know.

### `count_by_paciente()`

Same JOIN and WHERE, returns `COUNT(*)` for pagination metadata. No LIMIT/OFFSET.

## Dependencies

- **External:** `sqlalchemy[asyncio]` (`text`, `AsyncSession`).
- **Internal:** none.

## Consumers

- [[file_application_use_cases_get_patient_history_py]]

## Invariants / Pitfalls

- `sqlalchemy.text()` only — no ORM models or mapped classes.
- `usuario_id` filter MUST be present in every query. Removing the JOIN breaks
  RBAC and exposes other doctors' patients.
- The `avaliacoes` target is a view, not `tb_avaliacoes` — the view applies
  the same PGP decryption as the `pacientes` view (PGP key injected by
  `get_db_session()` before the query runs).
- `score_final` and `recomenda_exame` may be `None` if the evaluation was not
  yet scored (status `'rascunho'`).

## Related ADRs

- [[ADR-001-active-database-pattern]] — reads target views; PGP key injected per session.
- [[003_Hexagonal_Architecture_Strategy]] — adapter layer independence.
- [[006_LGPD_PII_Strategy]] — RBAC protects PII access.

#file #interfaces #repository #read-model #history #rbac
