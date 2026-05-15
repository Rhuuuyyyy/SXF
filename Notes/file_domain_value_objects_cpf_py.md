---
id: file-domain-cpf
title: "cpf.py (value object)"
type: File
status: Active
language: python
path: app/domain/value_objects/cpf.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_app_domain]]"
tags:
  - file
  - domain
  - value-object
  - cpf
  - lgpd
  - sha256
related:
  - "[[file_application_use_cases_get_patient_list_py]]"
  - "[[file_application_use_cases_register_patient_py]]"
  - "[[file_domain_entities_patient_py]]"
  - "[[ADR-004-cpf-sha256-anonymization]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# `app/domain/value_objects/cpf.py` — CPF Value Object

## Context & Purpose

Wraps a Brazilian taxpayer ID (CPF — Cadastro de Pessoas Físicas) as an
immutable value object. Enforces format validation, redacts the value in all
string representations, and provides a one-way SHA-256 hash for storage and
lookup.

LGPD requirement: CPF is classified as sensitive PII (Art. 5, XI). Raw CPF
digits are never persisted in plaintext or written to application logs.
See [[ADR-004-cpf-sha256-anonymization]] for the full decision record.

## Public Surface

```python
@dataclass(frozen=True)
class CPF:
    value: str             # cleaned 11-digit string (post __post_init__)

    sha256_hex: str        # property: SHA-256 hex of cleaned value
    __repr__: str          # always "CPF(***redacted***)"
    __str__: str           # always "***redacted***"

def _validate_cpf(v: object) -> CPF: ...   # internal validator

CPFAnnotated = Annotated[CPF, BeforeValidator(_validate_cpf)]
```

## Logic Walkthrough

### `__post_init__` (constructor validation)

```python
cleaned = re.sub(r"[.\-\s]", "", self.value)
if not cleaned.isdigit() or len(cleaned) != 11:
    raise ValueError("CPF inválido: deve conter exatamente 11 dígitos numéricos")
object.__setattr__(self, "value", cleaned)   # frozen=True requires setattr via object.__
```

- Strips `.`, `-`, spaces (allows `123.456.789-09` as input).
- Validates exactly 11 numeric digits.
- Stores the **cleaned** value back — consistent hashing regardless of input format.
- Does NOT validate the CPF check-digit algorithm (mod-11) at this time.

### `sha256_hex` property

```python
@property
def sha256_hex(self) -> str:
    return hashlib.sha256(self.value.encode()).hexdigest()
```

- `self.value` is always the cleaned 11-digit string at this point.
- `"utf-8"` encoding (`.encode()` default).
- Output: 64-character lowercase hex string.

### Redaction guards

```python
def __repr__(self) -> str:
    return "CPF(***redacted***)"

def __str__(self) -> str:
    return "***redacted***"
```

Both are overridden so that `print(cpf)`, `f"{cpf}"`, `logging.info(cpf)`, and
Python debugger inspectors all show `"***redacted***"` — CPF can never appear
in log output through normal Python mechanisms.

### `CPFAnnotated`

```python
CPFAnnotated = Annotated[CPF, BeforeValidator(_validate_cpf)]
```

Used as the Pydantic field type on the `Patient` entity:
```python
cpf: CPFAnnotated | None
```

The `BeforeValidator` accepts either a raw `str` (passes to `CPF()`) or an
existing `CPF` instance (returns as-is). Validation error messages from
`CPF.__post_init__` propagate as Pydantic `ValueError`.

## Dependencies

- **External:** `hashlib`, `re`, `dataclasses` (stdlib); `pydantic.functional_validators.BeforeValidator`, `typing.Annotated`.

## Consumers

| Consumer | How CPF is used |
|---|---|
| [[file_domain_entities_patient_py]] | `cpf: CPFAnnotated | None` field; `cpf_hash` property delegates to `cpf.sha256_hex` |
| [[file_application_use_cases_get_patient_list_py]] | `CPF(cpf_raw_filter).sha256_hex` before passing to repository |
| [[file_interfaces_repositories_acompanhante_repository_py]] | `get_by_cpf(sha256_hex)` — hash computed by use case |

## Invariants / Pitfalls

- Hash is computed on the **cleaned** value. `"123.456.789-09"` and
  `"12345678909"` produce the **same** hash — consistent lookups regardless of
  input formatting.
- `frozen=True` — `CPF` is immutable after construction. Use `object.__setattr__`
  in `__post_init__` to set `value` (required for frozen dataclasses).
- `CPF` MUST NOT be serialised, returned in API responses, or logged.
  Always use `cpf.sha256_hex` for storage/lookup.
- Check-digit validation is a planned enhancement — the current implementation
  only validates digit count and character type.

## Related ADRs

- [[ADR-004-cpf-sha256-anonymization]] — where hashing occurs and why.
- [[006_LGPD_PII_Strategy]] — CPF classification and protection requirements.

#file #domain #value-object #cpf #lgpd #sha256
