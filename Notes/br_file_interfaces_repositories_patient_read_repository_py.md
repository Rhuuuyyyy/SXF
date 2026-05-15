---
title: patient_read_repository.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_interfaces_repositories_patient_read_repository_py]]"
file_language: python
path: app/interfaces/repositories/patient_read_repository.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - read-model
  - patient
  - rbac
  - lgpd
  - pt-br
related:
  - "[[br_file_application_use_cases_get_patient_list_py]]"
  - "[[br_file_presentation_routers_patients_py]]"
  - "[[br_file_domain_value_objects_cpf_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
  - "[[br_ADR-001-active-database-pattern]]"
---

# `app/interfaces/repositories/patient_read_repository.py` — Repositório de Leitura de Pacientes

## Contexto & Propósito

Adapter de leitura (porta outbound) para consultas de listagem de pacientes.
Segrega responsabilidades de leitura do lado de escrita
[[br_file_interfaces_repositories_patient_repository_py]], seguindo o princípio
CQRS.

RBAC é aplicado em SQL via `criado_por = :usuario_id` — um médico só pode
listar seus próprios pacientes. Busca por CPF recebe hash SHA-256; dígitos
brutos nunca chegam a esta camada (a responsabilidade do hash é do caso de uso).

## Logic Breakdown

**`PatientListItem`** — dataclass congelada, o DTO de leitura:
- `id: int`
- `nome: str` — descriptografado pela view do DB (chave PGP injetada na sessão)
- `sexo: str | None`
- `data_nascimento: str | None` — string ISO date (formatada via `TO_CHAR` no DB)

**`PatientReadRepository`**

- `__init__(self, session: AsyncSession)` — sessão async com escopo de request.

- `list_by_doctor(*, usuario_id, nome_filter, cpf_hash_filter, limit, offset) -> list[PatientListItem]`
  - `WHERE criado_por = :usuario_id` sempre presente (RBAC).
  - `nome_filter`: acrescenta `nome ILIKE :nome_filter` com `%termo%`.
  - `cpf_hash_filter`: acrescenta `cpf_hash = :cpf_hash_filter` (match exato SHA-256).
  - `ORDER BY nome ASC LIMIT :limit OFFSET :offset`.

- `count_by_doctor(*, usuario_id, nome_filter, cpf_hash_filter) -> int`
  - Mesma construção de WHERE, sem LIMIT/OFFSET.
  - Usado para metadados de paginação.

## Dependências
- **Internas:** stdlib (`dataclasses`); SQLAlchemy async.
- **Externas:** `sqlalchemy[asyncio]`.

## Consumidores
- [[br_file_application_use_cases_get_patient_list_py]]

## Invariantes / Armadilhas
- A condição `criado_por = :usuario_id` DEVE estar presente em toda query —
  removê-la vaza pacientes de outros médicos.
- O parâmetro de filtro chama-se **`cpf_hash_filter`** (não `cpf_filter`).
  Recebe string SHA-256 hex, NUNCA dígitos brutos do CPF. O hash é
  responsabilidade do caso de uso ([[br_ADR-004-cpf-sha256-anonymization]]).
- `nome` é retornado descriptografado pela view do DB. A chave PGP é injetada
  na sessão por `get_db_session()` antes do yield
  ([[br_ADR-001-active-database-pattern]]).

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_ADR-004-cpf-sha256-anonymization]]
- [[br_ADR-001-active-database-pattern]]

#file #interfaces #repository #read-model #patient #rbac #lgpd #pt-br
