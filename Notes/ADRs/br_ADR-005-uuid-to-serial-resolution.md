---
id: ADR-005
title: "Resolução de UUID para SERIAL — criado_por_db_id: int Substitui criado_por: UUID na Entidade Paciente"
status: accepted
date: 2026-05-11
language: pt-BR
mirrors: "[[ADR-005-uuid-to-serial-resolution]]"
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - dominio
  - paciente
  - uuid
  - serial
  - identidade
  - pt-br
related:
  - "[[br_file_domain_entities_patient_py]]"
  - "[[br_file_application_use_cases_register_patient_py]]"
  - "[[br_file_interfaces_repositories_patient_repository_py]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# ADR-005 — Resolução de UUID para SERIAL: `criado_por_db_id: int` na Entidade Paciente

## Status

**Aceito** — 2026-05-11

---

## Contexto

O design de domínio inicial para `Patient` incluía um campo `criado_por: UUID`
destinado a carregar a identidade de domínio do médico criador. Isso assumia
que a tabela `usuarios` usava UUID como chave primária.

Durante o Sprint 4, o trabalho de integração revelou que `tb_usuarios` usa uma
chave primária PostgreSQL `SERIAL` (sequência inteira), não UUID. O payload JWT
carrega `"sub": str(usuario_id)` onde `usuario_id` é este inteiro.

O campo original `criado_por: UUID` não poderia ser preenchido a partir do JWT
sem uma consulta ao banco de dados para traduzir inteiro → UUID, introduzindo
uma viagem de ida e volta desnecessária.

---

## Decisão

O campo criador da entidade de domínio `Patient` é renomeado para
**`criado_por_db_id: int`** com restrição `Field(ge=1)`.

O sufixo `_db_id` é um **sinal de nomeação deliberado**: reconhece que este
campo carrega uma identidade de infraestrutura de banco de dados (PK inteira)
em vez de uma identidade de domínio (UUID). A equipe aceitou este acoplamento
pragmático porque:

1. O campo é write-once (definido no momento da construção, nunca atualizado).
2. A entidade de domínio nunca usa `criado_por_db_id` para lógica de domínio.
3. A alternativa (uma camada UUID para médicos) exige uma mudança de schema.

```python
# Entidade Patient
criado_por_db_id: int = Field(ge=1)
```

```python
# RegisterPatientUseCase.execute()
patient = Patient(
    ...
    criado_por_db_id=usuario_db_id,  # diretamente de AuthenticatedDoctor.usuario_id
)
```

---

## Consequências

**Positivas:**

- Sem viagem de ida e volta ao banco de dados para resolver identidade do
  criador — o inteiro do JWT é usado diretamente.
- O sufixo `_db_id` torna o acoplamento de infraestrutura visível na revisão
  de código.
- `Field(ge=1)` garante que o valor é um inteiro positivo válido no momento
  da construção da entidade.

**Negativas:**

- A entidade de domínio `Patient` agora carrega uma chave primária de
  infraestrutura de banco de dados. Esta é uma violação deliberada e
  documentada da pureza hexagonal estrita.
- Se `tb_usuarios` for migrada para chaves primárias UUID, este campo e todas
  as consultas de repositório downstream devem ser atualizados.

---

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| Manter `criado_por: UUID` e resolver int→UUID no router | Adiciona consulta ao BD por requisição na camada de apresentação. |
| Manter `criado_por: UUID` e resolver no caso de uso | Adiciona dependência `UserRepository` ao `RegisterPatientUseCase` apenas para tradução de ID. |
| Migrar `tb_usuarios` para chave primária UUID | Mudança de schema, migração de dados e mudança de payload JWT fora do escopo do Sprint 4. |

#adr #dominio #paciente #uuid #serial #identidade #pt-br
