---
title: patient_repository.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_interfaces_repositories_patient_repository_py]]"
file_language: python
path: app/interfaces/repositories/patient_repository.py
created_date: 2026-05-03
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_interfaces]]"
tags:
  - file
  - interfaces
  - repository
  - patient
  - sqlalchemy
  - adapter
  - pt-br
related:
  - "[[br_file_interfaces_repositories_base_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_db_base_py]]"
  - "[[br_file_services_patient_service_py]]"
  - "[[br_file_use_cases_patient_cases_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/interfaces/repositories/patient_repository.py` — Adapter de Persistência de Patient

## Context & Purpose

Adapter concreto que satisfaz o Port `IPatientRepository` (declarado
inline aqui contra o `IRepository[Patient]` genérico de
[[br_file_interfaces_repositories_base_py]]). Traduz entre:

- A entity de domínio pura em [[br_file_domain_entities_patient_py]].
- Um `PatientORM` mapeado via classes declarativas SQLAlchemy que
  compartilham metadata com [[br_file_db_base_py]].

Este é o **único** módulo onde rows ORM para Patient são construídas.
Qualquer outro lugar (use case, service) que toque `PatientORM` é uma
violação de [[br_003_Hexagonal_Architecture_Strategy]].

## Logic Breakdown

Skeleton (planejado):

```python
from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.domain.models.patient import Patient
from app.domain.models.value_objects import CPF, BirthDate
from app.interfaces.repositories.base import IRepository, SqlAlchemyRepository


class IPatientRepository(IRepository[Patient], Protocol):
    async def get_by_cpf(self, cpf: CPF) -> Patient | None: ...


class PatientORM(Base):
    __tablename__ = "patients"
    # colunas elididas — propriedade do [[br_DBA_Team]]


class SqlAlchemyPatientRepository(
    SqlAlchemyRepository[Patient]
):
    model = PatientORM

    async def get(self, id: UUID) -> Patient | None:
        row = await self._session.get(PatientORM, id)
        return self._to_entity(row) if row else None

    async def get_by_cpf(self, cpf: CPF) -> Patient | None:
        stmt = select(PatientORM).where(PatientORM.cpf_pseudonym == cpf.pseudonym())
        return self._to_entity((await self._session.execute(stmt)).scalar_one_or_none())

    async def add(self, entity: Patient) -> Patient:
        row = self._to_orm(entity)
        self._session.add(row)
        await self._session.flush()
        return self._to_entity(row)

    @staticmethod
    def _to_entity(row: PatientORM | None) -> Patient | None:
        if row is None:
            return None
        return Patient(
            id=row.id,
            cpf=CPF(row.cpf_pseudonym),
            full_name=row.full_name_encrypted,  # decrypted via [[br_file_core_security_py]]
            birth_date=BirthDate(row.birth_date),
            sex_at_birth=row.sex_at_birth,
            family_history_fxs=row.family_history_fxs,
        )

    @staticmethod
    def _to_orm(entity: Patient) -> PatientORM:
        return PatientORM(
            id=entity.id,
            cpf_pseudonym=entity.cpf.pseudonym(),
            full_name_encrypted=entity.full_name,
            birth_date=entity.birth_date.value,
            sex_at_birth=entity.sex_at_birth,
            family_history_fxs=entity.family_history_fxs,
        )
```

Escolhas-chave:

- **`get_by_cpf` é uma query de domínio** — adicionada ao Port porque
  buscar pacientes por CPF é fluxo clínico real (encaminhamento com um
  CPF), não só CRUD genérico.
- **CPF armazenado como pseudônimo** (HMAC-SHA256(CPF, pepper)). CPF
  cru nunca toca o banco — ver [[br_006_LGPD_PII_Strategy]].
- **Nome completo cifrado na camada de aplicação** via primitivas em
  [[br_file_core_security_py]] quando a estratégia de cifragem
  column-level exige; caso contrário pgcrypto trata transparentemente
  (decisão DBA).
- **`_to_entity` / `_to_orm`** isolam mapping. Os use cases nunca veem
  `PatientORM`.

## Dependencies
- **Externo:** `sqlalchemy[asyncio]`.
- **Interno:** [[br_file_db_base_py]], [[br_file_domain_entities_patient_py]],
  [[br_file_interfaces_repositories_base_py]], [[br_file_core_security_py]].

## Consumers
- [[br_file_services_patient_service_py]] /
  [[br_file_use_cases_patient_cases_py]].
- [[br_file_interfaces_api_dependencies_py]] (instanciado por-request).

## Invariants / Pitfalls
- **Nunca exponha `PatientORM`** fora deste módulo.
- `get_by_cpf` precisa hashear o CPF *antes* de querar — querar CPF
  cru derrota a pseudonimização.
- A session passada é *request-scoped*; não retenha referência além
  de uma única chamada de use case.
- Semântica de `delete` LGPD: este método pseudonimiza e tombstone em
  vez de `DELETE`, para preservar integridade de auditoria. Ver
  [[br_006_LGPD_PII_Strategy]].
- Adicionar método de query novo no Port exige atualizar a lista de
  consumers em [[br_file_interfaces_repositories_base_py]] E todo fake
  repository nos testes.

## Related ADRs
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_001_Architecture_and_Context]]

#file #interfaces #repository #patient #adapter #pt-br
