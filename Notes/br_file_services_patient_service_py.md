---
title: patient_service.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_services_patient_service_py]]"
file_language: python
path: app/services/patient_service.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_services]]"
tags:
  - file
  - services
  - patient
  - anamnesis
  - scoring
  - clinical
  - pt-br
related:
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_schemas_patient_py]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_use_cases_patient_cases_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_007_Audit_Logging_Middleware]]"
---

# `app/services/patient_service.py` — Orquestração Clínica

## Context & Purpose

Coordena o **caminho clínico de escrita** da plataforma SXFp:

1. Persistir um novo [[br_Patient]] (ou buscar um existente).
2. Anexar uma nova [[br_Anamnesis]] submetida pelo médico.
3. Rodar o [[br_SymptomScoringService]] para computar o
   [[br_ScoreBand]].
4. Emitir um [[br_ClinicalAlert]] quando o score cruza um threshold.
5. Disparar notificações downstream (pedido de teste genético,
   roteamento de terapia) através de Ports abstratos.

É o *único* lugar que combina estado de aggregate com o scoring
engine. Use cases em [[br_dir_app_use_cases]] embrulham levemente; a
camada API em [[br_dir_app_interfaces]] nunca instancia o scoring
engine diretamente.

## Logic Breakdown

```python
from app.core.exceptions import NotFoundError
from app.domain.models.patient import Patient
from app.domain.schemas.patient import PatientCreate
from app.interfaces.repositories.patient_repository import IPatientRepository
# from app.domain.services.symptom_scoring_service import SymptomScoringService


class PatientService:
    def __init__(self, patients: IPatientRepository) -> None:
        self._patients = patients

    async def register(self, payload: PatientCreate) -> Patient:
        existing = await self._patients.get_by_cpf(payload.to_cpf())
        if existing is not None:
            return existing
        entity = payload.to_entity()
        return await self._patients.add(entity)

    async def submit_anamnesis(
        self,
        patient_id,
        anamnesis,
    ):
        patient = await self._patients.get(patient_id)
        if patient is None:
            raise NotFoundError("patient.not_found")
        alert = patient.add_anamnesis(anamnesis)   # entity owns the rule
        await self._patients.update(patient)
        return patient, alert
```

Escolhas-chave:

- **Register idempotente.** Re-submeter o mesmo CPF retorna o paciente
  existente em vez de duplicar — clinicamente mais seguro que 409.
- **A entity faz o trabalho.** `patient.add_anamnesis(...)` mantém a
  regra de domínio dentro do aggregate [[br_Patient]]; o service só
  coordena persistência.
- **Dependência do repositório é Protocol.** Testes injetam fake
  in-memory; produção injeta
  [[br_file_interfaces_repositories_patient_repository_py]].
- **Sem commit aqui.** A boundary de unit-of-work é a request, dona é
  [[br_file_db_database_py]]. Service que dá commit esconde bugs e
  quebra use cases multi-step.

## Dependencies
- **Interno:** [[br_file_domain_entities_patient_py]],
  [[br_file_domain_schemas_patient_py]],
  [[br_file_interfaces_repositories_patient_repository_py]],
  [[br_file_core_exceptions_py]], [[br_SymptomScoringService]]
  *(planejado)*.
- **Externo:** nenhum além de stdlib.

## Consumers
- [[br_file_use_cases_patient_cases_py]] — `RegisterPatientUseCase`,
  `SubmitAnamnesisUseCase`, `GetPatientHistoryUseCase`.

## Invariants / Pitfalls
- **`PatientService` NÃO PODE chamar HTTP** — no momento que começar a
  emitir webhooks, eles vão por um port (`INotificationDispatcher`),
  nunca `httpx` aqui.
- A chamada `update` após `add_anamnesis` é essencial — sem ela as
  collections recém-anexadas `anamneses` e `alerts` nunca chegam ao
  DB.
- Para audit trails LGPD, toda mudança de estado aqui é capturada por
  [[br_007_Audit_Logging_Middleware]] no envelope da request; eventos
  domain mais profundos (ex.: alert emitido) vão por uma chamada
  `IAuditSink` *(planejado)*.
- O scoring engine é *determinístico* e *version-stamped* — o service
  precisa incluir a versão do engine na metadata de audit para
  suportar recomputação retroativa.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_009_Scoring_Engine_Design]] *(planejado)*

#file #services #patient #anamnesis #clinical #pt-br
