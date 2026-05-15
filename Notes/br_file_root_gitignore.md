---
title: .gitignore
type: File
status: Active
language: pt-BR
mirrors: "[[file_root_gitignore]]"
file_language: gitignore
path: .gitignore
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - vcs
  - hygiene
  - security
  - pt-br
related:
  - "[[br_file_root_env_example]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_000_AI_OBSIDIAN_PROTOCOL]]"
---

# `.gitignore` — Filtro de Higiene do Repo

## Context & Purpose

Define caminhos que o `git` jamais deve incluir no stage. Duas
responsabilidades:

1. **Higiene de engenharia** — manter artefatos de build (`__pycache__`,
   `dist/`, `.mypy_cache`, `.ruff_cache`) e metadata de IDE fora do
   stream de diffs.
2. **Boundary de segurança** — garantir que `.env`, credenciais, key
   material e qualquer cache local relevante para LGPD nunca cheguem ao
   remote acidentalmente. Ver [[br_006_LGPD_PII_Strategy]] para o
   porquê.

## Logic Breakdown

Seção por seção:

- **Build/runtime Python:** `__pycache__/`, `*.py[cod]`, `*.so`,
  `build/`, `dist/`, `*.egg-info/`, `.eggs/`.
- **Virtual environments:** `venv/`, `.venv/`, `env/` mais `.env` e
  `.env.local`, `.env.*.local`.
- **Testing & coverage:** `.pytest_cache/`, `.coverage`, `.coverage.*`,
  `htmlcov/`, `.tox/`.
- **Type checkers / linters:** `.mypy_cache/`, `.ruff_cache/`.
- **Ruído de IDE:** `.vscode/`, `.idea/`, `*.swp`, `*.swo`, `.DS_Store`.
- **Obsidian:** `Notes/.obsidian/workspace*`, `Notes/.obsidian/cache`,
  `Notes/.trash/` — manter o *conteúdo* do vault, descartar estado
  local de UI. O vault é parte da fonte da verdade (ver
  [[br_000_AI_OBSIDIAN_PROTOCOL]]).

## Dependencies
Nenhuma em runtime. Honrado pelo `git`, GitHub Actions e qualquer build
de imagem que faça `COPY . .` após tooling tipo `git ls-files`.

## Consumers
- Todo clone local de dev.
- Runners de CI (para que secrets e caches nunca viajem).
- Contexto de build de [[br_file_root_Dockerfile]] (evitar inflar a
  imagem com caches).

## Invariants / Pitfalls
- **`.env` DEVE aparecer nesta lista.** Removê-lo é regressão de
  segurança P0.
- Nunca use `git add -A` cego sem inspecionar `git status`; o
  ignore-file é rede de segurança, não substituto de revisão.
- Se um secret é commitado por acidente, rotação é mandatória — o
  histórico do git é para sempre. Ver
  [[br_Incident_Response_Runbook]] *(planejado)*.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_006_LGPD_PII_Strategy]]

#file #root #vcs #security #pt-br
