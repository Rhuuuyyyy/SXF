---
title: app/utils
type: Directory
status: Planned
language: pt-BR
mirrors: "[[dir_app_utils]]"
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_utils_logger_py]]"
  - "[[br_file_utils_validators_py]]"
tags:
  - directory
  - utils
  - cross-cutting
  - helpers
  - pt-br
related:
  - "[[br_dir_app_core]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_007_Audit_Logging_Middleware]]"
---

# `app/utils/` — Helpers Cross-cutting

## Context & Purpose

`app/utils/` agrupa **helpers stateless** que não cabem na taxonomia de
camadas da [[br_Hexagonal_Architecture]] mas são usados por múltiplas
camadas. A barra para entrar aqui é alta — qualquer coisa que possa
viver em uma camada mais específica deve. Duas coisas vivem aqui hoje:

- **Logger estruturado** ([[br_file_utils_logger_py]]) — output JSON,
  filtros de redação de PII; consumido por toda camada.
- **Validadores** ([[br_file_utils_validators_py]]) — funções puras
  para formatos brasileiros (CPF, CRM, CEP) usadas tanto por
  [[br_file_domain_schemas_patient_py]] quanto pelas invariantes
  correspondentes da entidade.

Por que `utils/` em vez de `core/`:

- `core/` segura primitivas tipadas que participam do grafo de DI
  (`Settings`, security services). `utils/` é Python helpers puro —
  funções puras, sem DI, sem construção.
- Separar mantém `core/` revisável e torna trivial responder "isso é
  seguro de importar de qualquer lugar?" (sim, de `utils/`).

## Children

- [[br_file_utils_logger_py]] — factory `get_logger(name)` com filtro de
  PII.
- [[br_file_utils_validators_py]] — `is_valid_cpf`, `validate_crm`,
  `validate_cep`.

## Allowed dependencies
- Standard library + libs Python puras pequenas (`structlog`,
  `pydantic`).
- Pode ser importado por **qualquer** camada — não tem conhecimento de
  domínio.

## Forbidden imports
- **NÃO PODE** importar [[br_dir_app_domain]],
  [[br_dir_app_services]], [[br_dir_app_use_cases]],
  [[br_dir_app_interfaces]] ou [[br_dir_app_db]]. Faria ciclo (domain
  importa utils, utils importa domain).

## Patterns
- **Funções puras** — sem I/O, sem globals, fáceis de testar.
- **Redação de PII centralizada** no logger, não espalhada.
- **Validadores de formato reutilizáveis** tanto em schemas
  (`field_validator` Pydantic) quanto em invariantes de entidade
  (`__post_init__`).

## Related ADRs
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_001_Architecture_and_Context]]

#directory #utils #helpers #pt-br
