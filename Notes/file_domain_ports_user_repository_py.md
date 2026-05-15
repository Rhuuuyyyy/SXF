---
title: user_repository.py (port)
type: File
status: Active
language: python
path: app/domain/ports/user_repository.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - port
  - protocol
  - user
  - repository
  - dba-interface
related:
  - "[[file_domain_entities_user_py]]"
  - "[[file_domain_ports_patient_repository_py]]"
  - "[[file_domain_ports_evaluation_repository_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[005_Integration_Contracts_DTOs]]"
---

# `app/domain/ports/user_repository.py` — IUserRepository Port

## Context & Purpose

Declares the **persistence contract** for the
[[file_domain_entities_user_py]] aggregate. This Port is the *only*
thing the application layer (use cases, services) sees when it needs to
read or write users. Concrete adapters (SQLAlchemy, in-memory fake,
remote service) live in the infrastructure layer and satisfy this
Protocol structurally.

The Port is the **source of truth for the [[DBA_Team]] integration**:
once it lands, they can implement against the signatures without further
backend coordination.

## Logic Breakdown

```python
class IUserRepository(Protocol):
    async def get(self, user_id: UUID) -> User | None: ...
    async def get_by_email(self, email: str) -> User | None: ...
    async def add(self, user: User) -> User: ...
    async def update(self, user: User) -> User: ...
    async def list_active(
        self, *, limit: int = 50, offset: int = 0
    ) -> list[User]: ...
```

Method semantics:

- **`get`** — primary-key lookup; returns `None` for missing instead of
  raising, so callers can choose between 404 and "create-on-miss".
- **`get_by_email`** — login path; implementations MUST match
  case-insensitively (the entity stores email as the canonical form).
- **`add`** — inserts a new user; raises if email already exists. The
  exact exception type is adapter-specific; use cases translate to a
  domain `ConflictError` at the application boundary.
- **`update`** — full replacement of mutable fields by `id`. Optimistic
  concurrency (e.g. version column) is a future concern documented in
  [[Concurrency_Strategy]] *(planned)*.
- **`list_active`** — paginated; the default 50/0 keeps responses small.
  Required for the future admin-dashboard screen.

## Why `Protocol` (and not `ABC`)

Structural typing fits ports precisely:

- **No inheritance required.** Test doubles can be plain dicts wrapped
  in a class; mypy still verifies they satisfy the contract.
- **No coupling to the import path of the abstraction.** The domain
  defines the Protocol; adapters never import it just to "claim
  inheritance". They simply implement the methods.
- **First-class FastAPI DI compatibility.** Adapters bind at the
  composition root; the rest of the codebase types its dependencies as
  `IUserRepository`.

## Dependencies
- **Internal:** [[file_domain_entities_user_py]].
- **External:** `typing.Protocol`, `uuid` only.

## Consumers
- Future `AuthenticateDoctorUseCase`, `RegisterUserUseCase`,
  `ListDoctorsUseCase`.
- Future infrastructure adapter (SQLAlchemy, owned by [[DBA_Team]]).
- Test fakes (`InMemoryUserRepository`).

## Invariants / Pitfalls
- **Async by design.** Even though no concrete impl exists, every
  signature is `async`. Mixing sync and async repositories at this
  layer would force every consumer to know which is which.
- **`None` for missing, not exception.** Adapters must return `None`
  from `get`/`get_by_email` rather than raising.
- **Email is canonicalised before lookup.** Adapter implementations
  must match the entity's lower-cased form to avoid case-sensitive
  collisions.
- **No `delete` method on the Port.** LGPD-compliant deletion is
  pseudonymisation + `is_active=False`, modelled on the entity. A hard
  delete is intentionally absent.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[006_LGPD_PII_Strategy]]

#file #domain #port #protocol #user #repository
