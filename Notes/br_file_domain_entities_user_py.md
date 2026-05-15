---
title: user.py (entity)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_entities_user_py]]"
file_language: python
path: app/domain/entities/user.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
supersedes: "[[br_file_domain_models_user_py]]"
tags:
  - file
  - domain
  - entity
  - user
  - doctor
  - admin
  - rbac
  - pydantic
  - pt-br
related:
  - "[[br_file_domain_ports_user_repository_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_008_AuthN_Strategy]]"
---

# `app/domain/entities/user.py` — Entity User

## Context & Purpose

Representa uma **identidade autenticada** no SXFp: ou um `doctor` que
registra dados de [[br_Patient]] e roda [[br_Evaluation]]s, ou um
`admin` que gerencia a plataforma. A entity é deliberadamente mínima e
pura — sem SQLAlchemy, sem FastAPI, sem I/O. Mecânica de autenticação
(hashing, emissão de JWT) é delegada a ports/adapters; esta entity só
carrega o *digest* e algumas pequenas invariantes.

## Logic Breakdown

Dois símbolos públicos:

- **`UserRole(StrEnum)`** — `DOCTOR` | `ADMIN`. `StrEnum` (Python 3.11+)
  serializa como string simples para JSON / claims JWT.
- **`User(BaseModel)`** — modelo Pydantic v2 com:
    - `id: UUID` (default `uuid4()`).
    - `email: str` (length 3–254).
    - `full_name: str` (length 2–120).
    - `role: UserRole`.
    - `password_hash: str` — digest opaco produzido upstream por um
      `IPasswordHasher`. A entity nunca vê plaintext.
    - `crm: str | None` — ID brasileiro do conselho médico; obrigatório
      quando `role == DOCTOR` (forçado pelo validator
      `_doctor_must_have_crm`).
    - `is_active: bool` (default `True`).
    - `created_at: datetime` (UTC, factory default).
    - `last_login_at: datetime | None`.

Comportamentos:

- `has_role(required: UserRole) -> bool` — guard para checks RBAC;
  também short-circuita se o user está inativo.
- `deactivate()` — soft-delete; flipa `is_active` para `False`.
- `record_login(when=None)` — seta `last_login_at` para now (UTC) ou
  para um timestamp fornecido pelo caller (test friendly).

## Configuração Pydantic

```python
model_config = ConfigDict(
    extra="forbid",          # rejeita campos desconhecidos → contrato estrito
    str_strip_whitespace=True,
    validate_assignment=True,  # invariantes re-checadas em escrita de atributo
)
```

`validate_assignment=True` significa que `user.role = UserRole.DOCTOR`
re-roda a invariante de CRM — a entity permanece consistente em
mutação, não só na construção.

## Dependencies
- **Internas:** nenhuma (domínio puro).
- **Externas:** `pydantic` v2, `enum.StrEnum`, `datetime`, `uuid`.

## Consumers
- [[br_file_domain_ports_user_repository_py]] — Port que persiste esta
  entity.
- Camada de aplicação futura (`AuthenticateDoctorUseCase`,
  `RegisterUserUseCase`).
- Schemas de presentation futuros em
  `app/presentation/api/v*/schemas/user.py`.

## Invariants / Pitfalls
- **Doctors exigem `crm`.** Construção sem CRM levanta
  `ValidationError`. Admins não (o sistema pode ter contas admin sem
  licença médica).
- **`password_hash` nunca é comparado dentro da entity.** Verificação
  vai por `IPasswordHasher` para a entity ficar livre de deps de
  crypto.
- **Logar um `User` é sensível.** Até existir override de `__repr__`,
  callers DEVEM eles mesmos limpar `email` e `password_hash`.
  Estratégia de redação PII está em [[br_006_LGPD_PII_Strategy]].
- **Comparação de `StrEnum` usa `is`** (identidade) aqui por clareza —
  ambos `is` e `==` funcionam porque os membros do enum são internados,
  mas `is` sinaliza intenção.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #domain #entity #user #pydantic #pt-br
