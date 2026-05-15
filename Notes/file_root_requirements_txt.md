---
title: requirements.txt
type: File
status: Planned
language: text
path: requirements.txt
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - dependencies
  - lockfile
related:
  - "[[file_root_pyproject_toml]]"
  - "[[file_root_Dockerfile]]"
  - "[[201_CI_Pipeline]]"
---

# `requirements.txt` — Compiled Dependency Lockfile

## Context & Purpose

While [[file_root_pyproject_toml]] is the **source of truth** for declared
dependencies, `requirements.txt` is the **compiled, fully-pinned closure** of
the dependency tree — every direct dep, every transitive dep, every hash.
It exists for two reasons:

1. **Reproducible builds.** [[file_root_Dockerfile]] installs from the
   lockfile so two builds at different times produce byte-identical images
   (modulo timestamps). This is the bedrock of reproducible deployments and
   supply-chain integrity.
2. **Air-gapped environments.** Brazilian hospital infrastructure
   occasionally lacks PyPI access; a self-contained `requirements.txt` plus
   wheels lets ops install offline.

## Logic Breakdown

The file is **generated, not hand-edited**. The recommended pipeline:

```bash
pip install pip-tools
pip-compile --generate-hashes --output-file=requirements.txt pyproject.toml
```

Each line takes the shape:

```
fastapi==0.115.4 \
    --hash=sha256:abc...
```

Optional secondary file `requirements-dev.txt` holds the dev extra similarly
compiled.

## Dependencies
- **External tooling:** `pip-tools` (`pip-compile`) or `uv` (`uv pip
  compile`); `uv` is ~10–100× faster and is the preferred backend in
  [[201_CI_Pipeline]] *(planned)*.
- **Source:** [[file_root_pyproject_toml]].

## Consumers
- [[file_root_Dockerfile]] (`pip install --require-hashes -r requirements.txt`).
- CI and reproducibility audits.
- Vulnerability scanners (`pip-audit`, `safety`, GitHub Dependabot).

## Invariants / Pitfalls
- **Hashes are mandatory.** Without `--require-hashes`, supply-chain attacks
  via dependency confusion become possible.
- Never edit by hand — drift from [[file_root_pyproject_toml]] is a Rule 2
  protocol violation. Re-run `pip-compile` and commit the diff.
- Renovate / Dependabot opens PRs against [[file_root_pyproject_toml]] and
  re-compiles `requirements.txt` in the same PR.
- Running `pip install -e ".[dev]"` for development bypasses this lockfile by
  design — devs need flexibility; deployments need determinism.

## Related ADRs
- [[002_Framework_Selection_FastAPI]]
- [[001_Architecture_and_Context]]
- [[201_CI_Pipeline]] *(planned)*

#file #root #dependencies #lockfile
