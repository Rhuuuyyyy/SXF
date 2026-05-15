---
id: ADR-001
title: "Padrão de Banco Ativo — Delegar PGP, bcrypt e Pontuação ao PostgreSQL"
status: accepted
date: 2026-05-11
language: pt-BR
mirrors: "[[ADR-001-active-database-pattern]]"
deciders: [backend-team]
supersedes: null
tags:
  - adr
  - database
  - seguranca
  - pgp
  - scoring
  - active-database
  - pt-br
related:
  - "[[br_file_db_database_py]]"
  - "[[br_file_domain_services_symptom_scoring_orchestrator_py]]"
  - "[[br_006_LGPD_PII_Strategy]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
---

# ADR-001 — Padrão de Banco Ativo: Delegar PGP, bcrypt e Pontuação ao PostgreSQL

## Status

**Aceito** — 2026-05-11

---

## Contexto

O backend SXFp lida com duas categorias de operações que exigem garantias
criptográficas ou lógica clínica determinística que deve permanecer consistente
em todos os caminhos de inserção:

1. **Criptografia de PII em repouso** — nomes de pacientes, dígitos de CPF e
   outros campos sensíveis à LGPD devem ser criptografados com PGP simétrico
   antes de chegarem à camada de armazenamento físico. Criptografar em Python
   antes de cada `INSERT` introduz uma chamada de criptografia explícita em
   cada ponto de escrita e arrisca gravações em texto plano se um novo caminho
   de código for adicionado.

2. **Cálculo do score clínico** — `fn_calcular_score_triagem(:avaliacao_id)`
   calcula o score de triagem, atualiza `tb_avaliacoes`, fecha a entrada aberta
   em `tb_log_analises` e grava em `tb_auditoria`. Os quatro efeitos colaterais
   devem ser atômicos. Fazer isso em Python exigiria uma transação de várias
   etapas com lógica de rollback explícita.

---

## Decisão

Adotamos o **Padrão de Banco Ativo**: o PostgreSQL é responsável por toda
criptografia de campo PGP e por todo hash de senha. O Python delega ambas as
responsabilidades inteiramente ao banco de dados.

Concretamente:

- **Escritas passam por views nomeadas** — o Python nunca faz `INSERT` direto
  em tabelas físicas. Toda escrita tem como alvo uma view gravável (ex.:
  `pacientes`). Triggers `INSTEAD OF INSERT` nessas views chamam
  `pgp_sym_encrypt()` antes de gravar na tabela física subjacente.

- **A chave PGP é injetada por sessão** — `get_db_session()` executa
  `SELECT set_config('app.pgp_key', :key, true)` como primeira instrução após
  a sessão ser adquirida. O trigger lê `current_setting('app.pgp_key')` para
  obter a chave sem que ela apareça em um valor de coluna ou log.

- **Hash de bcrypt é tratado por um trigger** — o trigger de inserção de senha
  chama `crypt(:plaintext, gen_salt('bf'))` dentro do BD, de modo que o Python
  passa a senha em texto plano apenas pelo socket local do BD e o hash é
  armazenado imediatamente.

- **Cálculo do score é uma chamada de função armazenada** —
  `SymptomScoringOrchestrator` executa
  `SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)`. A função é a única
  fonte de verdade para a lógica de pontuação; é versionada via a coluna
  `versao_param` que retorna.

```python
# get_db_session() — trecho principal
await session.execute(
    text("SELECT set_config('app.pgp_key', :key, true)"),
    {"key": settings.pgp_key.get_secret_value()},
)
yield session
```

```python
# SymptomScoringOrchestrator.execute_scoring()
result = await session.execute(
    text("SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)"),
    {"avaliacao_id": avaliacao_id},
)
```

---

## Consequências

**Positivas:**

- Todo caminho de escrita é automaticamente criptografado — sem risco de
  adicionar um caminho que esqueça de chamar `pgp_sym_encrypt()`.
- A lógica de score é um artefato versionado; atualizar a função armazenada
  tem efeito imediato sem um deploy Python.
- Entradas de auditoria do `fn_calcular_score_triagem` são atômicas com o
  score — nenhum rastro de auditoria parcial é possível.

**Negativas:**

- O banco de dados não é mais um armazenamento passivo. Migrações devem
  incluir atualizações de triggers e funções; scripts Alembic requerem revisão
  manual.
- A lógica de score não é testável em Python puro — testes de integração devem
  conectar a uma instância PostgreSQL real (ou Docker).

---

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| Criptografar em Python (ex.: biblioteca `cryptography`) | Cada ponto de escrita deve chamar a função de criptografia; uma chamada perdida expõe texto plano. |
| Calcular score em Python com escritas no BD | Transação de várias etapas com rollback explícito; auditoria e score podem divergir. |
| Dividir: Python criptografa, BD pontua | Híbrido adiciona complexidade sem benefício claro. |

#adr #database #pgp #seguranca #active-database #pt-br
