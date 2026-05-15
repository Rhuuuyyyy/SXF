---
id: file-core-exceptions
title: "exceptions.py (core)"
type: File
status: Active
language: python
path: app/core/exceptions.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_core]]"
tags:
  - file
  - core
  - exceptions
  - error-handling
  - cross-cutting
related:
  - "[[file_root_main_py]]"
  - "[[file_interfaces_api_dependencies_py]]"
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[file_services_auth_service_py]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/core/exceptions.py` — Domain-Neutral Exception Hierarchy

## Context & Purpose

Defines the **typed exception base classes** that the rest of the codebase
raises. Two responsibilities:

1. Provide a stable hierarchy that the presentation layer maps to HTTP
   responses (RFC 7807 Problem Details).
2. Decouple business code from `fastapi.HTTPException`. Domain and use case
   layers NEVER raise HTTP-aware exceptions; they raise domain exceptions,
   and the global handler in [[file_root_main_py]] translates.

This avoids the common anti-pattern where business logic raises
`HTTPException(status_code=400, ...)` and becomes untestable without booting
the full web framework.

## Public Surface

```python
class SXFpError(Exception):
    code: str = "sxfp.error"

class DomainError(SXFpError):
    code = "domain.error"

class NotFoundError(SXFpError):
    code = "resource.not_found"

class ConflictError(SXFpError):
    code = "resource.conflict"

class AuthenticationError(SXFpError):
    code = "auth.unauthenticated"

class AuthorizationError(SXFpError):
    code = "auth.forbidden"

class LGPDComplianceError(SXFpError):
    code = "lgpd.violation"
```

## HTTP Mapping (in `main.py`)

| Exception | HTTP Status | Use case |
|---|---|---|
| `NotFoundError` | 404 | Patient/evaluation not found |
| `ConflictError` | 409 | Duplicate registration |
| `AuthenticationError` | 401 | Invalid/missing credentials |
| `AuthorizationError` | 403 | Insufficient role |
| `LGPDComplianceError` | 422 | k-anonymity threshold violation |
| `DomainError` | 422 | Invalid domain invariant |
| `SXFpError` (base) | 500 | Unexpected application error |

## Key Consumer: `LGPDComplianceError`

`LGPDComplianceError` is raised by [[file_application_use_cases_get_dashboard_stats_py]]
when any dashboard row would expose fewer than `K_ANONYMITY_THRESHOLD = 5`
evaluations. The global handler catches it and returns HTTP 422 with the
standard RFC 7807 envelope.

```python
# Example raise site
raise LGPDComplianceError(
    f"Dashboard result would expose a group with fewer than 5 evaluations."
)
```

## Dependencies

- **External:** standard library only. Zero framework imports — strict.

## Consumers

| Consumer | Exceptions raised |
|---|---|
| [[dir_app_domain]] entities | `DomainError` on invariant violations |
| [[file_services_auth_service_py]] | `AuthenticationError`, `AuthorizationError` |
| [[file_application_use_cases_get_dashboard_stats_py]] | `LGPDComplianceError` |
| [[file_application_use_cases_register_patient_py]] | `ConflictError` (duplicate CPF) |
| [[file_root_main_py]] | Registers all handlers |

## Invariants / Pitfalls

- **No HTTP details inside exception classes.** Status codes belong exclusively
  in the handler map in [[file_root_main_py]].
- New exception subclasses MUST be added here AND have a corresponding entry
  added to the handler map in [[file_root_main_py]] in the same commit.
- `context`/`message` strings passed to exceptions MUST NOT include PII (CPF,
  name, etc.) — the message is forwarded to the HTTP response body.
- Never `catch SXFpError` broadly in business code — it would swallow
  `LGPDComplianceError` and break the compliance gate.

## Related ADRs

- [[003_Hexagonal_Architecture_Strategy]] — domain/HTTP separation.
- [[006_LGPD_PII_Strategy]] — `LGPDComplianceError` usage.
- [[ADR-003-k-anonymity-in-use-case-layer]] — k-anonymity raises this exception.

#file #core #exceptions #error-handling
