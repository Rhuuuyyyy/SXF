---
title: Dockerfile
type: File
status: Planned
language: pt-BR
mirrors: "[[file_root_Dockerfile]]"
file_language: dockerfile
path: Dockerfile
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - docker
  - container
  - deployment
  - pt-br
related:
  - "[[br_file_root_docker_compose_yml]]"
  - "[[br_file_root_pyproject_toml]]"
  - "[[br_file_root_requirements_txt]]"
  - "[[br_file_root_main_py]]"
  - "[[br_202_Deployment_Topology]]"
---

# `Dockerfile` — Imagem de Container de Produção

## Context & Purpose

Receita para a imagem OCI imutável e reproduzível que roda o backend
SXFp em todo ambiente que não seja laptop (CI, staging, produção). É
consumida por [[br_file_root_docker_compose_yml]] para dev local e pelo
pipeline K8s do time de plataforma para produção. A imagem precisa ser
**pequena, não-root e cacheável**.

## Logic Breakdown

Build multi-stage em três fases:

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

Características-chave:

- **`python:3.11-slim`** — base ~45 MB, glibc para os wheels do core
  Rust do [[br_Pydantic]] v2. Evita `alpine` porque `pydantic-core`
  shipa wheels musl com regressões de performance conhecidas.
- **Multi-stage** — wheels constroem no builder; só artefatos vão para
  runtime. Elimina `gcc`, `make`, headers do build da imagem final.
  Delta de tamanho típico: ~250 MB → ~110 MB.
- **Usuário não-root `app`** — defesa em profundidade; mitiga CVEs de
  container escape e alinha com princípios de containment de
  [[br_006_LGPD_PII_Strategy]].
- **`PYTHONDONTWRITEBYTECODE=1`** — sem escritas `.pyc` em runtime;
  filesystems read-only mais limpos.
- **`PYTHONUNBUFFERED=1`** — necessário para streaming de logs ao
  vivo no stdout (consumido pelo handler estruturado de
  [[br_file_utils_logger_py]]).
- **Entry direto via `uvicorn`** — sem wrapper shell; PID 1 é o ASGI
  server, então signal handling está correto.

## Dependencies
- **Imagem base:** `python:3.11-slim`.
- **Lê:** [[br_file_root_pyproject_toml]] (e opcionalmente
  [[br_file_root_requirements_txt]] para workflows legacy / lockfile).
- **Copia:** o package `app/` — roda [[br_file_root_main_py]] como app
  ASGI.

## Consumers
- [[br_file_root_docker_compose_yml]] (local).
- Stage de build de imagem em CI.
- Manifest Deployment K8s de produção
  ([[br_202_Deployment_Topology]] *(planejado)*).

## Invariants / Pitfalls
- Nunca `COPY .` para a imagem — o contexto de build deve ser filtrado
  por `.dockerignore` (espelho de [[br_file_root_gitignore]] mais
  `Notes/` e artefatos de teste).
- O container DEVE rodar como `USER app`; reverter para root é
  regressão de segurança.
- Imagens de produção DEVEM ser tagueadas com o SHA git imutável,
  nunca `latest`.
- Para SBOM e scan de CVE, a imagem é assinada via Sigstore no momento
  do release — ver [[br_201_CI_Pipeline]] *(planejado)*.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_202_Deployment_Topology]] *(planejado)*

#file #root #docker #container #pt-br
