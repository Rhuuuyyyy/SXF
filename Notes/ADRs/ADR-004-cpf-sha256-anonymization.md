---
id: ADR-004
title: "CPF SHA-256 Anonymization — Hash in the Use Case Layer, Never Pass Raw Digits to the Repository"
status: accepted
date: 2026-05-11
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - lgpd
  - cpf
  - privacy
  - sha256
  - domain
related:
  - "[[file_domain_value_objects_cpf_py]]"
  - "[[file_application_use_cases_get_patient_list_py]]"
  - "[[file_interfaces_repositories_patient_read_repository_py]]"
  - "[[006_LGPD_PII_Strategy]]"
---

# ADR-004 — CPF SHA-256 Anonymization: Hash in the Use Case Layer

## Status

**Accepted** — 2026-05-11

---

## Context

The CPF (Cadastro de Pessoas Físicas) is Brazil's taxpayer identification
number and is classified as personally identifiable information (PII) under
LGPD. The system needs to support CPF-based patient lookup for doctors
without storing or transmitting plaintext CPF digits in SQL query parameters
or application logs.

Raw CPF digits in an SQL parameter appear in database slow-query logs,
`EXPLAIN ANALYZE` output, and any query-level audit logging enabled by
PostgreSQL. Storing a one-way hash eliminates this exposure.

The team needed to decide where the hashing step should occur — in the HTTP
router, in the application use case, or in the repository adapter.

---

## Decision

CPF digits are hashed to **SHA-256 hex** in the **application use case layer**,
inside `GetPatientListUseCase.execute()`. The repository (`PatientReadRepository`)
receives only the `sha256_hex` string and never sees raw digits.

The `CPF` domain value object (`app/domain/value_objects/cpf.py`) exposes the
`sha256_hex` property. The use case constructs `CPF(cpf_raw_filter).sha256_hex`
and passes the result as `cpf_hash_filter` to the repository.

```python
# In GetPatientListUseCase.execute()
cpf_hash_filter: str | None = None
if cpf_raw_filter:
    cpf_hash_filter = CPF(cpf_raw_filter).sha256_hex
```

The `CPF` value object:
- Strips dots, dashes and spaces; validates exactly 11 digits.
- `sha256_hex` uses `hashlib.sha256(self.value.encode()).hexdigest()`.
- `__repr__` and `__str__` return `"***redacted***"` — CPF never appears in
  logs, exception messages, or stack traces.
- Constructed with a raw string from the router; validation raises `ValueError`
  on malformed input, which the router converts to HTTP 422.

---

## Consequences

**Positive:**

- Raw CPF digits never appear in SQL parameters, query logs, or repository
  method signatures. The enforcement point is auditable in one place.
- The hashing rule is **unit-testable** without a database: pass raw CPF to
  the use case, assert the repository receives the expected sha256 hex.
- `CPF.__repr__` and `__str__` redaction protect against CPF leaking into
  exception messages or structured logs.
- `hashlib.sha256` is Python stdlib — no additional dependency.

**Negative:**

- SHA-256 without a salt is theoretically susceptible to rainbow table attacks
  for the known CPF space (~100M values). For this use case — lookup, not
  password storage — the risk is accepted: the alternative (exact match on
  plaintext) is strictly worse.
- If the hashing algorithm must change (e.g. to Argon2id for stored CPF),
  all existing CPF hashes must be recomputed in the database. A new ADR
  would be required.

---

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Hash in the HTTP router | Routers must not contain business logic; the hashing rule would not be testable without spinning up FastAPI. |
| Hash in the repository | Repository is infrastructure; compliance policy (what constitutes safe CPF handling) belongs in the domain/application boundary. |
| Pass raw CPF to DB and hash via SQL function | SQL parameters appear in logs before the function is called; the raw digit exposure window is not eliminated. |
| Encrypt instead of hash | Encryption is reversible; search-by-exact-CPF works identically with a hash and avoids storing the decryption key at query time. |

---

## Implementation Notes

- `CPF` is a frozen `@dataclass` in `app/domain/value_objects/cpf.py`.
- `CPFAnnotated = Annotated[CPF, BeforeValidator(_validate_cpf)]` — used as
  the Pydantic type annotation for the `cpf` field on the `Patient` entity.
  The validator accepts `str | CPF` and normalises to `CPF`.
- `PatientReadRepository.list_by_doctor()` and `.count_by_doctor()` accept
  `cpf_hash_filter: str | None` — the parameter name makes it explicit that
  a hash (not raw digits) is expected.
- On the physical table, the column is `cpf_hash` (SHA-256 hex, not the
  encrypted CPF digit string which is a separate encrypted column).

#adr #lgpd #cpf #privacy #sha256 #domain
