---
title: patient.py (schemas)
type: File
status: Active
language: pt-BR
mirrors: "[[file_presentation_schemas_patient_py]]"
file_language: python
path: app/presentation/api/v1/schemas/patient.py
created_date: 2026-05-10
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_presentation]]"
tags:
  - file
  - presentation
  - schemas
  - patient
  - lgpd
  - pt-br
related:
  - "[[br_file_presentation_routers_patients_py]]"
  - "[[br_file_application_use_cases_register_patient_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/presentation/api/v1/schemas/patient.py` — Schemas HTTP de Paciente

## Contexto e Propósito

Schemas Pydantic de request/response para o endpoint de cadastro de pacientes.
Fronteira LGPD: `PatientResponse` nunca expõe nome completo ou CPF em plaintext.

## Logic Breakdown

**`AcompanhanteCreateRequest`** — dados opcionais do acompanhante embutidos no cadastro:
- `nome`, `cpf: str | None`, `telefone`, `email`.

**`PatientCreateRequest`** — payload completo de cadastro:
- Campos demográficos que mapeiam para colunas de `tb_pacientes`.
- `sexo: str` validado por regex `^(M|F|I)$`.
- `etnia: str` — validado contra enum `Etnia` pelo use case.
- `acompanhante: AcompanhanteCreateRequest | None`.

**`PatientResponse`** — resposta segura sob LGPD:
- `id: UUID` — identidade interna de domínio.
- `nome_masked: str` — primeiro nome mantido; demais partes mascaradas (ex: `João S***`).
- `sexo`, `etnia`, `uf_residencia`, `criado_por_db_id`.
- CPF nunca retornado.

**`PatientListItemSchema`** (Sprint 6) — uma linha na listagem de pacientes:
- `id: int`, `nome: str`, `sexo: str | None`, `data_nascimento: str | None`.

**`PatientListResponse`** (Sprint 6) — resposta de listagem paginada:
- `items: list[PatientListItemSchema]`, `total`, `limit`, `offset`.

## Dependências
- **Externo:** `pydantic` v2.

## Consumidores
- [[br_file_presentation_routers_patients_py]] — tipos de request/response.
- [[br_file_application_use_cases_register_patient_py]] — recebe `PatientCreateRequest`.

## Invariantes / Armadilhas
- `extra="forbid"` em todos os modelos previne campos não documentados de vazar pela API.

## ADRs Relacionados
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #presentation #schemas #patient #lgpd #pt-br
