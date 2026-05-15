---
title: user.py (model) — ARCHIVED
type: File
status: Archived
deprecation_date: 2026-05-03
superseded_by: "[[file_domain_entities_user_py]]"
language: python
path: app/domain/models/user.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - user
  - doctor
  - rbac
  - archived
related:
  - "[[file_domain_entities_user_py]]"
  - "[[file_domain_schemas_user_py]]"
  - "[[file_interfaces_repositories_user_repository_py]]"
  - "[[file_services_auth_service_py]]"
  - "[[file_use_cases_user_cases_py]]"
  - "[[file_core_security_py]]"
  - "[[008_AuthN_Strategy]]"
---

# `app/domain/models/user.py` — Authenticated Identity (Doctor)

> **ARCHIVED 2026-05-03.** The `app/domain/models/` path described here was
> never implemented. The active code lives at
> [[file_domain_entities_user_py]] (`app/domain/entities/user.py`), which
> renders the same domain concept using the existing hexagonal layout
> (`entities/` rather than `models/`). Read the active note for current
> behaviour; everything below is preserved for historical context.

## Context & Purpose

Models the **authenticated identity** of the system. In v1 the only role is
`doctor`; future roles ([[CRM_Validator]], [[Researcher]],
[[Caretaker]]) plug into the same entity through `Role`. Authentication and
authorization rules read this entity but are *implemented* in
[[file_core_security_py]] (low-level crypto) and
[[file_services_auth_service_py]] (use-case orchestration).

## Logic Breakdown

Skeleton (planned):

```python
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4


class Role(StrEnum):
    DOCTOR = "doctor"
    ADMIN = "admin"        # planned, out of v1 scope


@dataclass(slots=True, kw_only=True)
class User:
    id: UUID = field(default_factory=uuid4)
    email: str
    full_name: str
    crm: str               # Brazilian medical-board ID; format validated
    role: Role = Role.DOCTOR
    password_hash: str     # Argon2id digest, set only via factory
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_login_at: datetime | None = None

    def has_role(self, required: Role) -> bool:
        return self.role == required

    def deactivate(self) -> None:
        self.is_active = False
```

Key choices:

- **`Role` as `StrEnum`** — serialises naturally to JSON and into JWT
  claims read by [[file_interfaces_api_dependencies_py]].
- **`password_hash` is opaque to the domain.** The User entity stores the
  digest produced by [[file_core_security_py]]; it does NOT verify
  passwords itself (separation of concerns).
- **CRM (Conselho Regional de Medicina)** — the practitioner's licence
  number. Format `<UF>/<digits>`; validated by
  [[file_utils_validators_py]] (`validate_crm`). Required for clinical
  audit attribution.
- **`is_active` boolean** — soft-delete; deletes are audited (Art. 18
  LGPD; see [[006_LGPD_PII_Strategy]]).

## Dependencies
- **Internal:** [[file_core_exceptions_py]] (`DomainError`).
- **External:** standard library only.

## Consumers
- [[file_interfaces_repositories_user_repository_py]].
- [[file_services_auth_service_py]] (login).
- [[file_use_cases_user_cases_py]] (registration / management).
- [[file_interfaces_api_dependencies_py]] (`get_current_doctor`).

## Invariants / Pitfalls
- **Password hashes ONLY** — never store cleartext, even temporarily.
  Construction goes through a factory that calls [[file_core_security_py]].
- The domain never compares `password_hash` directly; verification is
  delegated to the `IPasswordHasher` adapter to keep the layer pure.
- `email` uniqueness is enforced at the DB layer (constraint name from
  [[file_db_base_py]]'s naming convention) AND validated by the use case
  before insert.
- Logging a `User` instance MUST redact `password_hash` and `email`.
  `__repr__` is overridden to print only `id` and `role`.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[006_LGPD_PII_Strategy]]
- [[008_AuthN_Strategy]] *(planned)*
- [[009_Authorization_RBAC]] *(planned)*

#file #domain #entity #user #rbac
