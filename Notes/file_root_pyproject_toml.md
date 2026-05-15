---
title: pyproject.toml
type: File
status: Active
language: toml
path: pyproject.toml
created_date: 2026-05-03
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - build
  - dependencies
  - tooling
related:
  - "[[file_root_requirements_txt]]"
  - "[[file_root_Dockerfile]]"
  - "[[002_Framework_Selection_FastAPI]]"
  - "[[001_Architecture_and_Context]]"
---

# `pyproject.toml` — Project Manifest, Dependencies, Tooling

## Context & Purpose

The single source of truth for:

1. **Project metadata** (name, version, description, authors, license).
2. **Runtime dependencies** ([[FastAPI]], [[Pydantic]], `pydantic-settings`,
   `uvicorn[standard]`).
3. **Optional dependency groups** (`dev` for `pytest`, `ruff`, `mypy`,
   `httpx`).
4. **Build backend** (`hatchling`) and the `app` wheel target.
5. **Tooling configuration** for `ruff`, `mypy`, `pytest`-asyncio.

Per [PEP 621](https://peps.python.org/pep-0621/) and PEP 517, `pyproject.toml`
is the modern, format-stable replacement for `setup.py` + `setup.cfg`.

## Logic Breakdown

Sections (current shape):

- `[project]` — PEP 621 metadata; `requires-python = ">=3.11"` because the
  domain model uses `match`/`case` and `Self` typing.
- `[project.optional-dependencies].dev` — testing & linting only; never
  pulled into [[file_root_Dockerfile]] runtime.
- `[build-system]` — `hatchling`, the Hatch project's PEP 517 backend, chosen
  for zero-config builds and good wheel reproducibility.
- `[tool.hatch.build.targets.wheel]` — limits the wheel to the `app/`
  package; tests, notes, and docs are excluded by design.
- `[tool.ruff]` — `line-length = 100`, `target-version = "py311"`. Linter
  rules selected: `E F I N B UP S A C4 T20`.
- `[tool.mypy]` — `strict = true`. Non-negotiable for the domain layer; a
  single `Any` leaking through Ports defeats the [[Repository_Pattern]].
- `[tool.pytest.ini_options]` — `asyncio_mode = "auto"`, `testpaths = ["tests"]`.

## Dependencies
- **External (runtime):** `fastapi>=0.115`, `uvicorn[standard]>=0.32`,
  `pydantic>=2.9`, `pydantic-settings>=2.6`, `sqlalchemy[asyncio]>=2.0`,
  `asyncpg>=0.30`, `python-multipart>=0.0.12`.
  JWT HS256 uses stdlib only (`hmac`/`hashlib`) — no third-party JWT library.
- **External (dev):** `pytest>=8.3`, `pytest-asyncio>=0.24`, `httpx>=0.27`,
  `ruff>=0.7`, `mypy>=1.13`.
- **Future:** `alembic`, `passlib[argon2]`, `python-jose[cryptography]` (Sprint 5 RS256).

## Consumers
- `pip install -e ".[dev]"` (developer setup).
- [[file_root_Dockerfile]] (build stage).
- CI matrix (`pip install -e ".[dev]"`).
- Renovate / Dependabot (dependency drift PRs).

## Invariants / Pitfalls
- **Pin major versions, allow minors.** `>=0.115` for FastAPI is acceptable
  because they follow semver, but `>=0.115,<1.0` is added once a 1.0 is
  released.
- Adding a runtime dep here is a public API change — review impact on
  [[file_root_Dockerfile]] image size and SBOM ([[201_CI_Pipeline]] *(planned)*).
- `mypy strict = true` — disabling per-module is acceptable only for adapter
  edges; the domain layer NEVER opts out. Enforced in
  [[003_Hexagonal_Architecture_Strategy]].
- Ruff selections include `S` (flake8-bandit) — tightens secret-handling and
  insecure-default detection, important for [[006_LGPD_PII_Strategy]].

## Related ADRs
- [[002_Framework_Selection_FastAPI]]
- [[001_Architecture_and_Context]]

#file #root #build #dependencies
