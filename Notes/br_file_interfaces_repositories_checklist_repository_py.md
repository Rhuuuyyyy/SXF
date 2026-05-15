---
title: checklist_repository.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_interfaces_repositories_checklist_repository_py]]"
file_language: python
path: app/interfaces/repositories/checklist_repository.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - adapter
  - outbound
  - checklist
  - pt-br
related:
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_presentation_schemas_anamnesis_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/interfaces/repositories/checklist_repository.py` — Adapter Outbound de Checklist

## Contexto e Propósito

Adapter outbound concreto que faz bulk-insert das respostas por sintoma de
uma avaliação clínica em `respostas_checklist`. Usa `sqlalchemy.text()`
exclusivamente.

## Logic Breakdown

**`insert_respostas(avaliacao_id, respostas) -> None`**
- Itera sobre `list[RespostaSintomaSchema]` e emite um INSERT parametrizado
  por resposta de sintoma.
- Campos escritos: `avaliacao_id`, `sintoma_id`, `presente`, `observacao`.
- Sem retorno — chamado por efeito colateral dentro do unit of work.

> **Otimização futura:** substituir o loop por um bulk `INSERT ... VALUES`
> usando `executemany` ou `UNNEST` do Postgres se o tamanho do checklist
> crescer acima de ~50 sintomas.

## Dependências
- **Interno:**
  - [[br_file_db_database_py]] (AsyncSession injetado via construtor).
  - [[br_file_presentation_schemas_anamnesis_py]] (`RespostaSintomaSchema`).
- **Externo:** `sqlalchemy`.

## Consumidores
- [[br_file_application_use_cases_submit_anamnesis_py]] (Passo 3 do fluxo
  de anamnese).

## Invariantes / Armadilhas
- Roda dentro da mesma `AsyncSession` que `AvaliacaoRepository` — todos os
  inserts fazem parte de um único unit of work comitado por `get_db_session`.
- Se qualquer INSERT falhar (ex.: violação de FK em `sintoma_id`), a transação
  inteira faz rollback automaticamente.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #interfaces #repository #adapter #outbound #checklist #pt-br
