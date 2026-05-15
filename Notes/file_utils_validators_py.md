---
title: validators.py
type: File
status: Planned
language: python
path: app/utils/validators.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_utils]]"
tags:
  - file
  - utils
  - validators
  - cpf
  - crm
  - brazilian-formats
related:
  - "[[file_domain_models_patient_py]]"
  - "[[file_domain_models_user_py]]"
  - "[[file_domain_schemas_patient_py]]"
  - "[[file_domain_schemas_user_py]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/utils/validators.py` — Brazilian Format Validators

## Context & Purpose

Pure-function validators for Brazilian formats that recur across the
domain: **CPF**, **CRM** (medical-board ID), and **CEP** (postal code).
Centralising them prevents three classes of bugs:

1. **Inconsistent acceptance** — `12345678900`, `123.456.789-00`,
   `123.456.789-0` should resolve to the same canonical form.
2. **Wrong checksum implementations** — CPF has a verification-digit
   algorithm; one-off inline checks have historically been wrong.
3. **Drift between schemas and entities** — both sides validate via the
   same helpers, so `Pydantic.field_validator` and
   `Patient.__post_init__` agree.

## Logic Breakdown

```python
import re

CPF_DIGITS_RE = re.compile(r"\D")
CRM_RE = re.compile(r"^[A-Z]{2}/\d{4,7}$")
CEP_RE = re.compile(r"^\d{5}-?\d{3}$")


def normalise_cpf(raw: str) -> str:
    return CPF_DIGITS_RE.sub("", raw)


def is_valid_cpf(raw: str) -> bool:
    """
    Validate a Brazilian CPF using the standard
    'modulo-11 with digit verifiers' algorithm.
    Rejects sequences of identical digits ('11111111111') which would
    pass the checksum but are blacklisted by Receita Federal.
    """
    cpf = normalise_cpf(raw)
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    for i in (9, 10):
        weights = range(i + 1, 1, -1)
        total = sum(int(d) * w for d, w in zip(cpf, weights))
        check = (total * 10) % 11 % 10
        if check != int(cpf[i]):
            return False
    return True


def validate_crm(raw: str) -> str:
    """
    CRM format: ``UF/digits`` (e.g. 'SP/123456'). Returns the canonical
    upper-cased form. Raises ``ValueError`` on bad input — callers
    upstream translate to ``DomainError``.
    """
    canon = raw.strip().upper()
    if not CRM_RE.match(canon):
        raise ValueError("Invalid CRM format. Expected 'UF/digits'.")
    return canon


def validate_cep(raw: str) -> str:
    canon = raw.strip()
    if not CEP_RE.match(canon):
        raise ValueError("Invalid CEP format.")
    return canon if "-" in canon else f"{canon[:5]}-{canon[5:]}"
```

Key choices:

- **Modulo-11 CPF algorithm** is the official one published by Receita
  Federal; the blacklist of all-identical sequences (`11111111111`) is
  not in the algorithm itself but is a long-standing convention because
  those sequences are widely used as test data.
- **Normalisation first, then validation** — accepts both punctuated and
  raw input; canonical output is digits-only.
- **Validators raise plain `ValueError`** — Pydantic's `field_validator`
  re-raises as a 422; entity invariants wrap it in `DomainError`.
- **No I/O, no globals** — these helpers are safe to call from any layer
  and trivially testable.

## Dependencies
- **External:** `re` from stdlib only.

## Consumers
- [[file_domain_schemas_patient_py]] (`PatientCreate.cpf` validator).
- [[file_domain_schemas_user_py]] (`UserCreate.crm` validator).
- [[file_domain_models_patient_py]] (`CPF` value object).
- [[file_domain_models_user_py]] (`User.__post_init__`).

## Invariants / Pitfalls
- **Never log the input on failure.** The CPF in question may be valid
  PII; pass `[REDACTED-CPF]` to logs (the
  [[file_utils_logger_py]] regex catches stray cases anyway).
- Blacklisting all-identical CPFs is a **functional** rule, not a
  cryptographic one — test data using `12345678909` is *valid* by
  algorithm and will pass; tests must use a generator or a
  documented-fake set.
- Adding more Brazilian-format helpers (RG, CNH) belongs here too;
  resist the temptation to scatter them.
- The CRM regex permits 4–7 digits; some councils issue shorter numbers
  for pre-2000 registrations. If the [[DBA_Team]] tightens the column,
  this regex must follow.

## Related ADRs
- [[006_LGPD_PII_Strategy]]
- [[001_Architecture_and_Context]]
- [[005_Integration_Contracts_DTOs]]

#file #utils #validators #cpf #crm
