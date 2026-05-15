---
title: dtos/anamnesis.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_dtos_anamnesis_py]]"
file_language: python
path: app/application/dtos/anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - dto
  - anamnesis
  - pt-br
related:
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_interfaces_repositories_checklist_repository_py]]"
  - "[[br_file_presentation_routers_anamnesis_py]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/dtos/anamnesis.py` — DTOs de Aplicação para Anamnese

## Contexto e Propósito

Define os **Data Transfer Objects da camada de aplicação** para o fluxo de
submissão de anamnese. Esses dataclasses frozen desacoplam o use case e os
adapters outbound dos schemas HTTP de presentation (`SubmitAnamnesisRequest`,
`RespostaSintomaSchema`).

O router HTTP traduz schemas Pydantic → DTOs antes de passá-los ao use case.
O use case e os adapters nunca importam de `presentation/`.

## Logic Breakdown

**`ChecklistItemDTO`** — dataclass frozen para uma resposta de sintoma:
- `sintoma_id: int`
- `presente: bool`
- `observacao: str = ""`

**`SubmitAnamnesisDTO`** — dataclass frozen com a submissão completa:
- `paciente_id: int`
- `sessao_id: int`
- `observacoes: str`
- `diagnostico_previo_fxs: bool`
- `respostas: list[ChecklistItemDTO]`

Ambos são `frozen=True` — imutáveis após a construção, seguros para passar
entre camadas.

## Dependências
- **Externo:** apenas standard library (`dataclasses`).
- **Sem imports de framework** — portáveis entre camadas de transporte.

## Consumidores
- [[br_file_application_use_cases_submit_anamnesis_py]] (`SubmitAnamnesisDTO`
  como parâmetro `request` em `execute()`).
- [[br_file_interfaces_repositories_checklist_repository_py]] (`ChecklistItemDTO`
  como tipo dos itens em `insert_respostas()`).
- [[br_file_presentation_routers_anamnesis_py]] (factory `_to_dto()` traduz
  `SubmitAnamnesisRequest` → `SubmitAnamnesisDTO`).

## Invariantes / Armadilhas
- DTOs são agnósticos à camada de transporte — nunca devem importar de
  `fastapi`, `pydantic` ou qualquer schema de presentation.
- O campo `respostas` usa `field(default_factory=list)` porque defaults
  mutáveis em dataclasses exigem uma factory.

## ADRs Relacionados
- [[br_005_Integration_Contracts_DTOs]]
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #application #dto #anamnesis #pt-br
