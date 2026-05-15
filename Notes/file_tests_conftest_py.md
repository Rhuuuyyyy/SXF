---
title: conftest.py
type: File
status: Active
language: python
path: tests/conftest.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[dir_tests]]"
tags:
  - file
  - tests
  - fixtures
  - conftest
  - pytest
related:
  - "[[dir_tests_unit_use_cases]]"
  - "[[file_interfaces_repositories_dashboard_repository_py]]"
  - "[[file_interfaces_repositories_avaliacao_read_repository_py]]"
  - "[[file_interfaces_repositories_patient_read_repository_py]]"
  - "[[file_interfaces_repositories_avaliacao_repository_py]]"
  - "[[file_interfaces_repositories_checklist_repository_py]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
---

# `tests/conftest.py` — Shared Pytest Fixtures

## Context & Purpose

Central fixture registry for all unit tests. Every fixture returns an
`AsyncMock(spec=<ConcreteClass>)` — the `spec=` argument is critical:
it constrains the mock to the real class's interface, so tests fail fast
if a repository method is renamed or removed.

## Logic Breakdown

All fixtures are function-scoped (pytest default), so each test gets a
fresh mock with no state leaking between tests.

| Fixture | Spec class | Used by |
|---|---|---|
| `mock_dashboard_repo` | `DashboardRepository` | `test_dashboard_stats.py` |
| `mock_avaliacao_read_repo` | `AvaliacaoReadRepository` | `test_patient_history.py` |
| `mock_patient_read_repo` | `PatientReadRepository` | `test_patient_list.py` |
| `mock_avaliacao_repo` | `AvaliacaoRepository` | `test_submit_anamnesis.py` |
| `mock_checklist_repo` | `ChecklistRepository` | `test_submit_anamnesis.py` |
| `mock_patient_repo` | `PatientRepository` | (future write tests) |
| `mock_scoring_orchestrator` | `SymptomScoringOrchestrator` | `test_submit_anamnesis.py` |
| `mock_session` | `AsyncSession` | `test_submit_anamnesis.py` |

## Dependencies
- **Internal:** all repository classes, `SymptomScoringOrchestrator`.
- **External:** `pytest`, `unittest.mock.AsyncMock`, `sqlalchemy[asyncio]`.

## Consumers
- All files under [[dir_tests_unit_use_cases]].

## Invariants / Pitfalls
- `spec=` MUST be a concrete class, not a Protocol or ABC, so that `AsyncMock`
  can introspect its method signatures.
- Never use `MagicMock` for async repository methods — `AsyncMock` is required.
- Adding a new repository class requires a corresponding fixture here so future
  tests can use it without boilerplate.

#file #tests #fixtures #conftest #pytest
