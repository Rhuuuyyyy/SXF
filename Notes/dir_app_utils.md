---
title: app/utils
type: Directory
status: Planned
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app]]"
children:
  - "[[file_utils_logger_py]]"
  - "[[file_utils_validators_py]]"
tags:
  - directory
  - utils
  - cross-cutting
  - helpers
related:
  - "[[dir_app_core]]"
  - "[[001_Architecture_and_Context]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[007_Audit_Logging_Middleware]]"
---

# `app/utils/` — Cross-cutting Helpers

## Context & Purpose

`app/utils/` collects **stateless helpers** that don't fit into the layer
taxonomy of [[Hexagonal_Architecture]] but are used by multiple layers.
The bar for landing here is high — anything that can sit in a more
specific layer should. Two things live here today:

- **Structured logger** ([[file_utils_logger_py]]) — JSON output, PII
  redaction filters; consumed by every layer.
- **Validators** ([[file_utils_validators_py]]) — pure functions for
  Brazilian formats (CPF, CRM, CEP) used by both
  [[file_domain_schemas_patient_py]] and the corresponding entity
  invariants.

Why `utils/` rather than `core/`:

- `core/` holds typed primitives that participate in the dependency-
  injection graph (`Settings`, security services). `utils/` is plain
  Python helpers — pure functions, no DI, no construction.
- Splitting them keeps `core/` reviewable and makes "is this safe to
  import from anywhere?" trivial to answer (yes, from `utils/`).

## Children

- [[file_utils_logger_py]] — `get_logger(name)` factory with PII filter.
- [[file_utils_validators_py]] — `is_valid_cpf`, `validate_crm`,
  `validate_cep`.

## Allowed dependencies
- Standard library + tiny pure-Python libs (`structlog`, `pydantic`).
- May be imported by **any** layer — they have no domain knowledge.

## Forbidden imports
- **MUST NOT** import [[dir_app_domain]], [[dir_app_services]],
  [[dir_app_use_cases]], [[dir_app_interfaces]] or [[dir_app_db]]. Doing
  so would create a cycle (domain imports utils, utils imports domain).

## Patterns
- **Pure functions** — no I/O, no globals, easy to test.
- **PII redaction is centralised** in the logger, not sprinkled.
- **Format validators are reusable** in both schemas (Pydantic
  `field_validator`) and entity invariants (`__post_init__`).

## Related ADRs
- [[006_LGPD_PII_Strategy]]
- [[007_Audit_Logging_Middleware]]
- [[001_Architecture_and_Context]]

#directory #utils #helpers
