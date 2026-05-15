---
title: symptom_repository.py (port)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_ports_symptom_repository_py]]"
file_language: python
path: app/domain/ports/symptom_repository.py
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
  - symptom
  - catalogue
  - repository
  - pt-br
related:
  - "[[br_file_domain_entities_symptom_py]]"
  - "[[br_file_domain_entities_checklist_response_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_009_Scoring_Engine_Design]]"
---

# `app/domain/ports/symptom_repository.py` — Port ISymptomRepository

## Context & Purpose

Contrato de persistência para o catálogo
[[br_file_domain_entities_symptom_py]]. Diferente dos ports
per-paciente em duas formas:

1. **Read-mostly.** O catálogo é carregado uma vez por processo e
   refreshado quando um admin atualiza; latência é dominada por
   leituras, não escritas. Adapters são encorajados (mas não exigidos)
   a memoizar.
2. **Sem PII.** Sintomas descrevem traços, não pessoas, então a postura
   de segurança é muito mais leve que de
   [[br_file_domain_ports_patient_repository_py]].

## Logic Breakdown

```python
class ISymptomRepository(Protocol):
    async def get(self, symptom_id: UUID) -> Symptom | None: ...
    async def get_by_code(self, code: str) -> Symptom | None: ...
    async def list_active(self) -> list[Symptom]: ...
    async def list_by_category(
        self, category: SymptomCategory
    ) -> list[Symptom]: ...
    async def add(self, symptom: Symptom) -> Symptom: ...
    async def update(self, symptom: Symptom) -> Symptom: ...
```

Semântica dos métodos:

- **`get`** — lookup por UUID.
- **`get_by_code`** — caminho de cross-reference de literatura clínica;
  o `code` do catálogo é o identificador externo estável (ex.:
  `PHYS_001`).
- **`list_active`** — usado para renderizar o form de anamnese no FE;
  apenas itens ativos.
- **`list_by_category`** — usado para agrupar itens na UI.
- **`add` / `update`** — caminhos de admin; v1 pode não expor estes
  via HTTP (catálogo gerenciado por migrations ou CLI). O Port mantém
  a forma para que endpoints admin futuros não exijam revisão do
  Port.

## Dependencies
- **Internas:** [[br_file_domain_entities_symptom_py]] (entity + enums).
- **Externas:** `typing.Protocol`, `uuid` apenas.

## Consumers
- Futuros `LoadAnamnesisFormUseCase`, `ListCatalogueUseCase`.
- Futuro `SymptomScoringService` — lê o catálogo no scoring time (ou
  o use case carrega uma vez e passa para o service).
- Adapter futuro de infraestrutura (SQLAlchemy, propriedade do
  [[br_DBA_Team]]).
- Test fakes (`InMemorySymptomRepository`).

## Invariants / Pitfalls
- **Filtro `is_active` é trabalho do adapter** para `list_active`.
  Não empurre para use cases — espalha a política.
- **Cache permitido mas invisível.** Se o adapter cacheia, ele precisa
  invalidar em `add`/`update`. O Port em si não diz nada sobre cache
  — é detalhe de implementação.
- **Codes são case-sensitive** por convenção (`PHYS_001`, não
  `phys_001`). O adapter NÃO PODE normalizar case silenciosamente.
- **Sem `delete`.** Use `update(symptom)` com `is_active=False` para
  preservar referências históricas de `ChecklistResponse`s passadas.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #domain #port #protocol #symptom #catalogue #pt-br
