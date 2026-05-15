---
title: patients.py (router)
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_routers_patients_py]]"
file_language: python
path: app/presentation/api/v1/routers/patients.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - router
  - patient
  - lgpd
  - pt-br
related:
  - "[[br_file_application_use_cases_register_patient_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_file_presentation_schemas_patient_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_file_root_main_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/routers/patients.py` — Router de Cadastro e Listagem de Pacientes

## Contexto e Propósito

Expõe `POST /api/v1/pacientes` (cadastro) e `GET /api/v1/pacientes` (listagem)
para registros de pacientes. Ambos exigem JWT Bearer válido.
Requer JWT Bearer válido (`Depends(get_current_doctor)`). Conecta
[[br_file_application_use_cases_register_patient_py]] com seus adapters
de repositório concretos e formata a resposta mascarada por LGPD.

## Logic Breakdown

**`POST /api/v1/pacientes`** — `register_patient`:
1. Recebe payload `PatientCreateRequest`.
2. Autentica via `Depends(get_current_doctor)` — HTTP 401 se token ausente/inválido.
3. Constrói `RegisterPatientUseCase` com `PatientRepository` + `AcompanhanteRepository`.
4. Chama `use_case.execute(request, usuario_db_id=doctor.usuario_id)`.
5. Mascara `full_name` na resposta por LGPD: `"João Silva"` → `"João S***"`.
6. Retorna `PatientResponse` com HTTP 201.

**Lógica de mascaramento LGPD:**
```python
nome_parts = patient.full_name.split()
nome_masked = (
    nome_parts[0] + " " + " ".join(p[0] + "***" for p in nome_parts[1:])
    if len(nome_parts) > 1
    else patient.full_name[0] + "***"
)
```

## Dependências
- **Interno:**
  - [[br_file_application_use_cases_register_patient_py]]
  - [[br_file_interfaces_api_dependencies_py]]
  - [[br_file_interfaces_repositories_patient_repository_py]]
  - [[br_file_interfaces_repositories_acompanhante_repository_py]]
  - [[br_file_presentation_schemas_patient_py]]
  - [[br_file_db_database_py]]
- **Externo:** `fastapi`, `sqlalchemy[asyncio]`.

## Consumidores
- [[br_file_root_main_py]] — `app.include_router(patients.router, ...)`.

## Invariantes / Armadilhas
- `ValueError` do use case mapeia para HTTP 422.
- O router NÃO DEVE conter lógica de negócio.
- `doctor.usuario_id` do JWT verificado substitui qualquer campo de criador enviado pelo cliente.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #presentation #router #patient #lgpd #pt-br
