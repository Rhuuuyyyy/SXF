---
title: patient.py (model) — ARQUIVADO
type: File
status: Archived
deprecation_date: 2026-05-03
superseded_by: "[[br_file_domain_entities_patient_py]]"
language: pt-BR
mirrors: "[[file_domain_models_patient_py]]"
file_language: python
path: app/domain/models/patient.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - aggregate-root
  - patient
  - fxs
  - archived
  - pt-br
related:
  - "[[br_file_domain_entities_patient_py]]"
---

# `app/domain/models/patient.py` — Aggregate Patient

> **ARQUIVADO em 2026-05-03.** O caminho `app/domain/models/` descrito
> aqui nunca foi implementado. O código ativo vive em
> [[br_file_domain_entities_patient_py]] (`app/domain/entities/patient.py`),
> que usa o layout hexagonal existente (`entities/` em vez de
> `models/`). Leia a nota ativa para comportamento atual; tudo abaixo é
> preservado para contexto histórico.

## Context & Purpose

Modelava o aggregate root Patient — a pessoa sob avaliação para FXS.
Era o **conceito clínico central** do sistema; quase todo use case lê
ou escreve. Como pacientes carregam dados pessoais sensíveis sob
[[br_LGPD]], esta entity também é a **maior superfície PII de risco**;
regras de handling de PII em [[br_006_LGPD_PII_Strategy]] começam aqui.

## Razão do arquivamento

O time decidiu seguir com `app/domain/entities/` ao invés de
`app/domain/models/`. A entity está agora em
[[br_file_domain_entities_patient_py]] com fields equivalentes mais o
helper `age_at(reference)`.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #entity #patient #fxs #archived #pt-br
