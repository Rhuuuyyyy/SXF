---
title: logger.py
type: File
status: Planned
language: python
path: app/utils/logger.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_utils]]"
tags:
  - file
  - utils
  - logging
  - observability
  - pii-redaction
  - structlog
related:
  - "[[file_core_config_py]]"
  - "[[file_core_security_py]]"
  - "[[007_Audit_Logging_Middleware]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[220_Observability]]"
---

# `app/utils/logger.py` — Structured Logging with PII Redaction

## Context & Purpose

Every layer logs through a single factory. The factory:

1. Returns a structured (JSON) logger backed by `structlog`.
2. Attaches the per-request `request_id` (set by
   [[007_Audit_Logging_Middleware]]) to every line.
3. **Filters PII** before serialisation — `cpf`, `full_name`,
   `password`, `password_hash`, `secret_key`, `access_token`, `email`
   are redacted by name, regardless of where in the structure they
   appear.

This is *cooperative* with [[007_Audit_Logging_Middleware]], not a
substitute. The middleware writes to an immutable audit sink; this
logger writes to stdout for operational debugging. The PII filter
guarantees that operational logs never become the LGPD breach surface.

## Logic Breakdown

```python
import logging
import re
import sys
from typing import Any

import structlog

PII_KEYS = frozenset({
    "cpf", "full_name", "password", "password_hash",
    "secret_key", "access_token", "refresh_token", "email",
})
CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")


def _redact_pii(_, __, event_dict: dict[str, Any]) -> dict[str, Any]:
    for k in list(event_dict):
        if k in PII_KEYS:
            event_dict[k] = "[REDACTED]"
        elif isinstance(event_dict[k], str):
            event_dict[k] = CPF_RE.sub("[REDACTED-CPF]", event_dict[k])
    return event_dict


def configure(level: str = "INFO") -> None:
    logging.basicConfig(
        format="%(message)s", stream=sys.stdout, level=level,
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            _redact_pii,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, level)
        ),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
```

Key choices:

- **Allow-list mindset** — we redact every known sensitive *key*; new
  ones are easy to add. Pair with a CI test that asserts
  `password not in caplog.records`.
- **Regex CPF scrub** is a defence-in-depth net for stray strings that
  embed a CPF inside a sentence (e.g. error messages from third-party
  libs). Cheap; runs O(n) over the value.
- **`request_id` propagation** uses `structlog.contextvars` — the
  middleware seeds it once per request, every log inherits it.
- **JSON output** to stdout — Kubernetes / Docker pipe directly into
  Loki / OpenSearch without a parser stage.

## Dependencies
- **External:** `structlog>=24.1`.
- **Internal:** [[file_core_config_py]] (reads log level via env).

## Consumers
- Every module via `logger = get_logger(__name__)`.
- [[007_Audit_Logging_Middleware]] — emits envelope events here AND to
  the audit sink.
- [[file_root_main_py]] — calls `configure()` once during `lifespan`.

## Invariants / Pitfalls
- **Never bypass `get_logger`.** Direct `print()` or stdlib `logging`
  side-steps the redactor.
- The PII filter only protects keys it knows about. A new field carrying
  PII MUST be added to `PII_KEYS` in the same commit ([[000_AI_OBSIDIAN_PROTOCOL]]
  Rule 2).
- Do not log entire request bodies. The middleware's audit pipeline is
  the place; operational logs should be aggregate (size, status, latency).
- `cache_logger_on_first_use=True` means re-configuring at runtime has
  no effect — call `configure()` exactly once at startup.

## Related ADRs
- [[006_LGPD_PII_Strategy]]
- [[007_Audit_Logging_Middleware]]
- [[220_Observability]] *(planned)*

#file #utils #logging #observability #pii
