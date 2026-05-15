---
title: .gitignore
type: File
status: Active
language: gitignore
path: .gitignore
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - vcs
  - hygiene
  - security
related:
  - "[[file_root_env_example]]"
  - "[[001_Architecture_and_Context]]"
  - "[[006_LGPD_PII_Strategy]]"
  - "[[000_AI_OBSIDIAN_PROTOCOL]]"
---

# `.gitignore` — Repository Hygiene Filter

## Context & Purpose

Defines paths that `git` must never stage. Two responsibilities:

1. **Engineering hygiene** — keep build artefacts (`__pycache__`, `dist/`,
   `.mypy_cache`, `.ruff_cache`) and IDE metadata out of the diff stream.
2. **Security boundary** — guarantee that `.env`, credentials, key material
   and any LGPD-relevant local cache never accidentally reach the remote.
   See [[006_LGPD_PII_Strategy]] for why this matters.

## Logic Breakdown

Section by section:

- **Python build/runtime:** `__pycache__/`, `*.py[cod]`, `*.so`, `build/`,
  `dist/`, `*.egg-info/`, `.eggs/`.
- **Virtual environments:** `venv/`, `.venv/`, `env/` plus `.env` and
  `.env.local`, `.env.*.local`.
- **Testing & coverage:** `.pytest_cache/`, `.coverage`, `.coverage.*`,
  `htmlcov/`, `.tox/`.
- **Type checkers / linters:** `.mypy_cache/`, `.ruff_cache/`.
- **IDE noise:** `.vscode/`, `.idea/`, `*.swp`, `*.swo`, `.DS_Store`.
- **Obsidian:** `Notes/.obsidian/workspace*`, `Notes/.obsidian/cache`,
  `Notes/.trash/` — keep the *content* of the vault, drop user-local UI
  state. The vault is part of the source of truth (see
  [[000_AI_OBSIDIAN_PROTOCOL]]).

## Dependencies
None at runtime. Honoured by `git`, GitHub Actions, and any image build that
does `COPY . .` after `git ls-files`-style tooling.

## Consumers
- Every developer's local clone.
- CI runners (so secrets and caches never travel).
- The build context for [[file_root_Dockerfile]] (avoid bloating the image
  with caches).

## Invariants / Pitfalls
- **`.env` MUST appear in this list.** Removing it is a P0 security regression.
- Never use `git add -A` blindly without inspecting `git status`; the
  ignore-file is a safety net, not a substitute for review.
- If a secret is committed by accident, rotation is mandatory — the git
  history is forever. Refer to [[Incident_Response_Runbook]] *(planned)*.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[006_LGPD_PII_Strategy]]

#file #root #vcs #security
