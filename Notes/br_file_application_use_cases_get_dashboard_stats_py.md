---
title: get_dashboard_stats.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_use_cases_get_dashboard_stats_py]]"
file_language: python
path: app/application/use_cases/get_dashboard_stats.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - dashboard
  - lgpd
  - k-anonymity
  - pt-br
related:
  - "[[br_file_interfaces_repositories_dashboard_repository_py]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_file_core_exceptions_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/get_dashboard_stats.py` — GetDashboardStatsUseCase

## Contexto & Propósito

Busca estatísticas anonimizadas da view materializada `vw_dashboard_anonimizado`
e aplica a **política de k-anonimato** exigida pelo LGPD Art. 12 e pelo
protocolo de pesquisa clínica.

Se qualquer linha retornada tiver `total_avaliacoes < K_ANONYMITY_THRESHOLD`
(5), a resposta inteira é bloqueada elevando `LGPDComplianceError` — mapeada
para HTTP 422 pelo handler global de exceções em
[[br_file_root_main_py]].

## Logic Breakdown

**`K_ANONYMITY_THRESHOLD = 5`** — constante de módulo. Alterar este valor
requer uma nova ADR.

**`DashboardStatsResult`** — dataclass congelada:
- `rows: list[DashboardRow]`, `total_rows: int`

**`GetDashboardStatsUseCase.execute(*, uf, sexo, etnia)`**:

1. Chama `DashboardRepository.get_stats(uf, sexo, etnia)`.
2. Itera as linhas; se alguma `row.total_avaliacoes < 5` → eleva
   `LGPDComplianceError`.
3. Retorna `DashboardStatsResult`.

**Por que o k-anonimato é verificado aqui e não no repositório:**
O repositório é um adapter mecânico. Esta política é uma regra de negócio que:
- Pode mudar sem tocar o adapter de DB.
- É testável sem banco de dados.
- É auditável como decisão de design neste arquivo.

## Dependencies
- **Internas:** [[br_file_interfaces_repositories_dashboard_repository_py]],
  [[br_file_core_exceptions_py]] (`LGPDComplianceError`).
- **Externas:** apenas stdlib.

## Consumers
- [[br_file_presentation_routers_history_py]]

## Invariants / Pitfalls
- NUNCA importar `fastapi`.
- A checagem de k-anonimato é aplicada APÓS buscar TODAS as linhas —
  verificar apenas a primeira linha é insuficiente se subgrupos tiverem
  contagens diferentes.
- `K_ANONYMITY_THRESHOLD` é uma constante pública para que testes possam
  referenciá-la.

## Related ADRs
- [[br_006_LGPD_PII_Strategy]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #application #use-case #dashboard #lgpd #k-anonymity #pt-br
