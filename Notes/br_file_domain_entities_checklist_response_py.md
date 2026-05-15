---
title: checklist_response.py (entity)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_entities_checklist_response_py]]"
file_language: python
path: app/domain/entities/checklist_response.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - checklist
  - anamnesis
  - aggregate
  - pydantic
  - pt-br
related:
  - "[[br_file_domain_ports_checklist_response_repository_py]]"
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_file_domain_entities_symptom_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_009_Scoring_Engine_Design]]"
---

# `app/domain/entities/checklist_response.py` — Entity ChecklistResponse

## Context & Purpose

Um `ChecklistResponse` é o **formulário de anamnese** preenchido
durante uma [[br_file_domain_entities_evaluation_py]]: respostas
por-sintoma mais o score total computado. Modelado como um aggregate
que possui seus `ChecklistItem`s para que regras de consistência (sem
sintomas duplicados, score monotônico) vivam num único lugar.

A *computação* de score em si pertence a um futuro domain service
([[br_009_Scoring_Engine_Design]] *(planejado)*) para que a entity
permaneça pura de dado + pequenas invariantes. Esta separação permite
re-pontuar retroativamente quando o algoritmo de scoring evoluir.

## Logic Breakdown

Símbolos públicos:

- **`ChecklistItem(BaseModel)`** —
    - `symptom_id: UUID` — referência a uma entrada de catálogo
      [[br_file_domain_entities_symptom_py]].
    - `is_present: bool`.
    - `notes: str` — ≤500 chars; qualifier do médico.
- **`ChecklistResponse(BaseModel)`** —
    - `id: UUID`.
    - `evaluation_id: UUID` — link para
      [[br_file_domain_entities_evaluation_py]].
    - `items: list[ChecklistItem]` — default `[]`.
    - `total_score: int` (≥0) — computado externamente; setado
      explicitamente.
    - `score_band: ScoreBand | None` — mesma de `Evaluation`; ambos
      mantidos por conveniência de query.
    - `submitted_by_user_id: UUID` — link para
      [[br_file_domain_entities_user_py]].
    - `submitted_at: datetime` (UTC).

Comportamentos:

- `add_item(item)` — anexa um `ChecklistItem` e **rejeita duplicatas**
  por `symptom_id`. Sem este guard um médico poderia contar duas
  vezes um sintoma positivo e inflar o score.
- `positive_count: int` (property) — número de itens com
  `is_present=True`. Barato O(n); útil para o card de summary do FE.

## Configuração Pydantic

`ChecklistResponse` usa `validate_assignment=True` para que a
invariante `total_score >= 0` seja re-checada na assignação, não só
na construção.

## Dependencies
- **Internas:** [[br_file_domain_entities_evaluation_py]] — importa
  `ScoreBand` para manter uma definição do enum.
- **Externas:** `pydantic` v2, `datetime`, `uuid`.

## Consumers
- [[br_file_domain_ports_checklist_response_repository_py]] — Port de
  persistência.
- Futuros `SubmitChecklistUseCase`, `ReScoreEvaluationUseCase`.
- Futuro `SymptomScoringService` lê `items` para computar
  `total_score` e `score_band`, então chama `Evaluation.attach_score`.

## Invariants / Pitfalls
- **Sem sintomas duplicados.** `add_item` aplica isso; não bypasse
  mutando `items` diretamente. Uma ADR futura pode mover para um
  `dict` keyed por `symptom_id` para checks O(1).
- **`total_score` é setado externamente**, nunca derivado dentro da
  entity. Mantém a entity scoring-algorithm-agnostic e permite que
  [[br_009_Scoring_Engine_Design]] evolua sem tocar este arquivo.
- **Re-importar `ScoreBand`** de `evaluation` é intencional — mantém
  as bands definidas em um lugar. Não duplique.
- **`notes` em free-text** pode vazar PII; mesma política de redação
  de [[br_file_domain_entities_patient_py]] se aplica antes de logar.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #entity #checklist #anamnesis #pt-br
