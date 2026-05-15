---
title: history.py (schemas)
type: File
status: Active
language: python
path: app/presentation/api/v1/schemas/history.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - history
  - dashboard
  - lgpd
related:
  - "[[file_presentation_routers_history_py]]"
  - "[[file_application_use_cases_get_patient_history_py]]"
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/schemas/history.py` — History & Dashboard Response Schemas

## Context & Purpose

Pydantic response models for patient history and dashboard endpoints. LGPD
constraint: dashboard schemas never expose individual patient identifiers.

## Logic Breakdown

**Patient history:**

- `AvaliacaoHistoricoSchema` — one evaluation item: `avaliacao_id`, `data_avaliacao`,
  `score_final: float | None`, `recomenda_exame: bool | None`.
- `PatientHistoryResponse` — paginated list: `paciente_id`, `items`, `total`,
  `limit`, `offset`.

**Dashboard:**

- `DashboardRowSchema` — one aggregated row: demographic dimensions + aggregate
  metrics (`total_avaliacoes`, `media_score`, `taxa_recomendacao_exame`).
- `DashboardStatsResponse` — collection + `total_rows` + `k_anonymity_threshold`
  (always 5, surfaced to the frontend for transparency).

All models use `ConfigDict(extra="forbid")`.

## Dependencies
- **External:** `pydantic` v2.

## Consumers
- [[file_presentation_routers_history_py]]

## Invariants / Pitfalls
- `DashboardStatsResponse` MUST NOT include patient-level identifiers.
- `k_anonymity_threshold` is surfaced in the response to allow frontends to
  display the privacy policy to users.

## Related ADRs
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]

#file #presentation #schemas #history #dashboard #lgpd
