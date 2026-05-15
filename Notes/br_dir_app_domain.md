---
id: dir-domain
title: "app/domain — O Núcleo do Hexágono"
type: DirGuide
status: living
language: pt-BR
mirrors: "[[dir_app_domain]]"
created_date: 2026-05-03
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app]]"
children:
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_domain_entities_symptom_py]]"
  - "[[br_file_domain_entities_evaluation_py]]"
  - "[[br_file_domain_entities_checklist_response_py]]"
  - "[[br_file_domain_entities_acompanhante_py]]"
  - "[[br_file_domain_value_objects_cpf_py]]"
  - "[[br_file_domain_services_symptom_scoring_orchestrator_py]]"
  - "[[br_file_domain_ports_patient_repository_py]]"
  - "[[br_file_domain_ports_user_repository_py]]"
  - "[[br_file_domain_ports_symptom_repository_py]]"
  - "[[br_file_domain_ports_evaluation_repository_py]]"
  - "[[br_file_domain_ports_checklist_response_repository_py]]"
tags:
  - directory
  - dominio
  - ddd
  - hexagonal
  - pt-br
related:
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_ADR-004-cpf-sha256-anonymization]]"
  - "[[br_ADR-005-uuid-to-serial-resolution]]"
---

# `app/domain/` — O Núcleo do Hexágono

## Propósito

`app/domain/` é a **camada mais interna** da [[br_Hexagonal_Architecture]].
Contém a *linguagem ubíqua* dos fluxos clínicos de FXS: quem é um
[[br_Patient]], o que uma anamnese contém, como um score é calculado.

Nenhuma importação de framework é permitida aqui — nem FastAPI, nem SQLAlchemy
(exceto em `services/` pelo Padrão de Banco Ativo).

## Sub-pacotes

```
app/domain/
├── entities/        # Entidades de negócio (Pydantic BaseModel com lógica de domínio)
├── value_objects/   # Tipos de valor imutáveis e auto-validáveis
├── services/        # Serviços de domínio sem estado (operações delegadas ao BD)
└── ports/           # Interfaces abstratas (Protocol) para dependências externas
```

## Filhos

### `entities/`

| Arquivo | Descrição |
|---|---|
| [[br_file_domain_entities_patient_py]] | `Patient` — aggregate root; 14+ campos demográficos; `criado_por_db_id: int` (ver [[br_ADR-005-uuid-to-serial-resolution]]) |
| [[br_file_domain_entities_user_py]] | `User` / conta de médico |
| [[br_file_domain_entities_symptom_py]] | `Symptom` — item do checklist de triagem FXS |
| [[br_file_domain_entities_evaluation_py]] | `Evaluation` — registro de anamnese completo |
| [[br_file_domain_entities_checklist_response_py]] | `ChecklistResponse` — resposta de um sintoma |
| [[br_file_domain_entities_acompanhante_py]] | `Acompanhante` — acompanhante opcional do paciente |

### `value_objects/`

| Arquivo | Descrição |
|---|---|
| [[br_file_domain_value_objects_cpf_py]] | `CPF` — dataclass congelado; limpa formatação; propriedade `sha256_hex`; `__str__`/`__repr__` ocultam (ver [[br_ADR-004-cpf-sha256-anonymization]]) |

### `services/`

| Arquivo | Descrição |
|---|---|
| [[br_file_domain_services_symptom_scoring_orchestrator_py]] | `SymptomScoringOrchestrator` — chama `fn_calcular_score_triagem(:avaliacao_id)`; retorna `ScoringResult` congelado (ver [[br_ADR-001-active-database-pattern]]) |

### `ports/`

| Arquivo | Descrição |
|---|---|
| [[br_file_domain_ports_patient_repository_py]] | `IPatientRepository` Protocol |
| [[br_file_domain_ports_user_repository_py]] | `IUserRepository` Protocol |
| [[br_file_domain_ports_symptom_repository_py]] | `ISymptomRepository` Protocol |
| [[br_file_domain_ports_evaluation_repository_py]] | `IEvaluationRepository` Protocol |
| [[br_file_domain_ports_checklist_response_repository_py]] | `IChecklistResponseRepository` Protocol |

## Dependências Permitidas

- Biblioteca padrão Python (`dataclasses`, `enum`, `datetime`, `uuid`, `hashlib`, `re`).
- `pydantic` v2 — apenas para modelos de entidade.
- `sqlalchemy` — **APENAS** em `services/` onde o serviço delega ao BD via
  `AsyncSession` (Padrão de Banco Ativo, [[br_ADR-001-active-database-pattern]]).

## Importações Proibidas

- **NÃO DEVE** importar `fastapi`, `httpx`, `passlib` ou qualquer framework HTTP.
- **NÃO DEVE** importar de [[br_dir_app_use_cases]], [[br_dir_app_interfaces]]
  ou [[br_dir_app_db]].
- A regra de dependências é unidirecional: camadas externas importam desta;
  esta camada não importa nada delas.

## Padrões Chave

- **Aggregate Root** — `Patient` é o aggregate root com identidade (`id: UUID`),
  demografia e referência ao médico criador (`criado_por_db_id: int`).
- **Value Objects** — `CPF` é imutável (`frozen=True`); nunca expõe texto
  simples em `str`/`repr`.
- **Entidades Pydantic** usam `ConfigDict(arbitrary_types_allowed=True, extra="forbid", str_strip_whitespace=True, validate_assignment=True)`.
- **Enums como `StrEnum`** — `SexAtBirth`, `Etnia`, `Escolaridade` herdam de
  `StrEnum` para serialização automática como strings.

## Invariantes

- Nenhum arquivo em `entities/` ou `value_objects/` pode importar `AsyncSession`.
- `CPF.__str__` e `CPF.__repr__` DEVEM permanecer ocultos — exigência LGPD.
- Convenção de nomeação `criado_por_db_id` deve ser preservada (ver [[br_ADR-005-uuid-to-serial-resolution]]).

> **Nota histórica:** versões anteriores desta nota referenciavam `models/` e
> `schemas/` em vez de `entities/`. O código real sempre esteve em `entities/`.

## ADRs Relacionados

- [[br_ADR-001-active-database-pattern]]
- [[br_ADR-004-cpf-sha256-anonymization]]
- [[br_ADR-005-uuid-to-serial-resolution]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_006_LGPD_PII_Strategy]]

#directory #dominio #ddd #hexagonal #pt-br
