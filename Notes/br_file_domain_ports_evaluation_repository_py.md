---
title: evaluation_repository.py (port)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_ports_evaluation_repository_py]]"
file_language: python
path: app/domain/ports/evaluation_repository.py
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
  - evaluation
  - consultation
  - repository
  - pt-br
related:
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_domain_ports_checklist_response_repository_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/domain/ports/evaluation_repository.py` — Port IEvaluationRepository

## Context & Purpose

Contrato de persistência para o aggregate
[[br_file_domain_entities_evaluation_py]]. Dirige os endpoints de
histórico de consulta e dashboard, mais a lista diária de evaluations
pendentes do médico.

## Logic Breakdown

```python
class IEvaluationRepository(Protocol):
    async def get(self, evaluation_id: UUID) -> Evaluation | None: ...
    async def add(self, evaluation: Evaluation) -> Evaluation: ...
    async def update(self, evaluation: Evaluation) -> Evaluation: ...
    async def list_by_patient(
        self, patient_id: UUID
    ) -> list[Evaluation]: ...
    async def list_by_doctor(
        self, doctor_id: UUID, *, limit: int = 50, offset: int = 0,
    ) -> list[Evaluation]: ...
```

Semântica dos métodos:

- **`get`** — lookup por UUID.
- **`add`** — insere um registro de consulta novo.
- **`update`** — usado pelo scoring engine quando `attach_score` roda,
  e pelo médico quando edita notas depois.
- **`list_by_patient`** — histórico cronológico completo para a tela de
  detalhe do paciente. Não paginado em v1; um paciente é improvável de
  ter mais que algumas dezenas de evaluations. Se mudar, adicione
  paginação numa ADR posterior.
- **`list_by_doctor`** — paginado; alimenta a tela "minhas
  consultations" do médico e o dashboard admin.

## Dependencies
- **Internas:** [[br_file_domain_entities_evaluation_py]].
- **Externas:** `typing.Protocol`, `uuid` apenas.

## Consumers
- Futuros `OpenEvaluationUseCase`, `CompleteEvaluationUseCase`,
  `GetPatientHistoryUseCase`, `MyConsultationsUseCase`.
- Adapter futuro de infraestrutura (SQLAlchemy, propriedade do
  [[br_DBA_Team]]).
- Test fakes (`InMemoryEvaluationRepository`).

## Invariants / Pitfalls
- **Um Evaluation é referenciado por um `ChecklistResponse` 1:1.** O
  repositório NÃO faz cascade delete para o response; a camada de
  aplicação orquestra. O Port mantém responsabilidades estreitas.
- **`list_by_patient` retorna em ordem cronológica** (mais antigos
  primeiro por convenção). Adapters que mudem a ordem precisam expor
  isso como parâmetro, não silenciosamente.
- **`update` é substituição completa.** Patches por campo acontecem na
  camada de use case (load, mutar, save).
- **Sem `delete`.** Mesmo raciocínio LGPD dos outros ports — registros
  clínicos são histórico imutável.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #port #protocol #evaluation #repository #pt-br
