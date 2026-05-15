---
title: avaliacao_read_repository.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_interfaces_repositories_avaliacao_read_repository_py]]"
file_language: python
path: app/interfaces/repositories/avaliacao_read_repository.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - read-model
  - history
  - rbac
  - pt-br
related:
  - "[[br_file_application_use_cases_get_patient_history_py]]"
  - "[[br_file_presentation_routers_history_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
---

# `app/interfaces/repositories/avaliacao_read_repository.py` — Repositório de Leitura de Avaliações

## Contexto & Propósito

Adapter de leitura (outbound) para o histórico de avaliações clínicas de um
paciente. Retorna dataclasses leves e congeladas — não entidades de domínio
completas. Segrega responsabilidades de leitura e escrita (CQRS leve) em
relação ao [[br_file_interfaces_repositories_avaliacao_repository_py]] de
escrita.

RBAC é aplicado na camada SQL via JOIN na coluna `pacientes.criado_por`:
apenas avaliações pertencentes a pacientes criados pelo médico autenticado
são retornadas.

## Logic Breakdown

**`AvaliacaoHistoricoItem`** — dataclass congelada, o DTO de leitura:
- `avaliacao_id: int`
- `paciente_id: int`
- `usuario_id: int`
- `data_avaliacao: datetime`
- `score_final: float | None`
- `recomenda_exame: bool | None`

**`AvaliacaoReadRepository`**

- `__init__(self, session: AsyncSession)` — recebe a sessão SQLAlchemy assíncrona.

- `list_by_paciente(*, paciente_id, usuario_id, limit, offset) -> list[AvaliacaoHistoricoItem]`
  - Executa `SELECT ... FROM avaliacoes a JOIN pacientes p ON p.id = a.paciente_id`
    `WHERE a.paciente_id = :paciente_id AND p.criado_por = :usuario_id`
    `ORDER BY data_avaliacao ASC LIMIT :limit OFFSET :offset`.
  - RBAC embutido: o JOIN filtra automaticamente avaliações de outros médicos.
  - `RowMapping` do SQLAlchemy é convertido via `cast()` para satisfazer o mypy.

- `count_by_paciente(*, paciente_id, usuario_id) -> int`
  - Executa `SELECT COUNT(*) AS total FROM avaliacoes a JOIN pacientes p ...`
    (mesmos filtros RBAC, sem LIMIT/OFFSET).
  - Usado pelo caso de uso para construir metadados de paginação.

## Dependencies
- **Internas:** stdlib (`dataclasses`, `datetime`); SQLAlchemy async.
- **Externas:** `sqlalchemy[asyncio]`.

## Consumers
- [[br_file_application_use_cases_get_patient_history_py]]

## Invariants / Pitfalls
- NUNCA retornar entidades de domínio — apenas DTOs de leitura leves.
- O filtro RBAC (`p.criado_por = :usuario_id`) DEVE estar presente em ambas
  as queries; removê-lo vaza dados de pacientes de outros médicos.
- `score_final` e `recomenda_exame` podem ser `None` se o cálculo de score
  falhou ou ainda não rodou.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]

#file #interfaces #repository #read-model #history #rbac #pt-br
