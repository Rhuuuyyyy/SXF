---
title: user.py (entity)
type: File
status: Active
language: python
path: app/domain/entities/user.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
supersedes: "[[file_domain_models_user_py]]"
tags:
  - file
  - domain
  - entity
  - user
  - doctor
  - admin
  - rbac
  - pydantic
related:
  - "[[file_domain_ports_user_repository_py]]"
  - "[[file_domain_entities_patient_py]]"
  - "[[file_domain_entities_evaluation_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[008_AuthN_Strategy]]"
---

# `app/domain/entities/user.py` — User Entity

## Context & Purpose

Represents an **authenticated identity** in SXFp: either a `doctor` who
records [[Patient]] data and runs [[Evaluation]]s, or an `admin` who
manages the platform. The entity is intentionally minimal and pure —
no SQLAlchemy, no FastAPI, no I/O. Authentication mechanics
(hashing, JWT issuance) are delegated to ports/adapters; this entity
only carries the *digest* and a few small invariants.

## Logic Breakdown

Two public symbols:

- **`UserRole(StrEnum)`** — `DOCTOR` | `ADMIN`. `StrEnum` (Python 3.11+)
  serialises as a plain string for JSON / JWT claims.
- **`User(BaseModel)`** — Pydantic v2 model with:
    - `id: UUID` (default `uuid4()`).
    - `email: str` (length 3–254).
    - `full_name: str` (length 2–120).
    - `role: UserRole`.
    - `password_hash: str` — opaque digest produced upstream by an
      `IPasswordHasher`. The entity never sees plaintext.
    - `crm: str | None` — Brazilian medical-board ID; required when
      `role == DOCTOR` (enforced by `_doctor_must_have_crm` validator).
    - `is_active: bool` (default `True`).
    - `created_at: datetime` (UTC, default factory).
    - `last_login_at: datetime | None`.

Behaviours:

- `has_role(required: UserRole) -> bool` — guard for RBAC checks; also
  short-circuits if the user is inactive.
- `deactivate()` — soft-delete; flips `is_active` to `False`.
- `record_login(when=None)` — sets `last_login_at` to now (UTC) or to a
  caller-provided timestamp (test friendly).

## Pydantic configuration

```python
model_config = ConfigDict(
    extra="forbid",          # rejects unknown fields → strict contract
    str_strip_whitespace=True,
    validate_assignment=True,  # invariants re-checked on attribute write
)
```

`validate_assignment=True` means `user.role = UserRole.DOCTOR` re-runs the
CRM invariant — the entity remains consistent through mutation, not just
at construction.

## Dependencies
- **Internal:** none (pure domain).
- **External:** `pydantic` v2, `enum.StrEnum`, `datetime`, `uuid`.

## Consumers
- [[file_domain_ports_user_repository_py]] — Port that persists this entity.
- Future application layer (`AuthenticateDoctorUseCase`,
  `RegisterUserUseCase`).
- Future presentation schemas in `app/presentation/api/v*/schemas/user.py`.

## Invariants / Pitfalls
- **Doctors require `crm`.** Construction without a CRM raises
  `ValidationError`. Admins do not (the system itself can have admin
  accounts without a medical licence).
- **`password_hash` is never compared inside the entity.** Verification
  goes through `IPasswordHasher` so the entity stays free of crypto deps.
- **Logging a `User` is sensitive.** Until a `__repr__` override exists,
  callers MUST scrub `email` and `password_hash` themselves. PII
  redaction strategy is documented in [[006_LGPD_PII_Strategy]].
- **`StrEnum` comparison uses `is`** (identity) here for clarity — both
  `is` and `==` work because the enum members are interned, but `is`
  signals intent.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[008_AuthN_Strategy]] *(planned)*
- [[009_Authorization_RBAC]] *(planned)*

#file #domain #entity #user #pydantic
