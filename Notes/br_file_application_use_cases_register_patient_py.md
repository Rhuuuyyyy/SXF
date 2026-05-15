---
title: register_patient.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_application_use_cases_register_patient_py]]"
file_language: python
path: app/application/use_cases/register_patient.py
created_date: 2026-05-10
updated_date: 2026-05-10
author: backend-team
project: SXFp
parent: "[[br_dir_app_use_cases]]"
tags:
  - file
  - application
  - use-case
  - patient
  - registration
  - pt-br
related:
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_file_interfaces_repositories_acompanhante_repository_py]]"
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_entities_acompanhante_py]]"
  - "[[br_file_presentation_schemas_patient_py]]"
  - "[[br_file_presentation_routers_patients_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
---

# `app/application/use_cases/register_patient.py` — RegisterPatientUseCase

## Contexto e Propósito

Orquestra o **fluxo de cadastro de paciente**: opcionalmente resolve ou cria
um `Acompanhante`, depois persiste a nova entidade `Patient` com o id de banco
do médico autenticado como `criado_por_db_id`.

Cego a HTTP por design — levanta `ValueError` ou exceções de domínio, nunca
`HTTPException`. O router traduz o resultado para uma resposta HTTP.

## Logic Breakdown

**`RegisterPatientUseCase.__init__(patients, acompanhantes)`** — injeção por construtor.

**`RegisterPatientUseCase.execute(*, request, usuario_db_id) -> Patient`**:

1. **Resolver acompanhante** (se `request.acompanhante` não for `None`):
   - Constrói value object `CPF` a partir da string bruta (se fornecida).
   - Tenta `AcompanhanteRepository.get_by_cpf()` — reutiliza existente se encontrado.
   - Caso contrário, cria novo `Acompanhante` via `AcompanhanteRepository.add()`.
   - Captura o `acompanhante_id: UUID` resultante.

2. **Construir entidade Patient**:
   - Mapeia todos os campos de `PatientCreateRequest` para o construtor `Patient`.
   - `criado_por_db_id = usuario_db_id` (do claim JWT `sub`).
   - `family_history_fxs = False` (não exposto no formulário v1).

3. **Persistir** via `PatientRepository.add()` e retornar a entidade.

## Dependências
- **Interno:**
  - [[br_file_interfaces_repositories_patient_repository_py]]
  - [[br_file_interfaces_repositories_acompanhante_repository_py]]
  - [[br_file_domain_entities_patient_py]]
  - [[br_file_domain_entities_acompanhante_py]]
  - [[br_file_domain_value_objects_cpf_py]]
  - [[br_file_presentation_schemas_patient_py]] (`PatientCreateRequest`)
- **Externo:** somente stdlib.

## Consumidores
- [[br_file_presentation_routers_patients_py]] (entry point HTTP).

## Invariantes / Armadilhas
- DEVE NUNCA importar `fastapi` — exigido pelas regras de [[br_dir_app_use_cases]].
- `usuario_db_id` vem do JWT; o use case confia que já foi verificado por `get_current_doctor`.
- `PatientCreateRequest` é um schema de apresentação — violação técnica de camada.
  Sprint 5 introduzirá um `RegisterPatientDTO` para quebrar essa dependência.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #application #use-case #patient #registration #pt-br
