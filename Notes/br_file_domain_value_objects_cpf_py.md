---
title: cpf.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_value_objects_cpf_py]]"
file_language: python
path: app/domain/value_objects/cpf.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - value-object
  - cpf
  - lgpd
  - hashing
  - pt-br
related:
  - "[[br_file_application_use_cases_get_patient_list_py]]"
  - "[[br_file_application_use_cases_register_patient_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
---

# `app/domain/value_objects/cpf.py` — Value Object CPF

## Contexto & Propósito

Encapsula o Cadastro de Pessoas Físicas (CPF) brasileiro como um value object
imutável. Aplica validação de formato e fornece hash SHA-256 unidirecional para
armazenamento — dígitos brutos do CPF nunca são persistidos ou registrados em logs.

Requisito LGPD: CPF é classificado como PII sensível. O sistema armazena apenas
`cpf_hash` (SHA-256 hex) e nunca o plaintext. Ver [[br_ADR-004-cpf-sha256-anonymization]].

## Logic Breakdown

**`CPF(value: str)`** — dataclass congelada:
- `__post_init__`: remove `.`, `-` e espaços; valida `len == 11` e todos os
  caracteres numéricos. Lança `ValueError` para entrada inválida.
- `sha256_hex: str` — `hashlib.sha256(cleaned.encode()).hexdigest()`. O hash é
  calculado sobre o valor limpo de **11 dígitos** (sem pontos ou traços). Usado
  como chave de armazenamento e busca.
- `__repr__` e `__str__` retornam `"***redacted***"` — CPF nunca aparece em
  logs, tracebacks ou representações serializadas.

**`CPFAnnotated`** — tipo anotado Pydantic v2 combinando `CPF` com um
`BeforeValidator` que aceita instância `CPF` ou string bruta. Usado em schemas
Pydantic de request para validar campos CPF na fronteira HTTP.

## Dependências
- **Externas:** stdlib (`hashlib`, `re`, `dataclasses`); `pydantic` v2.

## Consumidores
- [[br_file_application_use_cases_register_patient_py]] — hash do CPF antes de
  persistir o registro do paciente.
- [[br_file_application_use_cases_get_patient_list_py]] — hash do filtro CPF bruto
  antes de passar ao repositório.
- [[br_file_domain_entities_patient_py]] — campo `cpf: CPFAnnotated | None`.

## Invariantes / Armadilhas
- `sha256_hex` é calculado sobre o **valor limpo de 11 dígitos**. Formatação
  (pontos/traços) é removida antes do hash, então `123.456.789-09` e
  `12345678909` produzem o mesmo hash.
- O value object NÃO valida o algoritmo de dígito verificador do CPF — apenas
  contagem de dígitos e tipo de caractere. Validação completa é melhoria planejada.
- `CPF` NÃO DEVE ser serializado, logado ou retornado em qualquer resposta de API.

## ADRs Relacionados
- [[br_ADR-004-cpf-sha256-anonymization]]
- [[br_006_LGPD_PII_Strategy]]

#file #domain #value-object #cpf #lgpd #hashing #pt-br
