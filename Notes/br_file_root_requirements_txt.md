---
title: requirements.txt
type: File
status: Planned
language: pt-BR
mirrors: "[[file_root_requirements_txt]]"
file_language: text
path: requirements.txt
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - dependencies
  - lockfile
  - pt-br
related:
  - "[[br_file_root_pyproject_toml]]"
  - "[[br_file_root_Dockerfile]]"
  - "[[br_201_CI_Pipeline]]"
---

# `requirements.txt` — Lockfile Compilado de Dependências

## Context & Purpose

Enquanto [[br_file_root_pyproject_toml]] é a **fonte da verdade** para
dependências declaradas, `requirements.txt` é o **fechamento compilado
e totalmente pinado** da árvore de dependências — toda dep direta, toda
transitiva, todo hash. Existe por dois motivos:

1. **Builds reprodutíveis.** [[br_file_root_Dockerfile]] instala do
   lockfile para que dois builds em momentos diferentes produzam imagens
   byte-idênticas (módulo timestamps). Esta é a base de deployments
   reprodutíveis e integridade de supply chain.
2. **Ambientes air-gapped.** Infraestrutura de hospitais brasileiros
   ocasionalmente não tem acesso a PyPI; um `requirements.txt`
   self-contained mais wheels permite que ops instale offline.

## Logic Breakdown

O arquivo é **gerado, não editado à mão**. Pipeline recomendado:

```bash
pip install pip-tools
pip-compile --generate-hashes --output-file=requirements.txt pyproject.toml
```

Cada linha tem o formato:

```
fastapi==0.115.4 \
    --hash=sha256:abc...
```

Arquivo secundário opcional `requirements-dev.txt` segura o extra dev
compilado similarmente.

## Dependencies
- **Tooling externo:** `pip-tools` (`pip-compile`) ou `uv`
  (`uv pip compile`); `uv` é ~10–100× mais rápido e é o backend
  preferido em [[br_201_CI_Pipeline]] *(planejado)*.
- **Origem:** [[br_file_root_pyproject_toml]].

## Consumers
- [[br_file_root_Dockerfile]] (`pip install --require-hashes -r
  requirements.txt`).
- Auditorias de CI e reprodutibilidade.
- Scanners de vulnerabilidade (`pip-audit`, `safety`, GitHub
  Dependabot).

## Invariants / Pitfalls
- **Hashes são mandatórios.** Sem `--require-hashes`, ataques de
  supply chain via dependency confusion ficam possíveis.
- Nunca edite à mão — drift de [[br_file_root_pyproject_toml]] é
  violação da Regra 2. Re-rode `pip-compile` e commite o diff.
- Renovate / Dependabot abrem PRs contra
  [[br_file_root_pyproject_toml]] e re-compilam `requirements.txt` no
  mesmo PR.
- Rodar `pip install -e ".[dev]"` para desenvolvimento contorna esse
  lockfile por design — devs precisam de flexibilidade; deployments
  precisam de determinismo.

## Related ADRs
- [[br_002_Framework_Selection_FastAPI]]
- [[br_001_Architecture_and_Context]]
- [[br_201_CI_Pipeline]] *(planejado)*

#file #root #dependencies #lockfile #pt-br
