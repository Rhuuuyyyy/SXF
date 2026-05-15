---
title: evaluation.py (entity)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_entities_evaluation_py]]"
file_language: python
path: app/domain/entities/evaluation.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - evaluation
  - consultation
  - clinical
  - pydantic
  - pt-br
related:
  - "[[br_file_domain_ports_evaluation_repository_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_domain_entities_checklist_response_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_009_Scoring_Engine_Design]]"
---

# `app/domain/entities/evaluation.py` — Entity Evaluation

## Context & Purpose

Um `Evaluation` representa **uma consulta** entre um médico e um
paciente. É o envelope clínico ao redor das observações qualitativas
que o médico registra e do resultado quantitativo derivado do
[[br_file_domain_entities_checklist_response_py]].

Separar `Evaluation` de `ChecklistResponse` permite:

- Manter o envelope da consulta visível mesmo antes do checklist ser
  preenchido (um médico pode registrar a visita e completar o form
  depois).
- Re-pontuar evaluations históricas quando o catálogo muda
  ([[br_009_Scoring_Engine_Design]] *(planejado)*).
- Modelar artefatos clínicos futuros (pedidos de lab, notas de
  follow-up) anexados ao Evaluation sem inflar o aggregate de
  checklist.

## Logic Breakdown

Símbolos públicos:

- **`ScoreBand(StrEnum)`** — `low` | `moderate` | `high`. O output
  discreto do scoring engine; o FE renderiza como banda colorida na
  tela de result.
- **`Recommendation(StrEnum)`** — `none` | `follow_up` | `genetic_test`
  | `therapy_referral`. Alinha com os outputs de suporte à decisão
  clínica descritos em [[br_001_Architecture_and_Context]].
- **`Evaluation(BaseModel)`** —
    - `id: UUID`.
    - `patient_id: UUID` — link para
      [[br_file_domain_entities_patient_py]].
    - `doctor_id: UUID` — link para [[br_file_domain_entities_user_py]]
      com role `DOCTOR`.
    - `consultation_date: datetime`.
    - `chief_complaint: str` — ≤2000 chars, free text opcional.
    - `clinical_observations: str` — ≤4000 chars, free text opcional.
    - `score_value: int | None` — não-negativo; nullable até o scoring
      rodar.
    - `score_band: ScoreBand | None` — setado junto com `score_value`.
    - `recommendation: Recommendation` — default `NONE`.
    - `created_at`, `updated_at: datetime` (UTC).

Comportamentos:

- `attach_score(value, band, recommendation)` — API keyword-only; o
  scoring service é o *único* caller legítimo. Seta a tripla
  atomicamente e bumpa `updated_at`.
- `is_scored: bool` (property) — true sse ambos `score_value` e
  `score_band` estão presentes. Use isso ao invés de testar `None`
  ad-hoc nos call sites.

## Dependencies
- **Internas:** nenhuma.
- **Externas:** `pydantic` v2, `enum.StrEnum`, `datetime`, `uuid`.

## Consumers
- [[br_file_domain_ports_evaluation_repository_py]] — Port de
  persistência.
- [[br_file_domain_entities_checklist_response_py]] (linka via
  `evaluation_id`).
- Futuros `SubmitEvaluationUseCase`, `ReviewEvaluationUseCase`.
- Futuro `SymptomScoringService` — chama `attach_score` após
  computação.

## Invariants / Pitfalls
- **A tripla de score é atômica.** Setar qualquer um de `score_value`,
  `score_band`, `recommendation` fora de `attach_score` arrisca um
  estado inconsistente (ex.: value presente, band faltando). Prefira
  `attach_score`.
- **`updated_at` é bumpado apenas por `attach_score`.** Mutações
  futuras (raras) precisam seguir o mesmo padrão ou virar um método
  dedicado.
- **Free-text fields são PII-adjacente.** `chief_complaint` e
  `clinical_observations` podem conter info sensível — mesmas regras
  de redação de [[br_file_domain_entities_patient_py]] (ver
  [[br_006_LGPD_PII_Strategy]]).
- **Identidade do médico é por id**, não embedded. Joins acontecem no
  repositório ou em um use case que precise da row de User.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #entity #evaluation #clinical #pt-br
