---
title: history.py (schemas)
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_schemas_history_py]]"
file_language: python
path: app/presentation/api/v1/schemas/history.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - history
  - dashboard
  - lgpd
  - pt-br
related:
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_file_application_use_cases_get_patient_history_py]]"
  - "[[br_file_application_use_cases_get_dashboard_stats_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/schemas/history.py` — Schemas de Resposta de Histórico & Dashboard

## Contexto & Propósito

Modelos Pydantic de resposta para os endpoints de histórico do paciente e
dashboard. Restrição LGPD: schemas de dashboard nunca expõem identificadores
individuais de pacientes.

## Logic Breakdown

**Histórico do paciente:**

- `AvaliacaoHistoricoSchema` — um item de avaliação: `avaliacao_id`,
  `data_avaliacao`, `score_final: float | None`, `recomenda_exame: bool | None`.
- `PatientHistoryResponse` — lista paginada: `paciente_id`, `items`, `total`,
  `limit`, `offset`.

**Dashboard:**

- `DashboardRowSchema` — uma linha agregada: dimensões demográficas + métricas
  agregadas (`total_avaliacoes`, `media_score`, `taxa_recomendacao_exame`).
- `DashboardStatsResponse` — coleção + `total_rows` + `k_anonymity_threshold`
  (sempre 5, exposto ao frontend para transparência).

Todos os modelos usam `ConfigDict(extra="forbid")`.

## Dependencies
- **Externas:** `pydantic` v2.

## Consumers
- [[br_file_presentation_routers_history_py]]

## Invariants / Pitfalls
- `DashboardStatsResponse` NÃO DEVE incluir identificadores de nível de
  paciente.
- `k_anonymity_threshold` é exposto na resposta para permitir que frontends
  exibam a política de privacidade aos usuários.

## Related ADRs
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #presentation #schemas #history #dashboard #lgpd #pt-br
