---
title: docker-compose.yml
type: File
status: Planned
language: yaml
path: docker-compose.yml
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[100_Codebase_and_Directory_Map]]"
tags:
  - file
  - root
  - docker
  - local-dev
  - orchestration
related:
  - "[[file_root_Dockerfile]]"
  - "[[file_root_env_example]]"
  - "[[file_db_database_py]]"
  - "[[007_Audit_Logging_Middleware]]"
  - "[[200_Local_Development]]"
---

# `docker-compose.yml` — Local Orchestration

## Context & Purpose

Boots the **local development stack** with a single command:
`docker compose up`. It is **not** the production deployment artefact — that
lives in the K8s manifests owned by the platform team
([[202_Deployment_Topology]] *(planned)*). This file exists so any developer,
DBA, or frontend engineer can spin a fully-wired backend on their laptop in
under 60 seconds.

## Logic Breakdown

Three services in v1:

1. **`api`** — built from [[file_root_Dockerfile]]. Mounts the repo for
   live-reload (`uvicorn --reload`). Exposes `8000:8000`. Reads `.env`.
2. **`postgres`** — `postgres:16-alpine`. Volume-mounted at
   `./.docker/pgdata` for persistence across restarts. Owned in spec by
   the [[DBA_Team]] but operated by the dev team locally.
3. **`audit-sink`** *(planned)* — append-only sink target for
   [[007_Audit_Logging_Middleware]]. May be a second Postgres role or an
   `OpenSearch` instance depending on the [[007_Audit_Logging_Middleware]]
   final decision.

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
- **External:** Docker Engine ≥ 24, Docker Compose v2.
- **Image source:** [[file_root_Dockerfile]].
- **Env source:** [[file_root_env_example]] (developer copies → `.env`).

## Consumers
- Developer workstations (`docker compose up`).
- CI integration job (`docker compose run --rm api pytest`).

## Invariants / Pitfalls
- **Never use these credentials anywhere but locally** — the seeds
  `sxfp/sxfp` are intentionally weak so the file remains shareable. Real
  secrets live in the deployment vault.
- The `.docker/pgdata` directory MUST be in [[file_root_gitignore]] (it is).
- Live-reload mount works on Linux/macOS but is slow on Windows + WSL2; that
  trade-off is documented in [[200_Local_Development]] *(planned)*.
- The `api` service runs as a non-root user inherited from
  [[file_root_Dockerfile]]; volume-mounted files must be readable by that
  user.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[007_Audit_Logging_Middleware]]
- [[202_Deployment_Topology]] *(planned)*

#file #root #docker #local-dev
