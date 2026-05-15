---
id: dir-tests
title: "tests/ — Suíte de Testes"
type: DirGuide
status: living
language: pt-BR
mirrors: "[[dir_tests]]"
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
children:
  - "[[br_file_tests_conftest_py]]"
  - "[[br_dir_tests_unit_use_cases]]"
tags:
  - directory
  - testes
  - qualidade
  - pytest
  - pt-br
related:
  - "[[br_file_root_pyproject_toml]]"
  - "[[br_300_Testing_Strategy]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `tests/` — Suíte de Testes

## Propósito

`tests/` é o **gate de qualidade automatizado** do projeto. A suíte é
estruturada em torno da camada de caso de uso — onde vivem todas as regras de
conformidade (k-anonimato, hash de CPF) — tornando 100% do comportamento de
negócio testável sem subir FastAPI ou PostgreSQL.

## Layout Real (Sprint 6)

```
tests/
├── conftest.py                       # Fakes AsyncMock(spec=); fixture de scoring
└── unit/
    └── use_cases/
        ├── test_submit_anamnesis.py  # 4 testes
        ├── test_register_patient.py  # 4 testes
        ├── test_get_patient_list.py  # 4 testes
        └── test_get_dashboard_stats.py  # 4 testes
```

**Total: 16 testes, 0 falhas.**

## `conftest.py` — Fixtures Principais

| Fixture | Tipo | Spec |
|---|---|---|
| `mock_avaliacao_repository` | `AsyncMock(spec=AvaliacaoRepository)` | Aplica superfície de port de escrita |
| `mock_checklist_repository` | `AsyncMock(spec=ChecklistRepository)` | Aplica superfície de port de checklist |
| `mock_scoring_orchestrator` | `AsyncMock(spec=SymptomScoringOrchestrator)` | Retorna `ScoringResult` controlado |
| `mock_patient_repository` | `AsyncMock(spec=PatientRepository)` | Aplica port de escrita de paciente |
| `mock_acompanhante_repository` | `AsyncMock(spec=AcompanhanteRepository)` | Retorna `None` (sem acompanhante) por padrão |
| `mock_patient_read_repository` | `AsyncMock(spec=PatientReadRepository)` | Retorna lista `PatientListItem` controlada |
| `mock_dashboard_repository` | `AsyncMock(spec=DashboardRepository)` | Retorna lista `DashboardRow` controlada |

`AsyncMock(spec=)` aplica a interface da classe real — chamar um método
inexistente levanta `AttributeError` imediatamente, prevenindo deriva silenciosa
do mock em relação ao código de produção.

## `asyncio_mode = "auto"`

Configurado em `pyproject.toml`:
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```
Todas as funções `async def test_*` executam sem decorador `@pytest.mark.asyncio`.

## Padrões de Teste

- **Arrange/Act/Assert** — fakes configurados em `conftest.py`; funções de
  teste individuais sobrescrevem valores de retorno conforme necessário.
- **Isolamento** — cada teste constrói sua própria instância de caso de uso;
  sem estado mutável compartilhado entre testes.
- **Caminho feliz + caminhos de erro** — cada módulo cobre pelo menos um
  caminho feliz e o caso de erro principal.
- **Asserções de conformidade** — `test_get_patient_list.py` verifica que o
  `cpf_hash_filter` passado ao repositório é igual ao SHA-256 dos dígitos
  brutos, não os dígitos em si.

## Adições Planejadas

| Camada | Ferramenta | Quando |
|---|---|---|
| Unit tests de domínio | `pytest` | Sprint 8 |
| Integration tests | `httpx.AsyncClient` + PostgreSQL Docker | Sprint 9 |
| Contract tests | Fake e adapter real contra Protocol | Sprint 9 |

## Dependências Permitidas

- `pytest`, `pytest-asyncio`, `unittest.mock`.
- Qualquer coisa de [[br_dir_app]] — testes são o único consumidor que pode
  importar entre todas as camadas livremente.

## Proibições

- Sem chamadas de rede em unit tests.
- Sem `AsyncMock` sem `spec=` — mocks sem spec ocultam deriva de interface.

## Relacionados

- [[br_file_tests_conftest_py]] — definições de fixtures.
- [[br_dir_tests_unit_use_cases]] — suíte de 16 testes.
- [[br_300_Testing_Strategy]] *(planejado)* — pirâmide e design de contract tests.

#directory #testes #qualidade #pytest #pt-br
