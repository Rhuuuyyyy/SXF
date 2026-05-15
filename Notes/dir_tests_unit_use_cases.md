---
title: tests/unit/use_cases
type: Directory
status: Active
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_tests]]"
tags:
  - directory
  - tests
  - unit
  - use-cases
related:
  - "[[file_tests_conftest_py]]"
  - "[[file_application_use_cases_get_dashboard_stats_py]]"
  - "[[file_application_use_cases_get_patient_history_py]]"
  - "[[file_application_use_cases_get_patient_list_py]]"
  - "[[file_application_use_cases_submit_anamnesis_py]]"
---

# `tests/unit/use_cases/` — Application Layer Unit Tests

## Context & Purpose

Isolated unit tests for Application Use Cases. No database, no HTTP client,
no FastAPI boot. All repository dependencies are replaced by `AsyncMock`
instances provided by [[file_tests_conftest_py]].

**Sprint 6 coverage: 16 tests, 0 failures.**

## Test Files

### `test_dashboard_stats.py` — 6 tests
Tests [[file_application_use_cases_get_dashboard_stats_py]] k-anonymity enforcement:
- Single row below `K_ANONYMITY_THRESHOLD` → `LGPDComplianceError`
- Any row below threshold in mixed list → `LGPDComplianceError`
- All rows at or above threshold → returns result
- Boundary: exactly 5 → passes
- Empty result set → no error
- Filters forwarded verbatim to repository

### `test_patient_history.py` — 3 tests
Tests [[file_application_use_cases_get_patient_history_py]] RBAC and pagination:
- Patient with no evaluations → empty list, no error
- `limit > 200` → silently capped at 200
- `usuario_id` forwarded to both `count_by_paciente` and `list_by_paciente`

### `test_patient_list.py` — 4 tests
Tests [[file_application_use_cases_get_patient_list_py]] CPF hashing and pagination:
- Raw CPF hashed to SHA-256 before reaching repository
- No CPF filter → `cpf_hash_filter=None` to repository
- `limit > HARD_LIMIT` → silently capped
- Paginated result with correct total and items

### `test_submit_anamnesis.py` — 3 tests
Tests [[file_application_use_cases_submit_anamnesis_py]] orchestration:
- `create_rascunho` return value used as `avaliacao_id` for `insert_respostas`
- All four steps executed: rascunho → log_analise → respostas → scoring
- Checklist items forwarded verbatim to `ChecklistRepository.insert_respostas`

## Patterns

- **AsyncMock(spec=)** — enforces repository interface; fails on unknown methods.
- **No HTTP** — use cases are tested without booting FastAPI or hitting a server.
- **No DB** — repository adapters are mocked; SQL never executes.
- **`asyncio_mode = "auto"`** — all `async def test_*` functions run without
  `@pytest.mark.asyncio` decoration.

#directory #tests #unit #use-cases
