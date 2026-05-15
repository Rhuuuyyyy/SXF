---
title: exceptions.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_core_exceptions_py]]"
file_language: python
path: app/core/exceptions.py
created_date: 2026-05-03
updated_date: 2026-05-08
author: backend-team
project: SXFp
parent: "[[br_dir_app_core]]"
tags:
  - file
  - core
  - exceptions
  - error-handling
  - cross-cutting
  - pt-br
related:
  - "[[br_file_root_main_py]]"
  - "[[br_file_interfaces_api_dependencies_py]]"
  - "[[br_Error_Response_Envelope]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_file_services_auth_service_py]]"
---

# `app/core/exceptions.py` — Hierarquia de Exceptions Neutra ao Domínio

## Contexto e Propósito

Define as **classes-base de exception tipadas** que o restante da base de
código levanta. Duas responsabilidades:

1. Fornecer uma hierarquia estável que a camada de presentation mapeia para
   respostas HTTP (RFC 7807 problem-details — ver [[br_Error_Response_Envelope]]
   *(planejado)*).
2. Desacoplar código de negócio de `fastapi.HTTPException`. A camada
   [[br_dir_app_domain]] NUNCA levanta exceptions HTTP-aware; ela levanta
   exceptions de domínio e o adapter de presentation traduz.

## Logic Breakdown

```python
class SXFpError(Exception):
    code: str = "sxfp.error"

class DomainError(SXFpError):
    code = "domain.error"

class NotFoundError(SXFpError):
    code = "resource.not_found"

class ConflictError(SXFpError):
    code = "resource.conflict"

class AuthenticationError(SXFpError):
    code = "auth.unauthenticated"

class AuthorizationError(SXFpError):
    code = "auth.forbidden"

class LGPDComplianceError(SXFpError):
    code = "lgpd.violation"
```

Cada subclasse adiciona um `code` — identificador string estável surfado ao
frontend, seguro como chave de i18n. A camada de presentation registra um
`exception_handler` por classe que retorna JSON RFC 7807.

## Dependências
- **Externo:** standard library apenas. Sem import de FastAPI — estrito.

## Consumidores
- [[br_dir_app_domain]] (levanta `DomainError` e similares).
- [[br_dir_app_services]] (`AuthenticationError`, `AuthorizationError`).
- [[br_file_services_auth_service_py]] (fluxos de sessão e guarda de auth).
- [[br_file_application_use_cases_submit_anamnesis_py]] (propagação de erros de domínio).
- [[br_file_root_main_py]] (registra os handlers de exception).
- [[br_dir_app_interfaces]] (traduz para HTTP).

## Invariantes / Armadilhas
- **Sem detalhes HTTP dentro.** Status codes pertencem à camada de presentation.
- Nunca `catch Exception:` em código de negócio — engole `LGPDComplianceError`.
- Novas subclasses são adicionadas aqui, não espalhadas.
- `context` NÃO PODE incluir PII.

## ADRs Relacionados
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_Error_Response_Envelope]] *(planejado)*

#file #core #exceptions #error-handling #pt-br
