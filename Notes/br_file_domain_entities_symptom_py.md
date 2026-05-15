---
title: symptom.py (entity)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_entities_symptom_py]]"
file_language: python
path: app/domain/entities/symptom.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - symptom
  - catalogue
  - fxs
  - pydantic
  - pt-br
related:
  - "[[br_file_domain_ports_symptom_repository_py]]"
  - "[[br_file_domain_entities_checklist_response_py]]"
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_009_Scoring_Engine_Design]]"
---

# `app/domain/entities/symptom.py` — Entity de Catálogo de Sintomas

## Context & Purpose

Um `Symptom` é uma **entrada de catálogo** no questionário de anamnese
FXS — uma característica que o médico marca como presente/ausente em
um [[br_file_domain_entities_checklist_response_py]]. O catálogo é
**read-mostly**: clínicos introduzem novos sintomas ocasionalmente; a
superfície HTTP de v1 não expõe criação a usuários finais.

Sintomas são *objetos de domínio first-class*, não strings mágicas,
porque:

1. **Versionamento.** Quando o `weight` de um sintoma muda, toda
   evaluation passada precisa permanecer reproduzível. O id pina a
   regra a uma row de entity específica.
2. **Suporte à decisão.** O futuro `SymptomScoringService` lê o
   catálogo no momento do scoring; tratar sintomas como dado evita
   hardcodar o protocolo científico em código.
3. **Localização / atualizações clínicas** sem redeploy.

## Logic Breakdown

Símbolos públicos:

- **`SymptomCategory(StrEnum)`** — `physical` | `behavioral` |
  `cognitive` | `family_history`. Agrupamento top-level que o FE
  renderiza.
- **`AgeRelevance(StrEnum)`** — `pediatric` | `adult` | `any`. O cutoff
  de aplicabilidade é 18 anos (ver `applies_to_age`).
- **`Symptom(BaseModel)`** —
    - `id: UUID`.
    - `code: str` — identificador externo estável (ex.: `PHYS_001`),
      1–32 chars. Usado por literatura clínica/cross-references.
    - `name: str` — label human-readable, 2–120 chars.
    - `description: str` — long form (≤2000 chars), default vazio.
    - `category: SymptomCategory`.
    - `weight: int` — contribuição de risco, inteiro 0–10. Bounded
      para que o score total tenha um teto determinístico por
      evaluation.
    - `age_relevance: AgeRelevance` — default `ANY`.
    - `is_active: bool` — soft-disable; o catálogo guarda histórico.

Comportamento:

- `applies_to_age(age_years: int) -> bool` — helper de gating usado
  pelo futuro `SymptomScoringService` para que itens só pediátricos não
  poluam scores de adultos e vice-versa.

## Dependencies
- **Internas:** nenhuma.
- **Externas:** `pydantic` v2, `enum.StrEnum`, `uuid`.

## Consumers
- [[br_file_domain_ports_symptom_repository_py]] — Port de persistência.
- [[br_file_domain_entities_checklist_response_py]] — referencia
  sintomas por `symptom_id`.
- Futuro `SymptomScoringService` (domain service).

## Invariants / Pitfalls
- **`weight` é bounded 0–10** por design. Não afrouxe o limite superior
  sem revisitar os thresholds de banding do scoring engine em
  [[br_009_Scoring_Engine_Design]] *(planejado)*.
- **Soft-disable, nunca hard-delete.** Deletar um sintoma quebraria a
  reprodutibilidade de `Evaluation`s passadas que referenciaram. O
  método `update` do Port é o caminho de desativação.
- **`code` deve ser tratado como imutável** uma vez que uma entrada foi
  usada em qualquer `ChecklistResponse`. Renomear um code
  retroativamente muda significado de respostas históricas.
- O cutoff de idade de 18 é política, não biologia — mude em
  `applies_to_age` e adicione uma ADR se o time clínico pedir.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #entity #symptom #catalogue #pt-br
