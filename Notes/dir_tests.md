---
id: dir-tests
title: "tests/ — Test Suite"
type: DirGuide
status: living
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
children:
  - "[[file_tests_conftest_py]]"
  - "[[dir_tests_unit_use_cases]]"
tags:
  - directory
  - tests
  - quality
  - pytest
related:
  - "[[file_root_pyproject_toml]]"
  - "[[300_Testing_Strategy]]"
  - "[[001_Architecture_and_Context]]"
  - "[[003_Hexagonal_Architecture_Strategy]]"
---

# `tests/` — Test Suite

## Purpose

`tests/` is the project's **automated quality gate**. The suite is structured
around the use case layer — where all compliance rules (k-anonymity, CPF
hashing) live — making 100% of the business behaviour testable without
booting FastAPI or PostgreSQL.

## Actual Layout (Sprint 6)

```
tests/
├── conftest.py                       # AsyncMock(spec=) repository fakes; scoring fixture
└── unit/
    └── use_cases/
        ├── test_submit_anamnesis.py  # 4 tests
        ├── test_register_patient.py  # 4 tests
        ├── test_get_patient_list.py  # 4 tests
        └── test_get_dashboard_stats.py  # 4 tests
```

**Total: 16 tests, 0 failures.**

## `conftest.py` — Key Fixtures

| Fixture | Type | Spec |
|---|---|---|
| `mock_avaliacao_repository` | `AsyncMock(spec=AvaliacaoRepository)` | Enforces write-side port surface |
| `mock_checklist_repository` | `AsyncMock(spec=ChecklistRepository)` | Enforces checklist port surface |
| `mock_scoring_orchestrator` | `AsyncMock(spec=SymptomScoringOrchestrator)` | Returns controlled `ScoringResult` |
| `mock_patient_repository` | `AsyncMock(spec=PatientRepository)` | Enforces patient write port |
| `mock_acompanhante_repository` | `AsyncMock(spec=AcompanhanteRepository)` | Returns `None` (no companion) by default |
| `mock_patient_read_repository` | `AsyncMock(spec=PatientReadRepository)` | Returns controlled `PatientListItem` list |
| `mock_dashboard_repository` | `AsyncMock(spec=DashboardRepository)` | Returns controlled `DashboardRow` list |

`AsyncMock(spec=)` enforces the real class interface — calling a non-existent
method raises `AttributeError` immediately, preventing silent mock drift from
production code.

## `asyncio_mode = "auto"`

Configured in `pyproject.toml`:
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```
All `async def test_*` functions run without a `@pytest.mark.asyncio` decorator.

## Test Patterns

- **Arrange/Act/Assert** — fakes are configured in `conftest.py`; individual
  test functions override return values as needed.
- **Isolation** — each test constructs its own use case instance; no shared
  mutable state between tests.
- **Happy path + error paths** — each test module covers at least one happy
  path and the primary error case (e.g. `LGPDComplianceError`,
  `ValueError` on invalid CPF).
- **Compliance assertions** — `test_get_patient_list.py` asserts that the
  `cpf_hash_filter` passed to the repository equals
  `hashlib.sha256(raw_cpf.encode()).hexdigest()`, not the raw digits.

## Planned Additions

| Layer | Tool | When |
|---|---|---|
| Domain unit tests | `pytest` | Sprint 8 |
| Integration tests | `httpx.AsyncClient` + Docker PostgreSQL | Sprint 9 |
| Contract tests | Both fake and real adapter against Protocol | Sprint 9 |

## Allowed Dependencies

- `pytest`, `pytest-asyncio`, `unittest.mock`.
- Anything from [[dir_app]] — tests are the only consumer that may import
  across all layers freely.

## Forbidden

- No network calls in unit tests.
- No `AsyncMock` without `spec=` — unspecced mocks hide interface drift.

## Related

- [[file_tests_conftest_py]] — fixture definitions.
- [[dir_tests_unit_use_cases]] — 16-test suite.
- [[300_Testing_Strategy]] *(planned)* — pyramid targets and contract test design.

#directory #tests #pytest #quality
