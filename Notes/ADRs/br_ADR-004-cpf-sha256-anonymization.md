---
id: ADR-004
title: "Anonimização de CPF com SHA-256 — Hashear na Camada de Caso de Uso, Nunca Passar Dígitos Brutos ao Repositório"
status: accepted
date: 2026-05-11
language: pt-BR
mirrors: "[[ADR-004-cpf-sha256-anonymization]]"
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - lgpd
  - cpf
  - privacidade
  - sha256
  - dominio
  - pt-br
related:
  - "[[br_file_domain_value_objects_cpf_py]]"
  - "[[br_file_application_use_cases_get_patient_list_py]]"
  - "[[br_file_interfaces_repositories_patient_read_repository_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# ADR-004 — Anonimização de CPF com SHA-256: Hashear na Camada de Caso de Uso

## Status

**Aceito** — 2026-05-11

---

## Contexto

O CPF (Cadastro de Pessoas Físicas) é classificado como informação
pessoalmente identificável (PII) pela LGPD. O sistema precisa suportar busca
de pacientes por CPF por médicos sem armazenar ou transmitir dígitos de CPF em
texto plano em parâmetros de consulta SQL ou logs de aplicação.

Dígitos de CPF brutos em um parâmetro SQL aparecem em logs de consulta lenta
do banco de dados, saída do `EXPLAIN ANALYZE` e qualquer log de auditoria no
nível de consulta habilitado pelo PostgreSQL. Armazenar um hash unidirecional
elimina essa exposição.

---

## Decisão

Os dígitos de CPF são hasheados para **hex SHA-256** na **camada de caso de uso
da aplicação**, dentro de `GetPatientListUseCase.execute()`. O repositório
(`PatientReadRepository`) recebe apenas a string `sha256_hex` e nunca vê
dígitos brutos.

O objeto de valor de domínio `CPF` (`app/domain/value_objects/cpf.py`) expõe
a propriedade `sha256_hex`. O caso de uso constrói `CPF(cpf_raw_filter).sha256_hex`
e passa o resultado como `cpf_hash_filter` ao repositório.

```python
# Em GetPatientListUseCase.execute()
cpf_hash_filter: str | None = None
if cpf_raw_filter:
    cpf_hash_filter = CPF(cpf_raw_filter).sha256_hex
```

O objeto de valor `CPF`:
- Remove pontos, traços e espaços; valida exatamente 11 dígitos.
- `sha256_hex` usa `hashlib.sha256(self.value.encode()).hexdigest()`.
- `__repr__` e `__str__` retornam `"***redacted***"` — CPF nunca aparece em
  logs, mensagens de exceção ou rastreamentos de pilha.

---

## Consequências

**Positivas:**

- Dígitos de CPF brutos nunca aparecem em parâmetros SQL, logs de consulta ou
  assinaturas de métodos de repositório.
- A regra de hash é **testável em unidade** sem banco de dados.
- `hashlib.sha256` é stdlib Python — sem dependência adicional.

**Negativas:**

- SHA-256 sem salt é teoricamente suscetível a ataques de tabela rainbow para
  o espaço CPF conhecido (~100M valores). Para este caso de uso — busca, não
  armazenamento de senha — o risco é aceito.
- Se o algoritmo de hash precisar mudar, todos os hashes de CPF existentes
  devem ser recomputados no banco de dados.

---

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| Hash no router HTTP | Routers não devem conter lógica de negócio. |
| Hash no repositório | Repositório é infraestrutura; política de conformidade pertence à fronteira domínio/aplicação. |
| Passar CPF bruto ao BD e hashear via função SQL | Parâmetros SQL aparecem em logs antes da função ser chamada. |
| Criptografar em vez de hashear | Criptografia é reversível; busca por CPF exato funciona identicamente com hash. |

#adr #lgpd #cpf #privacidade #sha256 #dominio #pt-br
