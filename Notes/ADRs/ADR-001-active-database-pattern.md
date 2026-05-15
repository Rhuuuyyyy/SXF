---
id: ADR-001
title: "Active Database Pattern — Delegate PGP, bcrypt and Scoring to PostgreSQL"
status: accepted
date: 2026-05-11
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - database
  - security
  - pgp
  - scoring
  - active-database
related:
  - "[[file_db_database_py]]"
  - "[[file_domain_services_symptom_scoring_orchestrator_py]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# ADR-001 — Active Database Pattern: Delegate PGP, bcrypt and Scoring to PostgreSQL

## Status

**Accepted** — 2026-05-11

---

## Context

The SXFp backend handles two categories of operations that require either
cryptographic guarantees or deterministic clinical logic that must remain
consistent across every insertion path:

1. **PII encryption at rest** — patient names, CPF digits and other
   LGPD-sensitive fields must be encrypted with PGP symmetric encryption
   before they reach the physical storage layer. Encrypting in Python before
   every `INSERT` introduces an explicit encryption call at every write site
   and risks accidental plaintext writes if a new code path is added.

2. **Clinical score computation** — `fn_calcular_score_triagem(:avaliacao_id)`
   calculates the screening score, updates `tb_avaliacoes`, closes the open
   `tb_log_analises` entry, and writes to `tb_auditoria`. All four side-effects
   must be atomic. Doing this in Python would require a multi-step transaction
   with explicit rollback logic.

The team evaluated three approaches: encrypting and scoring in Python,
encrypting and scoring in the database, or splitting encryption to Python and
scoring to the database.

---

## Decision

We adopt the **Active Database Pattern**: PostgreSQL is responsible for all
PGP field encryption and all password hashing. Python delegates both
responsibilities entirely to the database.

Concretely:

- **Writes go through named views** — Python never `INSERT`s into physical
  tables directly. Every write targets a writable view (e.g. `pacientes`).
  `INSTEAD OF INSERT` triggers on those views call `pgp_sym_encrypt()` before
  writing to the underlying physical table.

- **PGP key is injected per session** — `get_db_session()` executes
  `SELECT set_config('app.pgp_key', :key, true)` as the very first statement
  after the session is acquired. The trigger reads `current_setting('app.pgp_key')`
  to obtain the key without it ever appearing in a column value or log.

- **bcrypt hashing is handled by a trigger** — the password insert trigger
  calls `crypt(:plaintext, gen_salt('bf'))` inside the DB, so Python hands
  over a plaintext password only across the local DB socket and the hash is
  stored immediately.

- **Score computation is a stored function call** — `SymptomScoringOrchestrator`
  executes `SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)`. The
  function is the single source of truth for scoring logic; it is version-stamped
  via the `versao_param` column it returns.

```python
# get_db_session() — key excerpt
await session.execute(
    text("SELECT set_config('app.pgp_key', :key, true)"),
    {"key": settings.pgp_key.get_secret_value()},
)
yield session
```

```python
# SymptomScoringOrchestrator.execute_scoring()
result = await session.execute(
    text("SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)"),
    {"avaliacao_id": avaliacao_id},
)
```

---

## Consequences

**Positive:**

- Every write path is automatically encrypted — no risk of adding a write
  path that forgets to call `pgp_sym_encrypt()`.
- Score logic is one versioned artefact; updating the stored function rolls
  out immediately without a Python deploy.
- Audit entries from `fn_calcular_score_triagem` are atomic with scoring —
  no partial audit trail is possible.
- Python code is simpler: no cryptography library dependency for field
  encryption.

**Negative:**

- The database is no longer a passive store. Migrations must include trigger
  and function updates; Alembic scripts require manual review.
- Scoring logic is not unit-testable in pure Python — integration tests must
  connect to a real (or Docker) PostgreSQL instance.
- PGP key rotation requires a careful sequence: new key set in config, then
  re-encryption of existing rows inside the DB.

---

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Encrypt in Python (e.g. `cryptography` library) | Every write site must call the encrypt function; one missed call exposes plaintext. Hard to enforce statically. |
| Score in Python with DB writes | Multi-step transaction with explicit rollback; audit and scoring can diverge if a step fails. |
| Split: Python encrypts, DB scores | Hybrid adds complexity without a clear benefit; two patterns for two operations in the same layer. |

---

## Implementation Notes

- `get_db_session()` lives in `app/db/database.py`. The `set_config` call
  uses `true` as the third argument, scoping the key to the current
  transaction. The key is never stored in a column or application log.
- `SymptomScoringOrchestrator` lives in
  `app/domain/services/symptom_scoring_orchestrator.py` and returns a frozen
  `ScoringResult` dataclass: `score_final`, `limiar_usado`, `recomenda_exame`,
  `versao_param`.
- Physical tables are named with `tb_` prefix; views used for writes carry
  the logical name (e.g. `pacientes`).

#adr #database #pgp #security #active-database
