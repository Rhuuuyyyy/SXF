---
title: user.py (model) — ARQUIVADO
type: File
status: Archived
deprecation_date: 2026-05-03
superseded_by: "[[br_file_domain_entities_user_py]]"
language: pt-BR
mirrors: "[[file_domain_models_user_py]]"
file_language: python
path: app/domain/models/user.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - entity
  - user
  - doctor
  - rbac
  - archived
  - pt-br
related:
  - "[[br_file_domain_entities_user_py]]"
---

# `app/domain/models/user.py` — Identidade Autenticada (Doctor)

> **ARQUIVADO em 2026-05-03.** O caminho `app/domain/models/` descrito
> aqui nunca foi implementado. O código ativo vive em
> [[br_file_domain_entities_user_py]] (`app/domain/entities/user.py`),
> que renderiza o mesmo conceito de domínio usando o layout hexagonal
> existente (`entities/` em vez de `models/`). Leia a nota ativa para
> comportamento atual; tudo abaixo é preservado para contexto histórico.

## Context & Purpose

Modelava a **identidade autenticada** do sistema. Em v1 o único role era
`doctor`; roles futuros ([[br_CRM_Validator]], [[br_Researcher]],
[[br_Caretaker]]) plugariam na mesma entity através do `Role`. Regras
de autenticação e autorização lendo esta entity, mas sendo
*implementadas* em [[br_file_core_security_py]] (crypto de baixo nível)
e [[br_file_services_auth_service_py]] (orquestração de use case).

## Razão do arquivamento

O time decidiu seguir com `app/domain/entities/` ao invés de
`app/domain/models/` para nomenclatura DDD-aligned. A entity está agora
em [[br_file_domain_entities_user_py]] com fields equivalentes mais
um invariant explícito que requer `crm` quando `role == DOCTOR`.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #domain #entity #user #rbac #archived #pt-br
