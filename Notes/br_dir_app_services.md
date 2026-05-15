---
title: app/services
type: Directory
status: Planned
language: pt-BR
mirrors: "[[dir_app_services]]"
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_services_auth_service_py]]"
  - "[[br_file_services_patient_service_py]]"
tags:
  - directory
  - services
  - application
  - orchestration
  - pt-br
related:
  - "[[br_dir_app_use_cases]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# `app/services/` — Application Services

## Context & Purpose

`app/services/` hospeda **application services com estado e reutilizáveis**
que coordenam fluxos cross-aggregate. Ficam entre os use cases finos por
endpoint em [[br_dir_app_use_cases]] e os ports de persistência em
[[br_dir_app_interfaces]].

A separação entre `services/` e `use_cases/` é um refinamento pragmático
deliberado da Clean Architecture estrita:

- Um **use case** é uma única intenção (`SubmitAnamnesis`,
  `RegisterDoctor`); fino, geralmente uma função/classe de 10–30 linhas.
- Um **service** é comportamento mais longo e reutilizável compartilhado
  entre múltiplos use cases (`AuthService.authenticate_doctor` é
  chamado por login, refresh e password-reset).

Se um pedaço de orquestração é invocado por um e somente um use case,
inline. Se for compartilhado, promova para um service aqui.

## Children

- [[br_file_services_auth_service_py]] — login, emissão de token,
  rotação de senha; usa primitivas de [[br_file_core_security_py]].
- [[br_file_services_patient_service_py]] — submissão de anamnese,
  scoring, emissão de alertas; orquestra mutações de [[br_Patient]] e
  o [[br_SymptomScoringService]].

## Allowed dependencies
- [[br_dir_app_domain]] (entities, schemas, value objects).
- [[br_dir_app_core]] (exceptions, security primitives, settings).
- [[br_dir_app_interfaces]] (apenas os **Protocol** Ports — nunca os
  adapters ORM concretos).

## Forbidden imports
- **NÃO PODE** importar `fastapi`. Services são HTTP-blind. Levantam
  exceptions de domínio; a camada [[br_dir_app_interfaces]] mapeia para
  HTTP.
- **NÃO PODE** importar [[br_dir_app_db]] diretamente. Dependem das
  Protocol Ports, nunca de `AsyncSession` ou linhas ORM.

## Patterns
- **Funções stateless** quando possível; classes só quando configuração
  explícita (`AuthService(hasher, issuer)`) clarifica dependências.
- **Constructor injection** para ports — fácil de mockar em testes.
- **Naming domain-focused.** Métodos descrevem intenção clínica/auth
  (`authenticate_doctor`, `submit_anamnesis`), não verbos HTTP.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_008_AuthN_Strategy]] *(planejado)*

#directory #services #application #orchestration #pt-br
