---
title: submit_anamnesis.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_use_cases_submit_anamnesis_py]]"
file_language: python
path: app/application/use_cases/submit_anamnesis.py
created_date: 2026-05-08
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - anamnesis
  - clinical
  - scoring
  - pt-br
related:
  - "[[br_file_interfaces_repositories_avaliacao_repository_py]]"
  - "[[br_file_interfaces_repositories_checklist_repository_py]]"
  - "[[br_file_domain_services_symptom_scoring_orchestrator_py]]"
  - "[[br_file_application_dtos_anamnesis_py]]"
  - "[[br_file_presentation_routers_anamnesis_py]]"
  - "[[br_file_core_exceptions_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
---

# `app/application/use_cases/submit_anamnesis.py` — SubmitAnamnesisUseCase

## Contexto e Propósito

Orquestra o **caminho crítico de escrita clínica** — o fluxo completo desde
receber um payload de checklist validado até retornar um resultado com score.
É o use case principal do Sprint 2 e o ponto de entrada para o endpoint POST
`/avaliacoes` *(conectado no Sprint 3)*.

Cego a HTTP por design: levanta exceptions de domínio, nunca `HTTPException`.

## Logic Breakdown

**`AnamnesisResult`** — dataclass frozen retornado ao router:
- `avaliacao_id: int`
- `scoring: ScoringResult`

**`SubmitAnamnesisUseCase.execute(request, usuario_id, session)`**:

1. **Criar rascunho** — chama `AvaliacaoRepository.create_rascunho()`;
   obtém `avaliacao_id`.
2. **Abrir log** — chama `AvaliacaoRepository.open_log_analise()` para
   registrar o timestamp de início do preenchimento.
3. **Inserir respostas** — chama `ChecklistRepository.insert_respostas()`;
   bulk-inserta todas as respostas dos sintomas.
4. **Calcular score** — chama `SymptomScoringOrchestrator.execute_scoring()`;
   delega 100% da matemática para `fn_calcular_score_triagem` no banco.
5. **Retornar** — empacota `avaliacao_id` + `ScoringResult` em `AnamnesisResult`.

Todos os cinco passos compartilham a mesma `AsyncSession` (unit of work);
qualquer falha faz rollback da transação inteira via `get_db_session`.

## Dependências
- **Interno:**
  - [[br_file_interfaces_repositories_avaliacao_repository_py]]
  - [[br_file_interfaces_repositories_checklist_repository_py]]
  - [[br_file_domain_services_symptom_scoring_orchestrator_py]]
  - [[br_file_presentation_schemas_anamnesis_py]] (`SubmitAnamnesisRequest`)
- **Externo:** `sqlalchemy.ext.asyncio.AsyncSession`, standard lib apenas.

## Consumidores
- Router HTTP `POST /api/v1/avaliacoes` *(Sprint 3)*.

## Invariantes / Armadilhas
- `DEVE NUNCA` importar `fastapi` — contrato exigido por [[br_dir_app_use_cases]].
- `usuario_id` é inteiro (SERIAL do banco), não o UUID da entidade `User` do
  domínio — é o PK inteiro em `usuarios` do role `nivel_1`.
- O parâmetro `session` é o dono do unit of work; o use case NÃO deve chamar
  `commit()` ou `rollback()` — isso é responsabilidade do `get_db_session`.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]

#file #application #use-case #anamnesis #clinical #scoring #pt-br
