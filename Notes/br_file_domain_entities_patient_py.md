---
title: patient.py (entity)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_entities_patient_py]]"
file_language: python
path: app/domain/entities/patient.py
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
supersedes: "[[br_file_domain_models_patient_py]]"
tags:
  - file
  - domain
  - entity
  - patient
  - pii
  - lgpd
  - pydantic
  - pt-br
related:
  - "[[br_file_domain_ports_patient_repository_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
  - "[[br_ADR-005-uuid-to-serial-resolution]]"
---

# `app/domain/entities/patient.py` — Entity Patient

## Context & Purpose

O sujeito clínico da plataforma SXFp. Um `Patient` é registrado por um
[[br_file_domain_entities_user_py]] (com role `DOCTOR`) e acumula uma
ou mais [[br_file_domain_entities_evaluation_py]] ao longo do tempo.

Esta entity é a **superfície PII de maior risco** do sistema: nome,
CPF, data de nascimento e sexo são todos dados pessoais sensíveis sob
LGPD. A entity carrega os valores canônicos; **mascaramento e
pseudonimização ficam nas fronteiras** (respostas de presentation,
pseudônimos da camada de persistência), documentado em
[[br_006_LGPD_PII_Strategy]].

## Logic Breakdown

Símbolos públicos:

- **`SexAtBirth(StrEnum)`** — `M` | `F` | `I` (intersex). Armazenado
  como o valor legal/biológico; identidade de gênero está fora do
  escopo em v1.
- **`Patient(BaseModel)`** — modelo Pydantic v2:
    - `id: UUID` — identidade interna opaca. **Nunca o CPF.** Usar UUID
      isola o banco de identificadores externos (pseudonímia LGPD na
      camada de dado).
    - `cpf: CPFAnnotated | None` — campo opcional que usa o value object
      [[br_file_domain_value_objects_cpf_py]]. Nunca armazena os dígitos
      brutos; `CPFAnnotated` garante validação e hash SHA-256.
    - `full_name: str` — 2–120 chars.
    - `birth_date: date`.
    - `sex_at_birth: SexAtBirth`.
    - `family_history_fxs: bool` — preditor forte no scoring engine
      FXS.
    - `criado_por_db_id: int = Field(ge=1)` — ID inteiro do médico que
      criou o registro (chave estrangeira SERIAL do banco; ver
      [[br_ADR-005-uuid-to-serial-resolution]]). Usado para audit trail
      LGPD (ver [[br_007_Audit_Logging_Middleware]]).
    - `created_at: datetime` (UTC).

Comportamento:

- `age_at(reference: date) -> int` — idade exata em anos numa data
  dada, considerando se o aniversário já passou. Usado pelo scoring
  engine e pelo `applies_to_age` de
  [[br_file_domain_entities_symptom_py]].

## Configuração Pydantic

```python
model_config = ConfigDict(
    arbitrary_types_allowed=True,
    extra="forbid",
    str_strip_whitespace=True,
    validate_assignment=True,
)
```

`arbitrary_types_allowed=True` é necessário porque `CPFAnnotated` usa o
type `CPF` (dataclass customizada) que o Pydantic não reconhece como tipo
nativo sem essa flag.

## Dependencies
- **Internas:** nenhuma (domínio puro).
- **Externas:** `pydantic` v2, `enum.StrEnum`, `datetime`, `uuid`.

## Consumers
- [[br_file_domain_ports_patient_repository_py]] — Port de persistência.
- Futuros `RegisterPatientUseCase`, `SubmitEvaluationUseCase`.
- [[br_file_domain_entities_evaluation_py]] (linkado por `patient_id`).

## Invariants / Pitfalls
- **`cpf: CPFAnnotated | None`** — o campo usa o value object real de
  [[br_file_domain_value_objects_cpf_py]]. Dígitos brutos nunca são
  expostos fora do value object; apenas `sha256_hex` é persistido.
- **`criado_por_db_id: int`**, não UUID. A migração UUID→SERIAL foi
  decidida em [[br_ADR-005-uuid-to-serial-resolution]]; qualquer
  referência a `registered_by_user_id: UUID` indica documentação
  desatualizada.
- **IDs internos são UUIDs**, nunca CPF. Consultas por CPF passam por
  `IPatientRepository.get_by_cpf` que hasheia antes do lookup.
- **Logar um Patient é risco de breach.** A mesma disciplina de
  redação de [[br_file_domain_entities_user_py]] se aplica — até
  existir override de `__repr__`, callers precisam fazer scrub.
- **`age_at` usa `date`**, não `datetime`. Diferenças de fuso poderiam
  empurrar o aniversário em um dia; operamos deliberadamente em datas
  de calendário.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_ADR-004-cpf-sha256-anonymization]]
- [[br_ADR-005-uuid-to-serial-resolution]]

#file #domain #entity #patient #pii #lgpd #pt-br
