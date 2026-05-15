---
title: get_patient_list.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_use_cases_get_patient_list_py]]"
file_language: python
path: app/application/use_cases/get_patient_list.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - patient
  - rbac
  - pagination
  - lgpd
  - pt-br
related:
  - "[[br_file_interfaces_repositories_patient_read_repository_py]]"
  - "[[br_file_presentation_routers_patients_py]]"
  - "[[br_file_domain_value_objects_cpf_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/application/use_cases/get_patient_list.py` — GetPatientListUseCase

## Contexto & Propósito

Retorna lista paginada de pacientes cadastrados pelo médico autenticado.
Agnóstico à HTTP: nunca importa `fastapi`. Regra de anonimato do CPF: dígitos
brutos são hasheados para SHA-256 AQUI — o repositório nunca vê o CPF cru.

## Logic Breakdown

**`PatientListResult`** — dataclass congelada retornada ao router:
- `items: list[PatientListItem]`
- `total: int`, `limit: int`, `offset: int`

**`GetPatientListUseCase.HARD_LIMIT = 200`** — constante de classe; pública para
que testes possam referenciar sem números mágicos.

**`GetPatientListUseCase.execute(*, usuario_id, nome_filter, cpf_raw_filter, limit, offset)`**:

1. Limita `limit` ao `HARD_LIMIT` (200).
2. Se `cpf_raw_filter` fornecido, passa para `CPF(raw).sha256_hex` — também valida
   o formato (11 dígitos). `ValueError` propaga ao router, que mapeia para HTTP 422.
3. Chama `count_by_doctor(...)` para o total.
4. Chama `list_by_doctor(...)` para a página.
5. Retorna `PatientListResult`.

## Dependências
- **Internas:** [[br_file_interfaces_repositories_patient_read_repository_py]],
  [[br_file_domain_value_objects_cpf_py]] (`CPF.sha256_hex`).
- **Externas:** apenas stdlib.

## Consumidores
- [[br_file_presentation_routers_patients_py]] (`GET /api/v1/pacientes`)

## Invariantes / Armadilhas
- NUNCA importar `fastapi`.
- O hash do CPF DEVE ocorrer aqui, não no router e não no repositório.
- `ValueError` de `CPF()` (CPF inválido) é intencionalmente não capturado —
  o router mapeia para HTTP 422.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #application #use-case #patient #rbac #pagination #lgpd #pt-br
