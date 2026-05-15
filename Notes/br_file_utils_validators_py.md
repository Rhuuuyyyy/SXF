---
title: validators.py
type: File
status: Planned
language: pt-BR
mirrors: "[[file_utils_validators_py]]"
file_language: python
path: app/utils/validators.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_utils]]"
tags:
  - file
  - utils
  - validators
  - cpf
  - crm
  - brazilian-formats
  - pt-br
related:
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_domain_schemas_patient_py]]"
  - "[[br_file_domain_schemas_user_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/utils/validators.py` — Validadores de Formatos Brasileiros

## Context & Purpose

Funções puras de validação para formatos brasileiros que recorrem pelo
domínio: **CPF**, **CRM** (ID do conselho médico) e **CEP** (código
postal). Centralizar aqui previne três classes de bugs:

1. **Aceitação inconsistente** — `12345678900`, `123.456.789-00`,
   `123.456.789-0` devem resolver para a mesma forma canônica.
2. **Implementações erradas de checksum** — CPF tem algoritmo de
   verificação de dígito; checks inline ad-hoc historicamente erram.
3. **Drift entre schemas e entities** — ambos lados validam via os
   mesmos helpers, então `Pydantic.field_validator` e
   `Patient.__post_init__` concordam.

## Logic Breakdown

```python
import re

CPF_DIGITS_RE = re.compile(r"\D")
CRM_RE = re.compile(r"^[A-Z]{2}/\d{4,7}$")
CEP_RE = re.compile(r"^\d{5}-?\d{3}$")


def normalise_cpf(raw: str) -> str:
    return CPF_DIGITS_RE.sub("", raw)


def is_valid_cpf(raw: str) -> bool:
    """
    Validate a Brazilian CPF using the standard
    'modulo-11 with digit verifiers' algorithm.
    Rejects sequences of identical digits ('11111111111') which would
    pass the checksum but are blacklisted by Receita Federal.
    """
    cpf = normalise_cpf(raw)
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    for i in (9, 10):
        weights = range(i + 1, 1, -1)
        total = sum(int(d) * w for d, w in zip(cpf, weights))
        check = (total * 10) % 11 % 10
        if check != int(cpf[i]):
            return False
    return True


def validate_crm(raw: str) -> str:
    """
    CRM format: ``UF/digits`` (e.g. 'SP/123456'). Returns the canonical
    upper-cased form. Raises ``ValueError`` on bad input — callers
    upstream translate to ``DomainError``.
    """
    canon = raw.strip().upper()
    if not CRM_RE.match(canon):
        raise ValueError("Invalid CRM format. Expected 'UF/digits'.")
    return canon


def validate_cep(raw: str) -> str:
    canon = raw.strip()
    if not CEP_RE.match(canon):
        raise ValueError("Invalid CEP format.")
    return canon if "-" in canon else f"{canon[:5]}-{canon[5:]}"
```

Escolhas-chave:

- **Algoritmo modulo-11 do CPF** é o oficial publicado pela Receita
  Federal; o blacklist de sequências all-identical (`11111111111`)
  não está no algoritmo em si mas é convenção de longa data porque
  essas sequências são amplamente usadas como dado de teste.
- **Normalização primeiro, validação depois** — aceita input
  pontuado e cru; output canônico é só dígitos.
- **Validators levantam `ValueError` simples** — `field_validator` do
  Pydantic re-levanta como 422; invariantes de entity envolvem em
  `DomainError`.
- **Sem I/O, sem globals** — esses helpers são seguros de chamar de
  qualquer camada e trivialmente testáveis.

## Dependencies
- **Externo:** `re` da stdlib apenas.

## Consumers
- [[br_file_domain_schemas_patient_py]] (validator `PatientCreate.cpf`).
- [[br_file_domain_schemas_user_py]] (validator `UserCreate.crm`).
- [[br_file_domain_entities_patient_py]] (value object `CPF`).
- [[br_file_domain_entities_user_py]] (`User.__post_init__`).

## Invariants / Pitfalls
- **Nunca logue o input em falha.** O CPF em questão pode ser PII
  válido; passe `[REDACTED-CPF]` para logs (a regex de
  [[br_file_utils_logger_py]] pega casos perdidos de qualquer jeito).
- Blacklisting de CPFs all-identical é regra **funcional**, não
  criptográfica — dado de teste usando `12345678909` é *válido* por
  algoritmo e vai passar; testes precisam usar gerador ou um set
  documentado de fakes.
- Adicionar mais helpers de formato brasileiro (RG, CNH) pertence
  aqui também; resista à tentação de espalhá-los.
- A regex de CRM permite 4–7 dígitos; alguns conselhos emitem números
  mais curtos para registros pré-2000. Se o [[br_DBA_Team]] apertar
  a coluna, esta regex precisa seguir.

## Related ADRs
- [[br_006_LGPD_PII_Strategy]]
- [[br_001_Architecture_and_Context]]
- [[br_005_Integration_Contracts_DTOs]]

#file #utils #validators #cpf #crm #pt-br
