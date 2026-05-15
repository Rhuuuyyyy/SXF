---
id: file-uc-patient-list
title: "get_patient_list.py (use case)"
type: File
status: Active
language: python
path: app/application/use_cases/get_patient_list.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - patient
  - rbac
  - pagination
  - lgpd
  - sha256
related:
  - "[[file_interfaces_repositories_patient_read_repository_py]]"
  - "[[file_presentation_routers_patients_py]]"
  - "[[file_domain_value_objects_cpf_py]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/get_patient_list.py` — GetPatientListUseCase

## Context & Purpose

Returns a paginated list of patients registered by the authenticated doctor.
HTTP-blind: never imports `fastapi`.

**CPF anonymity rule:** raw CPF digits are hashed to SHA-256 **here** in the
use case — the repository never sees raw CPF digits. See
[[ADR-004-cpf-sha256-anonymization]] for the full decision record.

## Public Surface

```python
@dataclass(frozen=True)
class PatientListResult:
    items: list[PatientListItem]
    total: int
    limit: int
    offset: int

class GetPatientListUseCase:
    HARD_LIMIT: int = 200   # never return unbounded result sets

    def __init__(self, patients: PatientReadRepository) -> None: ...

    async def execute(
        self,
        *,
        usuario_id: int,
        nome_filter: str | None = None,
        cpf_raw_filter: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> PatientListResult: ...
```

## Logic Walkthrough

```python
async def execute(self, *, usuario_id, nome_filter, cpf_raw_filter, limit, offset):
    # 1. Cap page size
    if limit > self.HARD_LIMIT:
        limit = self.HARD_LIMIT

    # 2. Hash CPF — repository never sees raw digits
    cpf_hash_filter: str | None = None
    if cpf_raw_filter:
        cpf_hash_filter = CPF(cpf_raw_filter).sha256_hex   # ValueError if invalid

    # 3. Count for pagination metadata
    total = await self._patients.count_by_doctor(
        usuario_id=usuario_id,
        nome_filter=nome_filter,
        cpf_hash_filter=cpf_hash_filter,
    )

    # 4. Fetch page
    items = await self._patients.list_by_doctor(
        usuario_id=usuario_id,
        nome_filter=nome_filter,
        cpf_hash_filter=cpf_hash_filter,
        limit=limit,
        offset=offset,
    )

    return PatientListResult(items=items, total=total, limit=limit, offset=offset)
```

**Filter semantics:**
- `nome_filter`: passed as-is to the repository for ILIKE `'%<term>%'` matching.
- `cpf_raw_filter`: `CPF(raw).sha256_hex` — validated (11 digits, numeric) AND
  hashed. `ValueError` from invalid format propagates to the router → HTTP 422.
- Both filters combined → AND semantics.

## `PatientListItem` (from repository)

| Field | Type | Source |
|---|---|---|
| `id` | `int` | DB SERIAL PK |
| `nome` | `str` | Decrypted by DB view (PGP key injected by `get_db_session`) |
| `sexo` | `str \| None` | Sex at birth enum value |
| `data_nascimento` | `str \| None` | ISO date string (`TO_CHAR` in SQL) |

## RBAC

RBAC is enforced in the repository: `WHERE criado_por = :usuario_id`. The
`usuario_id` parameter is the authenticated doctor's DB integer PK — extracted
from the JWT `sub` claim by the router and passed to `execute()`.

## Dependencies

- **Internal:** [[file_interfaces_repositories_patient_read_repository_py]],
  [[file_domain_value_objects_cpf_py]] (`CPF.sha256_hex`).
- **External:** stdlib only.

## Consumers

- [[file_presentation_routers_patients_py]] (`GET /api/v1/pacientes`)

## Invariants / Pitfalls

- MUST NEVER import `fastapi`.
- CPF hashing MUST happen here — not in the router or repository. This is
  the single auditable enforcement point (see [[ADR-004-cpf-sha256-anonymization]]).
- `ValueError` from `CPF()` (invalid format) is NOT caught — let it propagate
  to the router which maps it to HTTP 422.
- `HARD_LIMIT = 200` is a class-level constant; the router clamps at a lower
  value (200) via query param constraint — but this is the safety floor.

## Related ADRs

- [[ADR-004-cpf-sha256-anonymization]] — CPF hashing placement rationale.
- [[003_Hexagonal_Architecture_Strategy]] — use case layer independence.
- [[006_LGPD_PII_Strategy]] — CPF PII classification.

#file #application #use-case #patient #rbac #pagination #lgpd #sha256
