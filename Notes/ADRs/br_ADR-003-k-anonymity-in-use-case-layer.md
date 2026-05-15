---
id: ADR-003
title: "Aplicação de K-Anonimato na Camada de Caso de Uso"
status: accepted
date: 2026-05-11
language: pt-BR
mirrors: "[[ADR-003-k-anonymity-in-use-case-layer]]"
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - lgpd
  - k-anonimato
  - privacidade
  - caso-de-uso
  - pt-br
related:
  - "[[br_file_application_use_cases_get_dashboard_stats_py]]"
  - "[[br_file_interfaces_repositories_dashboard_repository_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_file_presentation_routers_history_py]]"
---

# ADR-003 — Aplicação de K-Anonimato na Camada de Caso de Uso

## Status

**Aceito** — 2026-05-11

---

## Contexto

O endpoint `/dashboard/stats` agrega dados de pacientes agrupados por segmentos
demográficos (UF, sexo, etnia). Retornar uma linha que representa apenas um ou
dois pacientes permite que um chamador correlacione as estatísticas a
indivíduos específicos — um ataque de re-identificação proibido pelo Art. 12
da LGPD e pelo protocolo de pesquisa clínica que rege este sistema.

Um limiar de k-anonimato (`K = 5`) foi acordado com a equipe de pesquisa
clínica: qualquer linha estatística que represente menos de 5 avaliações deve
ser suprimida.

---

## Decisão

O limiar de k-anonimato é aplicado na **camada de caso de uso da aplicação**,
dentro de `GetDashboardStatsUseCase.execute()`, após o repositório retornar
todas as linhas.

A constante `K_ANONYMITY_THRESHOLD: int = 5` é definida no nível do módulo em
`app/application/use_cases/get_dashboard_stats.py` com um comentário de que
qualquer alteração requer uma atualização de ADR.

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

O router captura `LGPDComplianceError` via o handler de exceção global definido
em `main.py` e retorna HTTP 422 com um corpo RFC 7807.

---

## Consequências

**Positivas:**

- A regra de conformidade é **testável em Python puro** sem banco de dados.
- A constante de limiar é visível e auditável no código-fonte Python — não
  enterrada em uma definição de view SQL.
- `LGPDComplianceError` é uma exceção de domínio tipada; o handler global a
  traduz uniformemente.

**Negativas:**

- O banco de dados ainda realiza a agregação e retorna linhas que podem ser
  imediatamente suprimidas.
- Se `vw_dashboard_anonimizado` for consultada por outro caminho que ignore o
  caso de uso, a verificação de k-anonimato não será aplicada.

---

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| SQL `HAVING total_avaliacoes >= 5` na view | Não pode levantar uma exceção de domínio tipada; retorna resultados vazios silenciosamente. Não testável em unidade. |
| Filtrar em `DashboardRepository` | O repositório é um adaptador de infraestrutura; não deve conter política de conformidade. |
| Verificação inline no router | Routers não devem conter lógica de negócio. |

#adr #lgpd #k-anonimato #privacidade #caso-de-uso #pt-br
