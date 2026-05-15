---
title: pyproject.toml
type: File
status: Active
language: pt-BR
mirrors: "[[file_root_pyproject_toml]]"
file_language: toml
path: pyproject.toml
created_date: 2026-05-03
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - build
  - dependencies
  - tooling
  - pt-br
related:
  - "[[br_file_root_requirements_txt]]"
  - "[[br_file_root_Dockerfile]]"
  - "[[br_002_Framework_Selection_FastAPI]]"
  - "[[br_001_Architecture_and_Context]]"
---

# `pyproject.toml` — Manifest do Projeto, Dependências, Tooling

## Context & Purpose

Fonte única da verdade para:

1. **Metadata do projeto** (name, version, description, authors,
   license).
2. **Dependências de runtime** ([[br_FastAPI]], [[br_Pydantic]],
   `pydantic-settings`, `uvicorn[standard]`).
3. **Grupos de dependências opcionais** (`dev` para `pytest`, `ruff`,
   `mypy`, `httpx`).
4. **Build backend** (`hatchling`) e o target wheel `app`.
5. **Configuração de tooling** para `ruff`, `mypy`, `pytest-asyncio`.

Por [PEP 621](https://peps.python.org/pep-0621/) e PEP 517,
`pyproject.toml` é o substituto moderno e estável de formato para
`setup.py` + `setup.cfg`.

## Logic Breakdown

Seções (formato atual):

- `[project]` — metadata PEP 621; `requires-python = ">=3.11"` porque o
  modelo de domínio usa `match`/`case` e tipagem `Self`.
- `[project.optional-dependencies].dev` — apenas testing & linting;
  nunca puxado para o runtime de [[br_file_root_Dockerfile]].
- `[build-system]` — `hatchling`, o backend PEP 517 do Hatch, escolhido
  por builds zero-config e boa reprodutibilidade de wheel.
- `[tool.hatch.build.targets.wheel]` — limita o wheel ao package
  `app/`; testes, notes e docs são excluídos por design.
- `[tool.ruff]` — `line-length = 100`, `target-version = "py311"`.
  Regras selecionadas: `E F I N B UP S A C4 T20`.
- `[tool.mypy]` — `strict = true`. Não-negociável para a camada de
  domínio; um único `Any` vazando pelos Ports derrota o
  [[br_Repository_Pattern]].
- `[tool.pytest.ini_options]` — `asyncio_mode = "auto"`,
  `testpaths = ["tests"]`.

## Dependencies
- **Externas (runtime):** `fastapi>=0.115`, `uvicorn[standard]>=0.32`,
  `pydantic>=2.9`, `pydantic-settings>=2.6`.
- **Externas (dev):** `pytest>=8.3`, `pytest-asyncio>=0.24`,
  `httpx>=0.27`, `ruff>=0.7`, `mypy>=1.13`.
- **Futuro:** `sqlalchemy[asyncio]`, `alembic`, `passlib[argon2]`,
  `python-jose[cryptography]` para [[br_file_core_security_py]].

## Consumers
- `pip install -e ".[dev]"` (setup do dev).
- [[br_file_root_Dockerfile]] (stage de build).
- Matriz CI (`pip install -e ".[dev]"`).
- Renovate / Dependabot (PRs de drift de dependência).

## Invariants / Pitfalls
- **Pinar majors, permitir minors.** `>=0.115` para FastAPI é aceitável
  porque eles seguem semver, mas `>=0.115,<1.0` é adicionado quando um
  1.0 sair.
- Adicionar uma dep de runtime aqui é mudança de API pública — revise
  impacto no tamanho da imagem [[br_file_root_Dockerfile]] e no SBOM
  ([[br_201_CI_Pipeline]] *(planejado)*).
- `mypy strict = true` — desabilitar por módulo é aceitável apenas em
  bordas de adapter; a camada de domínio NUNCA opta sair. Aplicado em
  [[br_003_Hexagonal_Architecture_Strategy]].
- Seleções do Ruff incluem `S` (flake8-bandit) — aperta detecção de
  handling de secrets e defaults inseguros, importante para
  [[br_006_LGPD_PII_Strategy]].

## Related ADRs
- [[br_002_Framework_Selection_FastAPI]]
- [[br_001_Architecture_and_Context]]

#file #root #build #dependencies #pt-br
