---
id: file-repo-patient-read
title: "patient_read_repository.py (interface)"
type: File
status: Active
language: python
path: app/interfaces/repositories/patient_read_repository.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - read-model
  - patient
  - rbac
  - lgpd
  - sha256
related:
  - "[[file_application_use_cases_get_patient_list_py]]"
  - "[[file_presentation_routers_patients_py]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
  - "[[ADR-001-active-database-pattern]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/interfaces/repositories/patient_read_repository.py` — Patient List Read Adapter

## Context & Purpose

Read-only adapter for patient listing queries. Segregates read concerns from
the write-side [[file_interfaces_repositories_patient_repository_py]].

RBAC is enforced in SQL via `WHERE criado_por = :usuario_id` — a doctor can
only list their own patients. CPF search receives a SHA-256 hex string; raw
CPF digits never reach this layer — hashing is the use case's responsibility
(see [[ADR-004-cpf-sha256-anonymization]]).

## Public Surface

```python
@dataclass(frozen=True)
class PatientListItem:
    id: int
    nome: str           # decrypted by the DB view (PGP key from get_db_session)
    sexo: str | None
    data_nascimento: str | None   # ISO date string via TO_CHAR in SQL

class PatientReadRepository:
    def __init__(self, session: AsyncSession) -> None: ...

    async def list_by_doctor(
        self,
        *,
        usuario_id: int,
        nome_filter: str | None = None,
        cpf_hash_filter: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PatientListItem]: ...

    async def count_by_doctor(
        self,
        *,
        usuario_id: int,
        nome_filter: str | None = None,
        cpf_hash_filter: str | None = None,
    ) -> int: ...
```

## Logic Walkthrough

### `list_by_doctor()`

```python
conditions = ["criado_por = :usuario_id"]   # RBAC — always present
params = {"usuario_id": usuario_id, "limit": limit, "offset": offset}

if nome_filter:
    conditions.append("nome ILIKE :nome_filter")
    params["nome_filter"] = f"%{nome_filter}%"
if cpf_hash_filter:
    conditions.append("cpf_hash = :cpf_hash_filter")
    params["cpf_hash_filter"] = cpf_hash_filter

where_clause = " AND ".join(conditions)
```

```sql
SELECT id, nome, sexo, TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento
FROM   pacientes
WHERE  <where_clause>
ORDER  BY nome ASC
LIMIT  :limit OFFSET :offset
```

- **RBAC**: `criado_por = :usuario_id` is the first condition and always present.
- **Name search**: `ILIKE '%term%'` — case-insensitive, partial match.
- **CPF search**: exact match on `cpf_hash` column (SHA-256 hex).
- **Decryption**: `nome` is returned decrypted by the `pacientes` view — PGP
  decryption happens transparently using the key injected by `get_db_session()`.

### `count_by_doctor()`

Same WHERE clause construction; returns `COUNT(*) AS total`. Used for
pagination metadata (`PatientListResult.total`).

## Dependencies

- **External:** `sqlalchemy[asyncio]` (`text`, `AsyncSession`).
- **Internal:** none (pure infrastructure adapter).

## Consumers

- [[file_application_use_cases_get_patient_list_py]]

## Invariants / Pitfalls

- `criado_por = :usuario_id` MUST be the first condition in every query.
  Removing it leaks patient records from other doctors.
- `cpf_hash_filter` MUST be a SHA-256 hex string, never raw CPF digits. The
  parameter name makes the contract explicit. Violation would produce zero
  results (hash mismatch) without raising an error.
- `nome` decryption depends on the PGP key being injected by `get_db_session()`
  before this query runs. If called outside that context, the DB trigger would
  fail with a missing config setting error.
- `data_nascimento` is formatted as `'YYYY-MM-DD'` by `TO_CHAR` in the SQL —
  the Python layer receives a string, not a `date` object.

## Related ADRs

- [[ADR-004-cpf-sha256-anonymization]] — why `cpf_hash_filter`, not raw CPF.
- [[ADR-001-active-database-pattern]] — why `nome` is decrypted by the view.
- [[003_Hexagonal_Architecture_Strategy]] — adapter mechanical role.

#file #interfaces #repository #read-model #patient #rbac #lgpd #sha256
