# SXFp Backend — Clinical Decision-Support Platform for Fragile X Syndrome

SXFp (Síndrome do X Frágil — Plataforma) is a healthcare backend that supports
the clinical screening and diagnosis management of **Fragile X Syndrome (FXS)**
in Brazil. The system is designed and operated in accordance with the **Lei
Geral de Proteção de Dados (LGPD)** — Brazil's data-protection law
(Lei n. 13.709/2018).

This repository contains the **Python backend only**. The frontend client and
the PostgreSQL database are owned by partner teams and integrate through the
API contracts and interface definitions in this codebase.

---

## Architecture

The backend implements a **Hexagonal Architecture (Ports and Adapters)**
structured in four layers:

```
app/
├── domain/           # Innermost — entities, value objects, domain services, ports
├── application/      # Use cases — orchestration, LGPD compliance rules
│   └── use_cases/
├── interfaces/       # Outbound adapters — SQLAlchemy repositories; inbound — FastAPI DI
│   ├── api/
│   └── repositories/
└── presentation/     # Outermost — HTTP routers, Pydantic request/response schemas
    └── api/v1/
```

Key architectural decisions are documented as Architecture Decision Records (ADRs)
in `Notes/ADRs/`. The most consequential ones for new contributors:

| ADR | Decision |
|---|---|
| ADR-001 | PostgreSQL handles PGP field encryption, bcrypt hashing, and FXS scoring via stored functions. Python writes to named views, not physical tables. |
| ADR-002 | JWT authentication uses a custom stdlib HS256 implementation (no third-party JWT library) due to system `cryptography` extension constraints. |
| ADR-003 | K-anonymity threshold (K=5) is enforced in the application use case layer, not the repository, for testability and auditability. |
| ADR-004 | CPF digits are hashed to SHA-256 in the use case layer before reaching any repository. Raw CPF never appears in SQL parameters. |
| ADR-005 | `Patient.criado_por_db_id: int` carries the database integer PK of the creating doctor. The `_db_id` suffix signals deliberate infrastructure coupling. |

---

## Technology Stack

| Component | Technology |
|---|---|
| Language | Python 3.11+ |
| Web framework | FastAPI (ASGI) |
| Database driver | SQLAlchemy 2.x async + asyncpg |
| Data validation | Pydantic v2 |
| Configuration | pydantic-settings |
| Authentication | Stdlib HS256 JWT (hmac + hashlib) |
| Encryption at rest | PostgreSQL PGP via pgcrypto extension |
| Password hashing | PostgreSQL bcrypt via trigger |
| Clinical scoring | PostgreSQL stored function `fn_calcular_score_triagem` |

---

## API Overview

All authenticated endpoints require a `Bearer` JWT obtained from `POST /api/v1/auth/login`.

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Liveness probe | None |
| `POST` | `/api/v1/auth/login` | Authenticate doctor; receive JWT | None |
| `POST` | `/api/v1/auth/logout` | Close session | JWT |
| `POST` | `/api/v1/pacientes` | Register a new patient | JWT |
| `GET` | `/api/v1/pacientes` | List registered patients (paginated, filterable) | JWT |
| `POST` | `/api/v1/anamnesis` | Submit checklist and trigger FXS score | JWT |
| `GET` | `/api/v1/pacientes/{id}/historico` | Patient evaluation history | JWT |
| `GET` | `/api/v1/dashboard/stats` | Anonymised aggregate statistics (k-anonymity enforced) | JWT |
| `POST` | `/api/v1/dashboard/refresh` | Refresh materialised view | JWT + admin role |

Interactive documentation (Swagger UI) is available at `/api/v1/docs` when the
server is running.

---

## Security and LGPD Compliance

- **PII fields** (patient name, CPF) are encrypted at rest using PostgreSQL
  `pgp_sym_encrypt()` via `INSTEAD OF INSERT` triggers on named views. The PGP
  key is injected per database session via `set_config()` and never stored in
  any column or log.
- **CPF** is stored exclusively as a SHA-256 hex hash. Raw digits never appear
  in SQL parameters, application logs, or API responses.
- **Response masking**: patient names in API responses are masked
  (`"João Silva"` becomes `"João S***"`).
- **K-anonymity**: dashboard statistics are suppressed entirely if any
  demographic group has fewer than 5 evaluations.
- **Audit trail**: all authentication events are recorded in `tb_log_sessoes`
  and `tb_log_tentativas_login`.
- **JWT tokens** expire after 30 minutes. Brute-force protection enforces a
  request threshold per IP address before credential verification.

---

## Development Setup

### Prerequisites

- Python 3.11 or later
- PostgreSQL 14 or later with the `pgcrypto` extension enabled
- A running PostgreSQL instance with the SXFp schema applied

### Local startup

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
# .venv\Scripts\activate           # Windows

# Install dependencies (including development extras)
pip install -e ".[dev]"

# Configure environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL, PGP_KEY, SECRET_KEY at minimum

# Start the development server with hot reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Navigate to `http://127.0.0.1:8000/health` to confirm the server is running.
Navigate to `http://127.0.0.1:8000/api/v1/docs` for the interactive API documentation.

### Running the test suite

```bash
pytest tests/ -v
```

The test suite uses `pytest-asyncio` in `auto` mode. All 16 unit tests run
without a database connection using `AsyncMock(spec=)` repository fakes.

---

## Documentation

All architectural decisions, codebase maps, security policies, and design
patterns live as an Obsidian vault under `Notes/`. Open that directory in
Obsidian for the navigable knowledge graph.

Entry points:

| Document | Description |
|---|---|
| `Notes/000_Home_Backend_MOC.md` | Master index — start here |
| `Notes/001_Architecture_and_Context.md` | Business context and architectural drivers |
| `Notes/ADRs/` | Five Architecture Decision Records (ADRs 001–005) |
| `Notes/100_Codebase_and_Directory_Map.md` | Full directory and file map |

The PT-BR mirror of every note is prefixed `br_` (e.g. `Notes/br_000_Home_Backend_MOC.md`).

---

## Project Layout

```
SXFp/
├── app/
│   ├── core/               # Settings, exceptions, JWT (cross-cutting)
│   ├── db/                 # Async engine, session factory, PGP key injection
│   ├── domain/             # Entities, value objects, domain services, ports
│   ├── application/
│   │   ├── dtos/           # Application-layer data transfer objects
│   │   └── use_cases/      # Business orchestration + LGPD compliance rules
│   ├── interfaces/
│   │   ├── api/            # FastAPI dependency injection providers
│   │   └── repositories/   # SQLAlchemy adapters (write + read)
│   ├── presentation/
│   │   └── api/v1/
│   │       ├── routers/    # HTTP path operations
│   │       └── schemas/    # Pydantic request/response models
│   ├── services/           # Auth service (session management, brute-force)
│   └── main.py             # ASGI entry point and composition root
├── tests/
│   ├── conftest.py
│   └── unit/use_cases/     # 16 unit tests, 0 failures
├── Notes/                  # Obsidian vault (documentation)
│   └── ADRs/               # Architecture Decision Records
├── alembic/                # Database migrations
├── pyproject.toml
└── .env.example
```
