---
id: file-uc-dashboard-stats
title: "get_dashboard_stats.py (use case)"
type: File
status: Active
language: python
path: app/application/use_cases/get_dashboard_stats.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - dashboard
  - lgpd
  - k-anonymity
related:
  - "[[file_interfaces_repositories_dashboard_repository_py]]"
  - "[[file_presentation_routers_history_py]]"
  - "[[file_core_exceptions_py]]"
  - "[[ADR-003-k-anonymity-in-use-case-layer]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/get_dashboard_stats.py` — GetDashboardStatsUseCase

## Context & Purpose

Fetches anonymised statistics from the `vw_dashboard_anonimizado` materialised
view and enforces the **k-anonymity policy** required by LGPD Art. 12 and the
clinical research protocol governing this system.

If any returned row has `total_avaliacoes < K_ANONYMITY_THRESHOLD` (5), the
entire response is blocked by raising `LGPDComplianceError` — mapped to HTTP 422
by the global exception handler in [[file_root_main_py]].

See [[ADR-003-k-anonymity-in-use-case-layer]] for the full decision record.

## Public Surface

```python
K_ANONYMITY_THRESHOLD: int = 5   # module-level constant; change requires ADR update

@dataclass(frozen=True)
class DashboardStatsResult:
    rows: list[DashboardRow]
    total_rows: int

class GetDashboardStatsUseCase:
    def __init__(self, dashboard: DashboardRepository) -> None: ...

    async def execute(
        self, *, uf: str | None = None, sexo: str | None = None, etnia: str | None = None
    ) -> DashboardStatsResult: ...
```

## Logic Walkthrough

```python
async def execute(self, *, uf, sexo, etnia) -> DashboardStatsResult:
    rows = await self._dashboard.get_stats(uf=uf, sexo=sexo, etnia=etnia)

    # K-anonymity enforcement — applied AFTER fetching, BEFORE returning
    for row in rows:
        if row.total_avaliacoes < K_ANONYMITY_THRESHOLD:
            raise LGPDComplianceError(
                f"Dashboard result would expose a group with fewer than "
                f"{K_ANONYMITY_THRESHOLD} evaluations. Response suppressed "
                f"to protect patient privacy (LGPD Art. 12, k-anonymity)."
            )

    return DashboardStatsResult(rows=rows, total_rows=len(rows))
```

**Why the check is here and not in the repository:**
- The repository is a mechanical adapter; compliance policy is a business rule.
- This rule is testable without a database (inject `DashboardRepository` fake).
- Auditable: the constant and the check are co-located in this file.
- See [[ADR-003-k-anonymity-in-use-case-layer]] for full reasoning.

## `DashboardRow` (from repository)

| Field | Source |
|---|---|
| `uf` | Brazilian state code |
| `sexo` | Sex at birth |
| `etnia` | Ethnicity |
| `total_avaliacoes` | Count of evaluations in this demographic group |
| `recomenda_exame_count` | Count where FXS test was recommended |

## Dependencies

- **Internal:** [[file_interfaces_repositories_dashboard_repository_py]],
  [[file_core_exceptions_py]] (`LGPDComplianceError`).
- **External:** stdlib only.

## Consumers

- [[file_presentation_routers_history_py]] (`GET /api/v1/dashboard/stats`)

## Invariants / Pitfalls

- MUST NEVER import `fastapi`.
- The k-anonymity check iterates **ALL** rows — checking only the first is
  insufficient; sub-groups may have different counts.
- The entire response is suppressed if any single row violates the threshold —
  partial suppression was rejected (see [[ADR-003-k-anonymity-in-use-case-layer]]).
- `K_ANONYMITY_THRESHOLD` is a public module-level constant so tests can
  reference it without magic numbers.
- `LGPDComplianceError.code = "lgpd.violation"` is what the client receives
  in the RFC 7807 `"type"` field.

## Related ADRs

- [[ADR-003-k-anonymity-in-use-case-layer]] — why k-anonymity is enforced here.
- [[006_LGPD_PII_Strategy]] — LGPD compliance context.
- [[003_Hexagonal_Architecture_Strategy]] — use case layer independence.

#file #application #use-case #dashboard #lgpd #k-anonymity
