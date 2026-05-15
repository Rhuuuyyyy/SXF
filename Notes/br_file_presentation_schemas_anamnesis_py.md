---
title: anamnesis.py (schemas)
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_schemas_anamnesis_py]]"
file_language: python
path: app/presentation/api/v1/schemas/anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - pydantic
  - openapi
  - anamnesis
  - pt-br
related:
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_interfaces_repositories_checklist_repository_py]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/presentation/api/v1/schemas/anamnesis.py` — Schemas de Request/Response para Anamnese

## Contexto e Propósito

Schemas Pydantic V2 de request e response para os endpoints de anamnese
(avaliação clínica). São a **fonte de verdade do OpenAPI** consumida pelo
time de frontend. Nenhuma lógica de negócio vive aqui — isso pertence a
use cases e services de domínio.

## Logic Breakdown

**Schemas de request:**
- `RespostaSintomaSchema` — uma resposta de sintoma: `sintoma_id`, `presente`
  (bool), `observacao` (string opcional, máx. 500 chars).
- `SubmitAnamnesisRequest` — submissão completa do checklist: `paciente_id`,
  `sessao_id`, `observacoes`, `diagnostico_previo_fxs`, e
  `respostas: list[RespostaSintomaSchema]` (mín. 1 item).

**Schemas de response:**
- `AvaliacaoResponse` — retornado após o cálculo de score: `avaliacao_id`,
  `paciente_id`, `score_final`, `limiar_usado`, `recomenda_exame`,
  `versao_param`, `status`.

Todos os modelos usam `ConfigDict(extra="forbid")` para rejeitar campos
desconhecidos.

## Dependências
- **Externo:** apenas `pydantic`.
- **Interno:** nenhum (camada de presentation — sem imports de domínio).

## Consumidores
- Routers HTTP em `app/presentation/api/v1/routers/` *(Sprint 3)*.
- [[br_file_application_use_cases_submit_anamnesis_py]] (`SubmitAnamnesisRequest`
  passado como command object).
- [[br_file_interfaces_repositories_checklist_repository_py]] (`RespostaSintomaSchema`
  usado para mapeamento de bulk-insert).

## Invariantes / Armadilhas
- `respostas` tem `min_length=1` — previne submissões de checklist vazio.
- `diagnostico_previo_fxs=True` suprime a recomendação de exame na resposta,
  mas a função do banco ainda calcula o score.
- Esses schemas são versionados em `v1/` — mudanças breaking exigem namespace `v2/`.

## ADRs Relacionados
- [[br_005_Integration_Contracts_DTOs]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #presentation #schemas #pydantic #openapi #anamnesis #pt-br
