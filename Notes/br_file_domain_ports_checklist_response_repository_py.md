---
title: checklist_response_repository.py (port)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_ports_checklist_response_repository_py]]"
file_language: python
path: app/domain/ports/checklist_response_repository.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - port
  - protocol
  - checklist
  - anamnesis
  - repository
  - pt-br
related:
  - "[[br_file_domain_entities_checklist_response_py]]"
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_file_domain_ports_evaluation_repository_py]]"
  - "[[br_file_domain_ports_symptom_repository_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_009_Scoring_Engine_Design]]"
---

# `app/domain/ports/checklist_response_repository.py` — Port IChecklistResponseRepository

## Context & Purpose

Contrato de persistência para o aggregate
[[br_file_domain_entities_checklist_response_py]]. O menor dos ports de
repositório porque a entity é 1:1 com
[[br_file_domain_entities_evaluation_py]] — não há endpoint de
listagem que retorna múltiplos responses; o response é sempre buscado
via sua evaluation.

## Logic Breakdown

```python
class IChecklistResponseRepository(Protocol):
    async def get(self, response_id: UUID) -> ChecklistResponse | None: ...
    async def get_by_evaluation(
        self, evaluation_id: UUID
    ) -> ChecklistResponse | None: ...
    async def add(self, response: ChecklistResponse) -> ChecklistResponse: ...
    async def update(self, response: ChecklistResponse) -> ChecklistResponse: ...
```

Semântica dos métodos:

- **`get`** — lookup por UUID; raro, mais admin/audit.
- **`get_by_evaluation`** — caminho de acesso canônico; uma evaluation
  tem exatamente um response.
- **`add`** — insere; unicidade em `evaluation_id` forçada na camada
  de persistência (um response por evaluation).
- **`update`** — substitui a lista de items e o score recomputado após
  re-scoring. Não exposto via HTTP em v1; só o scoring engine chama.

## Dependencies
- **Internas:** [[br_file_domain_entities_checklist_response_py]].
- **Externas:** `typing.Protocol`, `uuid` apenas.

## Consumers
- Futuros `SubmitChecklistUseCase`, `ReScoreEvaluationUseCase`.
- Futuro `SymptomScoringService` — lê via `get_by_evaluation`,
  escreve via `update`.
- Adapter futuro de infraestrutura (SQLAlchemy, propriedade do
  [[br_DBA_Team]]).
- Test fakes (`InMemoryChecklistResponseRepository`).

## Invariants / Pitfalls
- **Um response por evaluation.** Adapters DEVEM forçar unicidade em
  `evaluation_id`; submissão dupla corromperia silenciosamente o
  histórico de scoring.
- **Sem `delete`.** O form é parte do registro clínico; deleção é
  feita no nível do evaluation (e está em si ausente do Port — ver
  [[br_file_domain_ports_evaluation_repository_py]]).
- **`add` é idempotente na camada de use case**, não no Port — o use
  case decide se re-submissão é tratada como `update` ou como
  conflict. O Port permanece mecânico.
- **Ordem de `items` é preservada** pelo adapter; o FE renderiza em
  ordem de inserção. Adapters SQL usando `JSONB` ganham isso de graça;
  adapters row-per-item precisam de coluna explícita de sort.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #port #protocol #checklist #repository #pt-br
