---
id: file-repo-dashboard
title: "dashboard_repository.py (interface)"
type: File
status: Active
language: python
path: app/interfaces/repositories/dashboard_repository.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - dashboard
  - materialized-view
  - lgpd
related:
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[file_application_use_cases_refresh_dashboard_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/interfaces/repositories/dashboard_repository.py` — Dashboard Statistics Adapter

## Context & Purpose

Read-only (plus refresh) adapter for the `vw_dashboard_anonimizado` materialised
view. Returns raw `DashboardRow` dataclasses. Deliberately **does not** enforce
the k-anonymity policy — that belongs in
[[file_application_use_cases_get_dashboard_stats_py]].
See [[ADR-003-k-anonymity-in-use-case-layer]] for the rationale.

## Public Surface

```python
@dataclass(frozen=True)
class DashboardRow:
    uf_residencia: str | None
    sexo: str | None
    faixa_etaria: str | None
    etnia: str | None
    total_avaliacoes: int
    media_score: float | None
    taxa_recomendacao_exame: float | None

class DashboardRepository:
    def __init__(self, session: AsyncSession) -> None: ...

    async def get_stats(
        self, *, uf: str | None = None, sexo: str | None = None, etnia: str | None = None
    ) -> list[DashboardRow]: ...

    async def refresh_materialized_view(self) -> None: ...
```

## Logic Walkthrough

### `get_stats()` — Dynamic WHERE

```python
conditions: list[str] = []
params: dict[str, object] = {}

if uf:
    conditions.append("uf_residencia = :uf")
    params["uf"] = uf
if sexo:
    conditions.append("sexo = :sexo")
    params["sexo"] = sexo
if etnia:
    conditions.append("etnia = :etnia")
    params["etnia"] = etnia

where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

sql = f"""
    SELECT uf_residencia, sexo, faixa_etaria, etnia,
           total_avaliacoes, media_score, taxa_recomendacao_exame
    FROM   vw_dashboard_anonimizado
    {where_clause}
    ORDER  BY total_avaliacoes DESC
"""
```

Safe from SQL injection: the f-string interpolates only the WHERE clause
**structure** (hardcoded string literals); all user-supplied filter values
go through SQLAlchemy named parameters (`:uf`, `:sexo`, `:etnia`).

### `refresh_materialized_view()`

```python
await self._session.execute(
    text("REFRESH MATERIALIZED VIEW CONCURRENTLY vw_dashboard_anonimizado")
)
```

- `CONCURRENTLY` — the view remains queryable during refresh (no exclusive lock).
- Requires a unique index on the view — a pre-condition enforced by the DBA team.
- Called only by [[file_application_use_cases_refresh_dashboard_py]], which
  is behind an admin-role guard in [[file_presentation_routers_history_py]].

## Dependencies

- **External:** `sqlalchemy[asyncio]` (`text`, `AsyncSession`).
- **Internal:** none.

## Consumers

| Consumer | Method |
|---|---|
| [[file_application_use_cases_get_dashboard_stats_py]] | `get_stats()` |
| [[file_application_use_cases_refresh_dashboard_py]] | `refresh_materialized_view()` |

## Invariants / Pitfalls

- **No k-anonymity check here.** This adapter returns all rows as-is. The
  threshold enforcement belongs in the use case layer.
- The materialised view is not automatically refreshed — stale data will be
  served between refresh calls. The refresh frequency is a product decision,
  not a code concern.
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` inside a transaction with
  `get_db_session`'s auto-commit will commit the refresh as part of the request.

## Related ADRs

- [[ADR-003-k-anonymity-in-use-case-layer]] — why k-anonymity is NOT enforced here.
- [[006_LGPD_PII_Strategy]] — anonymised view purpose.
- [[003_Hexagonal_Architecture_Strategy]] — adapter mechanical role.

#file #interfaces #repository #dashboard #materialized-view #lgpd
