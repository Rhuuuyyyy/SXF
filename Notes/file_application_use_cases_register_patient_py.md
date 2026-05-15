---
id: file-uc-register-patient
title: "register_patient.py (use case)"
type: File
status: Active
language: python
path: app/application/use_cases/register_patient.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - patient
  - registration
related:
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_interfaces_repositories_acompanhante_repository_py]]"
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_entities_acompanhante_py]]"
  - "[[file_presentation_schemas_patient_py]]"
  - "[[file_presentation_routers_patients_py]]"
  - "[[ADR-005-uuid-to-serial-resolution]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/application/use_cases/register_patient.py` — RegisterPatientUseCase

## Context & Purpose

Orchestrates the **patient registration flow**: optionally resolve or create a
caregiver (`Acompanhante`), then persist the new `Patient` entity with the
authenticated doctor's DB integer id as `criado_por_db_id`.

HTTP-blind by design — raises `ValueError` (invalid enum, invalid CPF) or
domain exceptions, never `HTTPException`. The router translates the result.

## Public Surface

```python
class RegisterPatientUseCase:
    def __init__(
        self,
        patients: PatientRepository,
        acompanhantes: AcompanhanteRepository,
    ) -> None: ...

    async def execute(
        self, request: PatientCreateRequest, *, usuario_db_id: int
    ) -> Patient: ...
```

Note: `usuario_db_id` is a keyword-only parameter — this naming convention
is consistent with [[ADR-005-uuid-to-serial-resolution]] (`_db_id` suffix
signals infrastructure coupling).

## Logic Walkthrough

**Step 1 — Resolve companion (optional)**

```python
if request.acompanhante:
    acomp_data = request.acompanhante
    if acomp_data.cpf:
        cpf_hash = CPF(acomp_data.cpf).sha256_hex
        existing = await self._acompanhantes.get_by_cpf(cpf_hash)
        if existing:
            acompanhante_id = existing.id
        else:
            new_acomp = Acompanhante(nome=acomp_data.nome, cpf=acomp_data.cpf, ...)
            acompanhante_id = await self._acompanhantes.add(new_acomp)
    else:
        new_acomp = Acompanhante(nome=acomp_data.nome, ...)
        acompanhante_id = await self._acompanhantes.add(new_acomp)
```

De-duplicates companions by CPF hash — if a companion with the same CPF was
previously registered, reuses the existing record.

**Step 2 — Build Patient entity**

```python
patient = Patient(
    full_name=request.full_name,
    cpf=request.cpf,          # CPFAnnotated validates and wraps
    birth_date=request.birth_date,
    sex_at_birth=SexAtBirth(request.sexo),
    etnia=Etnia(request.etnia),
    criado_por_db_id=usuario_db_id,   # from JWT sub claim, not from request
    # ... other demographic fields
)
```

`criado_por_db_id=usuario_db_id` — the doctor's identity comes from the
verified JWT, not from any client-supplied field (see [[ADR-005-uuid-to-serial-resolution]]).

**Step 3 — Persist**

```python
await self._patients.add(patient)
return patient
```

`PatientRepository.add()` writes to the `pacientes` view; the DB trigger
handles PGP encryption of PII fields (see [[ADR-001-active-database-pattern]]).

## Dependencies

- **Internal:**
  - [[file_interfaces_repositories_patient_repository_py]]
  - [[file_interfaces_repositories_acompanhante_repository_py]]
  - [[file_domain_entities_patient_py]] (`Patient`, `SexAtBirth`, `Etnia`)
  - [[file_domain_entities_acompanhante_py]] (`Acompanhante`)
  - [[file_domain_value_objects_cpf_py]] (`CPF`)
  - [[file_presentation_schemas_patient_py]] (`PatientCreateRequest`)
- **External:** standard library only.

## Consumers

- [[file_presentation_routers_patients_py]] (`POST /api/v1/pacientes`)

## Invariants / Pitfalls

- MUST NEVER import `fastapi`.
- `usuario_db_id` comes from the verified JWT (`AuthenticatedDoctor.usuario_id`).
  The use case trusts it as already verified. The client cannot forge the creator identity.
- `ValueError` from `SexAtBirth(request.sexo)` or `Etnia(request.etnia)` (invalid
  enum value) propagates to the router → HTTP 422.
- Companion de-duplication by CPF hash means the same CPF always resolves to the
  same `Acompanhante` record, regardless of how many patients they accompany.

## Related ADRs

- [[ADR-005-uuid-to-serial-resolution]] — `criado_por_db_id: int` instead of UUID.
- [[ADR-001-active-database-pattern]] — PGP encryption handled by DB trigger.
- [[ADR-004-cpf-sha256-anonymization]] — CPF hashing for companion lookup.
- [[003_Hexagonal_Architecture_Strategy]] — use case independence.

#file #application #use-case #patient #registration
