---
title: patient_repository.py (port)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_ports_patient_repository_py]]"
file_language: python
path: app/domain/ports/patient_repository.py
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
  - patient
  - repository
  - dba-interface
  - pt-br
related:
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_ports_user_repository_py]]"
  - "[[br_file_domain_ports_evaluation_repository_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/domain/ports/patient_repository.py` — Port IPatientRepository

## Context & Purpose

Contrato de persistência para o aggregate
[[br_file_domain_entities_patient_py]]. Crítico para duas trilhas de
integração:

1. **Time de DBA** implementa este Protocol contra PostgreSQL. CPF é
   armazenado pseudonimizado (HMAC); o adapter precisa hashear antes
   de queries `get_by_cpf`.
2. **Time de Frontend** vê a *forma* indiretamente via response schemas
   que adaptam esta entity. A forma de paging de `list_by_doctor`
   vira o contrato do endpoint de lista de pacientes.

## Logic Breakdown

```python
class IPatientRepository(Protocol):
    async def get(self, patient_id: UUID) -> Patient | None: ...
    async def get_by_cpf(self, cpf: str) -> Patient | None: ...
    async def add(self, patient: Patient) -> Patient: ...
    async def update(self, patient: Patient) -> Patient: ...
    async def list_by_doctor(
        self, doctor_id: UUID, *, limit: int = 50, offset: int = 0,
    ) -> list[Patient]: ...
```

Semântica dos métodos:

- **`get`** — lookup por primary-key; retorna `None` para missing.
- **`get_by_cpf`** — segundo caminho de acesso mais comum
  (encaminhamentos quotam CPF). Adapter DEVE pseudonimizar o input
  antes da query — a coluna nunca armazena CPF cru; ver
  [[br_006_LGPD_PII_Strategy]].
- **`add`** — insere; unicidade de CPF é forçada na camada de
  persistência; o use case traduz o conflict para `ConflictError`.
- **`update`** — substitui campos mutáveis por `id`.
- **`list_by_doctor`** — paginado, escopado pelo doctor que
  registrou. Médicos veem apenas seus próprios pacientes em v1
  (RBAC; ver [[br_009_Authorization_RBAC]] *(planejado)*).

## Dependencies
- **Internas:** [[br_file_domain_entities_patient_py]].
- **Externas:** `typing.Protocol`, `uuid` apenas.

## Consumers
- Futuros `RegisterPatientUseCase`, `GetPatientHistoryUseCase`,
  `ListMyPatientsUseCase`.
- Adapter futuro de infraestrutura (SQLAlchemy, propriedade do
  [[br_DBA_Team]]).
- Test fakes (`InMemoryPatientRepository`).

## Invariants / Pitfalls
- **Pseudonimize CPF antes da query.** Querying com CPF cru derrota o
  esquema de pseudonimização. O contrato do adapter para `get_by_cpf`
  é: *"hashear o input com o pepper configurado, então SELECT"*.
- **Sem `delete`.** Deleção LGPD-compliant é pseudonimizar + arquivar
  — implementado num use case futuro, não no Port.
- **Defaults de paginação são sensatos**, não unbounded. Um
  `limit > 200` deve levantar; esse bound vive no use case futuro.
- **Doctor scoping no Port** intencionalmente — movê-lo para o use
  case permitiria que um caller bugado bypassasse a invariante.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #domain #port #protocol #patient #repository #pt-br
