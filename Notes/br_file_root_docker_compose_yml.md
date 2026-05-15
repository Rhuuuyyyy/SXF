---
title: docker-compose.yml
type: File
status: Planned
language: pt-BR
mirrors: "[[file_root_docker_compose_yml]]"
file_language: yaml
path: docker-compose.yml
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - docker
  - local-dev
  - orchestration
  - pt-br
related:
  - "[[br_file_root_Dockerfile]]"
  - "[[br_file_root_env_example]]"
  - "[[br_file_db_database_py]]"
  - "[[br_007_Audit_Logging_Middleware]]"
  - "[[br_200_Local_Development]]"
---

# `docker-compose.yml` — Orquestração Local

## Context & Purpose

Sobe a **stack de desenvolvimento local** com um único comando:
`docker compose up`. **Não** é o artefato de deploy de produção —
esse vive nos manifests de K8s do time de plataforma
([[br_202_Deployment_Topology]] *(planejado)*). Este arquivo existe
para que qualquer dev, DBA ou engenheiro de frontend rode um backend
totalmente conectado em menos de 60 segundos no laptop.

## Logic Breakdown

Três services em v1:

1. **`api`** — built de [[br_file_root_Dockerfile]]. Mounta o repo para
   live-reload (`uvicorn --reload`). Expõe `8000:8000`. Lê `.env`.
2. **`postgres`** — `postgres:16-alpine`. Volume montado em
   `./.docker/pgdata` para persistência entre restarts. Owner em spec
   do [[br_DBA_Team]] mas operado pelo time de dev localmente.
3. **`audit-sink`** *(planejado)* — destino append-only do
   [[br_007_Audit_Logging_Middleware]]. Pode ser um segundo role
   Postgres ou uma instância OpenSearch dependendo da decisão final em
   [[br_007_Audit_Logging_Middleware]].

```yaml
services:
  api:
    build: .
    env_file: .env
    ports: ["8000:8000"]
    depends_on: [postgres]
    volumes: [".:/app"]
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: sxfp
      POSTGRES_PASSWORD: sxfp
      POSTGRES_DB: sxfp
    volumes: [".docker/pgdata:/var/lib/postgresql/data"]
    ports: ["5432:5432"]
```

## Dependencies
- **Externo:** Docker Engine ≥ 24, Docker Compose v2.
- **Imagem:** [[br_file_root_Dockerfile]].
- **Env:** [[br_file_root_env_example]] (dev copia → `.env`).

## Consumers
- Workstations de devs (`docker compose up`).
- Job de integração em CI (`docker compose run --rm api pytest`).

## Invariants / Pitfalls
- **Nunca use estas credenciais em qualquer lugar exceto local** — os
  seeds `sxfp/sxfp` são fracos de propósito para o arquivo permanecer
  compartilhável. Secrets reais vivem no vault de deploy.
- O diretório `.docker/pgdata` DEVE estar em [[br_file_root_gitignore]]
  (está).
- Mount de live-reload funciona em Linux/macOS mas é lento em Windows
  + WSL2; esse trade-off está documentado em
  [[br_200_Local_Development]] *(planejado)*.
- O service `api` roda como usuário não-root herdado de
  [[br_file_root_Dockerfile]]; arquivos volume-montados precisam ser
  legíveis por esse usuário.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_202_Deployment_Topology]] *(planejado)*

#file #root #docker #local-dev #pt-br
