---
title: app/services
type: Directory
status: Planned
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_services_auth_service_py]]"
  - "[[file_services_patient_service_py]]"
tags:
  - directory
  - services
  - application
  - orchestration
related:
  - "[[dir_app_use_cases]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `app/services/` — Application Services

## Context & Purpose

`app/services/` houses **stateful, reusable application services** that
coordinate cross-aggregate flows. They sit between the thin per-endpoint
[[Use_Case]]s in [[dir_app_use_cases]] and the persistence ports in
[[dir_app_interfaces]].

The split between `services/` and `use_cases/` is a deliberate, common
pragmatic refinement of strict Clean Architecture:

- A **use case** is a single intent (`SubmitAnamnesis`,
  `RegisterDoctor`); thin, often a 10–30 line function or class.
- A **service** is reusable, longer-lived behaviour shared across multiple
  use cases (`AuthService.authenticate_doctor` is called by login, refresh,
  password-reset).

If a piece of orchestration is invoked from one and only one use case,
inline it. If it is shared, promote it to a service here.

## Children

- [[file_services_auth_service_py]] — login, token issuance, password
  rotation; uses [[file_core_security_py]] primitives.
- [[file_services_patient_service_py]] — anamnesis submission, scoring,
  alert emission; orchestrates [[Patient]] mutations and the
  [[SymptomScoringService]].

## Allowed dependencies
- [[dir_app_domain]] (entities, schemas, value objects).
- [[dir_app_core]] (exceptions, security primitives, settings).
- [[dir_app_interfaces]] (only the **Protocol** Ports — never the concrete
  ORM adapters).

## Forbidden imports
- **MUST NOT** import `fastapi`. Services are HTTP-blind. They raise domain
  exceptions; the [[dir_app_interfaces]] layer maps to HTTP.
- **MUST NOT** import [[dir_app_db]] directly. They depend on the Port
  Protocols, never on `AsyncSession` or ORM rows.

## Patterns
- **Stateless functions** when possible; classes only when explicit
  configuration (`AuthService(hasher, issuer)`) clarifies dependencies.
- **Constructor injection** for ports — easy to fake in tests.
- **Domain-focused naming.** Method names describe clinical/auth intent
  (`authenticate_doctor`, `submit_anamnesis`), not HTTP verbs.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[005_Integration_Contracts_DTOs]]
- [[008_AuthN_Strategy]] *(planned)*

#directory #services #application #orchestration
