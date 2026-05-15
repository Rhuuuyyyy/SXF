---
title: avaliacao_repository.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_interfaces_repositories_avaliacao_repository_py]]"
file_language: python
path: app/interfaces/repositories/avaliacao_repository.py
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
  - avaliacao
  - pt-br
related:
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/interfaces/repositories/avaliacao_repository.py` — Adapter Outbound de Avaliação

## Contexto e Propósito

Adapter outbound concreto que interage com a view `avaliacoes` e a tabela
`tb_log_analises`. Gerencia o ciclo de vida de um registro de avaliação
clínica. Usa `sqlalchemy.text()` exclusivamente — sem modelos ORM.

## Logic Breakdown

**`create_rascunho(paciente_id, usuario_id, observacoes, diagnostico_previo_fxs) -> int`**
- Faz INSERT de uma nova avaliação na view `avaliacoes` com `status='rascunho'`
  implícito (definido pelo trigger `INSTEAD OF` no banco).
- Retorna o `avaliacao_id` auto-gerado via `RETURNING id`.

**`open_log_analise(avaliacao_id, usuario_id, sessao_id) -> int`**
- Faz INSERT em `tb_log_analises` para registrar quando o médico abriu o formulário.
- Retorna o id do `log_analise`.
- A função `fn_calcular_score_triagem` fecha esse registro atomicamente.

## Dependências
- **Interno:** [[br_file_db_database_py]] (AsyncSession injetado via construtor).
- **Externo:** `sqlalchemy`.

## Consumidores
- [[br_file_application_use_cases_submit_anamnesis_py]] (Passos 1 e 2 do
  fluxo de anamnese).

## Invariantes / Armadilhas
- Ambos os métodos levantam `RuntimeError` se o banco não retornar linha —
  indica misconfiguration de trigger ou problema de permissão na view.
- A cláusula `RETURNING id` exige que o trigger `INSTEAD OF INSERT` da view
  `avaliacoes` retorne a PK gerada.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]

#file #interfaces #repository #adapter #outbound #avaliacao #pt-br
