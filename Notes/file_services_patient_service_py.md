---
title: patient_service.py
type: File
status: Planned
language: python
path: app/services/patient_service.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[dir_app_services]]"
tags:
  - file
  - services
  - patient
  - anamnesis
  - scoring
  - clinical
related:
  - "[[file_domain_models_patient_py]]"
  - "[[file_domain_schemas_patient_py]]"
  - "[[file_interfaces_repositories_patient_repository_py]]"
  - "[[file_use_cases_patient_cases_py]]"
  - "[[001_Architecture_and_Context]]"
  - "[[007_Audit_Logging_Middleware]]"
---

# `app/services/patient_service.py` — Clinical Orchestration

## Context & Purpose

Coordinates the **clinical write path** for the SXFp platform:

1. Persist a new [[Patient]] (or fetch an existing one).
2. Attach a new [[Anamnesis]] submitted by the doctor.
3. Run the [[SymptomScoringService]] to compute the [[ScoreBand]].
4. Emit a [[ClinicalAlert]] when scoring crosses a threshold.
5. Trigger downstream notifications (genetic-test request, therapy
   routing) through abstract Ports.

It is the *single* place that combines aggregate state with the scoring
engine. Use cases in [[dir_app_use_cases]] thinly wrap it; the API layer
in [[dir_app_interfaces]] never instantiates the scoring engine directly.

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

Key choices:

- **Idempotent register.** Re-submitting the same CPF returns the
  existing patient instead of duplicating — clinically safer than 409.
- **The entity does the work.** `patient.add_anamnesis(...)` keeps the
  domain rule inside the [[Patient]] aggregate; the service only
  coordinates persistence.
- **Repository dependency is a Protocol.** Tests inject an
  in-memory fake; production injects
  [[file_interfaces_repositories_patient_repository_py]].
- **No commit here.** The unit-of-work boundary is the request, owned by
  [[file_db_database_py]]. A service that commits hides bugs and breaks
  multi-step use cases.

## Dependencies
- **Internal:** [[file_domain_models_patient_py]],
  [[file_domain_schemas_patient_py]],
  [[file_interfaces_repositories_patient_repository_py]],
  [[file_core_exceptions_py]], [[SymptomScoringService]] *(planned)*.
- **External:** none beyond stdlib.

## Consumers
- [[file_use_cases_patient_cases_py]] — `RegisterPatientUseCase`,
  `SubmitAnamnesisUseCase`, `GetPatientHistoryUseCase`.

## Invariants / Pitfalls
- **`PatientService` MUST NOT call HTTP** — the moment it starts emitting
  webhook calls, those go through a port (`INotificationDispatcher`),
  never `httpx` here.
- The `update` call after `add_anamnesis` is essential — without it the
  newly-appended `anamneses` and `alerts` collections never reach the DB.
- For LGPD audit trails, every state change here is captured by
  [[007_Audit_Logging_Middleware]] at the request envelope; deeper
  domain events (e.g. alert emitted) go through an `IAuditSink`
  *(planned)* call.
- The scoring engine is *deterministic* and *version-stamped* — the
  service must include the engine version in audit metadata to support
  retroactive recomputation.

## Related ADRs
- [[001_Architecture_and_Context]]
- [[003_Hexagonal_Architecture_Strategy]]
- [[006_LGPD_PII_Strategy]]
- [[007_Audit_Logging_Middleware]]
- [[009_Scoring_Engine_Design]] *(planned)*

#file #services #patient #anamnesis #clinical
