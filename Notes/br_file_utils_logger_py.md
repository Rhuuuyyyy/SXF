---
title: logger.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_utils_logger_py]]"
file_language: python
path: app/utils/logger.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_utils]]"
tags:
  - file
  - utils
  - logging
  - observability
  - pii-redaction
  - structlog
  - pt-br
related:
  - "[[br_file_core_config_py]]"
  - "[[br_file_core_security_py]]"
  - "[[br_007_Audit_Logging_Middleware]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_220_Observability]]"
---

# `app/utils/logger.py` — Logging Estruturado com Redação PII

## Context & Purpose

Toda camada loga via uma única factory. A factory:

1. Retorna um logger estruturado (JSON) backed por `structlog`.
2. Anexa o `request_id` per-request (setado por
   [[br_007_Audit_Logging_Middleware]]) a cada linha.
3. **Filtra PII** antes da serialização — `cpf`, `full_name`,
   `password`, `password_hash`, `secret_key`, `access_token`, `email`
   são redigidos por nome, independentemente de onde aparecem na
   estrutura.

É *cooperativo* com [[br_007_Audit_Logging_Middleware]], não
substituto. O middleware escreve em audit sink imutável; este logger
escreve em stdout para debug operacional. O filtro PII garante que
logs operacionais nunca virem a superfície de breach LGPD.

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

Escolhas-chave:

- **Mentalidade allow-list** — redigimos toda *chave* sensível
  conhecida; novas são fáceis de adicionar. Combine com um teste CI
  que asserta `password not in caplog.records`.
- **Scrub regex de CPF** é defesa em profundidade para strings
  perdidas que embedam um CPF dentro de uma sentença (ex.: mensagens
  de erro de libs terceiras). Barato; roda O(n) sobre o valor.
- **Propagação de `request_id`** usa `structlog.contextvars` — o
  middleware semeia uma vez per-request, todo log herda.
- **Output JSON** para stdout — Kubernetes / Docker pipam direto em
  Loki / OpenSearch sem stage de parser.

## Dependencies
- **Externo:** `structlog>=24.1`.
- **Interno:** [[br_file_core_config_py]] (lê log level via env).

## Consumers
- Todo módulo via `logger = get_logger(__name__)`.
- [[br_007_Audit_Logging_Middleware]] — emite eventos de envelope
  aqui E para o audit sink.
- [[br_file_root_main_py]] — chama `configure()` uma vez no startup.

## Invariants / Pitfalls
- **Nunca contorne `get_logger`.** `print()` direto ou `logging` da
  stdlib bypassa o redactor.
- O filtro PII só protege chaves conhecidas. Field novo carregando
  PII PRECISA ser adicionado a `PII_KEYS` no mesmo commit (Regra 2 de
  [[br_000_AI_OBSIDIAN_PROTOCOL]]).
- Não logue request bodies inteiros. A pipeline de audit do
  middleware é o lugar; logs operacionais devem ser agregados (size,
  status, latency).
- `cache_logger_on_first_use=True` significa que reconfigurar em
  runtime não tem efeito — chame `configure()` exatamente uma vez no
  startup.

## Related ADRs
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_220_Observability]] *(planejado)*

#file #utils #logging #observability #pii #pt-br
