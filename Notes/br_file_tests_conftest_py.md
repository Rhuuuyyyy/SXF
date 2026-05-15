---
title: conftest.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_tests_conftest_py]]"
file_language: python
path: tests/conftest.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_tests]]"
tags:
  - file
  - tests
  - fixtures
  - conftest
  - pytest
  - pt-br
related:
  - "[[br_dir_tests_unit_use_cases]]"
  - "[[br_file_interfaces_repositories_dashboard_repository_py]]"
  - "[[br_file_interfaces_repositories_avaliacao_read_repository_py]]"
  - "[[br_file_interfaces_repositories_patient_read_repository_py]]"
  - "[[br_file_interfaces_repositories_avaliacao_repository_py]]"
  - "[[br_file_interfaces_repositories_checklist_repository_py]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
---

# `tests/conftest.py` — Fixtures Compartilhadas do Pytest

## Contexto & Propósito

Registro central de fixtures para todos os testes unitários. Cada fixture retorna
um `AsyncMock(spec=<ClasseConcreta>)` — o argumento `spec=` é fundamental:
restringe o mock à interface real da classe, de forma que os testes falhem
rapidamente se um método do repositório for renomeado ou removido.

## Logic Breakdown

Todas as fixtures têm escopo de função (padrão do pytest), então cada teste
recebe um mock limpo sem estado vazando entre execuções.

| Fixture | Classe spec | Usada por |
|---|---|---|
| `mock_dashboard_repo` | `DashboardRepository` | `test_dashboard_stats.py` |
| `mock_avaliacao_read_repo` | `AvaliacaoReadRepository` | `test_patient_history.py` |
| `mock_patient_read_repo` | `PatientReadRepository` | `test_patient_list.py` |
| `mock_avaliacao_repo` | `AvaliacaoRepository` | `test_submit_anamnesis.py` |
| `mock_checklist_repo` | `ChecklistRepository` | `test_submit_anamnesis.py` |
| `mock_patient_repo` | `PatientRepository` | (testes de escrita futuros) |
| `mock_scoring_orchestrator` | `SymptomScoringOrchestrator` | `test_submit_anamnesis.py` |
| `mock_session` | `AsyncSession` | `test_submit_anamnesis.py` |

## Dependências
- **Internas:** todas as classes de repositório, `SymptomScoringOrchestrator`.
- **Externas:** `pytest`, `unittest.mock.AsyncMock`, `sqlalchemy[asyncio]`.

## Consumidores
- Todos os arquivos em [[br_dir_tests_unit_use_cases]].

## Invariantes / Armadilhas
- `spec=` DEVE ser uma classe concreta, não um Protocol ou ABC.
- Nunca use `MagicMock` para métodos assíncronos de repositório — `AsyncMock` é obrigatório.

#file #tests #fixtures #conftest #pytest #pt-br
