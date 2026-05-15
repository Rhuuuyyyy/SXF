---
id: ADR-003
title: "K-Anonymity Enforcement in the Application Use Case Layer"
status: accepted
date: 2026-05-11
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - lgpd
  - k-anonymity
  - privacy
  - use-case
related:
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[file_interfaces_repositories_dashboard_repository_py]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[file_presentation_routers_history_py]]"
---

# ADR-003 — K-Anonymity Enforcement in the Application Use Case Layer

## Status

**Accepted** — 2026-05-11

---

## Context

The `/dashboard/stats` endpoint aggregates patient data grouped by demographic
segments (UF, sex, ethnicity). Returning a row that represents only one or two
patients allows a caller to correlate the statistics back to specific
individuals — a re-identification attack forbidden by LGPD Article 12 and the
clinical research protocol governing this system.

A k-anonymity threshold (`K = 5`) was agreed with the clinical research team:
any statistical row that represents fewer than 5 evaluations must be suppressed.

Three layers were considered as the home for this check:

1. **Database layer** — add a `HAVING total_avaliacoes >= 5` clause to
   `vw_dashboard_anonimizado`.
2. **Repository layer** — filter rows inside `DashboardRepository.get_stats()`.
3. **Application use case layer** — check in `GetDashboardStatsUseCase.execute()`
   after fetching, raise `LGPDComplianceError` if any row violates the threshold.

---

## Decision

The k-anonymity threshold is enforced **in the application use case layer**,
inside `GetDashboardStatsUseCase.execute()`, after the repository returns all
rows.

The constant `K_ANONYMITY_THRESHOLD: int = 5` is defined at module level in
`app/application/use_cases/get_dashboard_stats.py` with a comment that any
change requires an ADR update.

```python
K_ANONYMITY_THRESHOLD: int = 5

for row in rows:
    if row.total_avaliacoes < K_ANONYMITY_THRESHOLD:
        raise LGPDComplianceError(
            f"Dashboard result would expose a group with fewer than "
            f"{K_ANONYMITY_THRESHOLD} evaluations. Response suppressed "
            f"to protect patient privacy (LGPD Art. 12, k-anonymity)."
        )
```

The router catches `LGPDComplianceError` via the global exception handler
defined in `main.py` and returns HTTP 422 with an RFC 7807 body.

---

## Consequences

**Positive:**

- The compliance rule is **unit-testable in pure Python** without a database.
  Tests inject a `DashboardRepository` fake that returns controlled rows.
- The threshold constant is visible and auditable in Python source — not
  buried in a SQL view definition that requires DB access to read.
- `LGPDComplianceError` is a typed domain exception; the global handler
  translates it uniformly across all call sites.
- Changing the threshold value requires modifying one constant in one file and
  adding a new ADR — the protocol is explicit.

**Negative:**

- The database still performs the aggregation and returns rows that may be
  immediately suppressed. One additional round-trip could be saved by pushing
  the filter to SQL `HAVING`. For the expected data volumes this is acceptable.
- If `vw_dashboard_anonimizado` is queried by another path that bypasses the
  use case, the k-anonymity check will not apply. Access to the view must be
  restricted to the use case.

---

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| SQL `HAVING total_avaliacoes >= 5` in the view | Cannot raise a typed domain exception; returns empty results silently, which could mask a misconfiguration. Not unit-testable. |
| Filter in `DashboardRepository` | The repository is an infrastructure adapter; it should not contain compliance policy. Mixing layers violates hexagonal boundaries. |
| Inline check in the router | Routers must not contain business logic (ADR-005 invariant). |

---

## Implementation Notes

- `GetDashboardStatsUseCase` in `app/application/use_cases/get_dashboard_stats.py`.
- `K_ANONYMITY_THRESHOLD` is imported and checked in a `for` loop — checking
  ALL rows ensures no sub-group is inadvertently exposed.
- The entire response is suppressed when any row violates the threshold — partial
  suppression (returning only passing rows) was rejected because it would still
  allow inference about the suppressed segments.

#adr #lgpd #k-anonymity #privacy #use-case
