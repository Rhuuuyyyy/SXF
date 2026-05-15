---
title: Dockerfile
type: File
status: Planned
language: dockerfile
path: Dockerfile
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - docker
  - container
  - deployment
related:
  - "[[file_root_docker_compose_yml]]"
  - "[[file_root_pyproject_toml]]"
  - "[[file_root_requirements_txt]]"
  - "[[file_root_main_py]]"
  - "[[202_Deployment_Topology]]"
---

# `Dockerfile` — Production Container Image

## Context & Purpose

Recipe for the immutable, reproducible OCI image that runs the SXFp backend
in every non-laptop environment (CI, staging, production). It is consumed by
[[file_root_docker_compose_yml]] for local dev and by the platform team's
K8s pipeline for production. The image must be **small, non-root, and
cacheable**.

## Logic Breakdown

Multi-stage build in three stages:

```dockerfile
# Stage 1 — builder
FROM python:3.11-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /build
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install --prefix=/install ".[prod]"

# Stage 2 — runtime
FROM python:3.11-slim AS runtime
RUN groupadd --system app && useradd --system --gid app --home /app app
WORKDIR /app
COPY --from=builder /install /usr/local
COPY app ./app
USER app
EXPOSE 8000
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Key characteristics:

- **`python:3.11-slim`** — ~45 MB base, glibc-based for [[Pydantic]] v2's
  Rust core wheels. Avoids `alpine` because `pydantic-core` ships musl wheels
  with known performance regressions.
- **Multi-stage** — wheels build in the builder stage; only artefacts are
  copied to runtime. Eliminates `gcc`, `make`, build headers from final
  image. Typical size delta: ~250 MB → ~110 MB.
- **Non-root user `app`** — defence in depth; mitigates container escape
  CVEs and aligns with [[006_LGPD_PII_Strategy]] containment principles.
- **`PYTHONDONTWRITEBYTECODE=1`** — no `.pyc` writes at runtime; cleaner
  read-only filesystems.
- **`PYTHONUNBUFFERED=1`** — required for live log streaming to stdout
  (consumed by [[file_utils_logger_py]]'s structured handler).
- **`uvicorn` direct entry** — no shell wrapper; `PID 1` is the ASGI server,
  so signal handling is correct.

## Dependencies
- **Base image:** `python:3.11-slim`.
- **Reads:** [[file_root_pyproject_toml]] (and optionally
  [[file_root_requirements_txt]] for legacy / lockfile workflows).
- **Copies:** the `app/` package — runs [[file_root_main_py]] as ASGI app.

## Consumers
- [[file_root_docker_compose_yml]] (local).
- CI's image-build stage.
- Production K8s Deployment manifest ([[202_Deployment_Topology]] *(planned)*).

## Invariants / Pitfalls
- Never `COPY .` into the image — build context must be filtered by
  `.dockerignore` (mirror of [[file_root_gitignore]] plus `Notes/` and
  test artefacts).
- The container MUST run as `USER app`; reverting to root is a security
  regression.
- Production images MUST be tagged with the immutable git SHA, never `latest`.
- For SBOM and CVE scanning, the image is signed via Sigstore at release
  time — see [[201_CI_Pipeline]] *(planned)*.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[006_LGPD_PII_Strategy]]
- [[202_Deployment_Topology]] *(planned)*

#file #root #docker #container
