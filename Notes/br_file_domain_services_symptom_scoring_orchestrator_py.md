---
id: file-domain-scoring
title: "symptom_scoring_orchestrator.py (serviço de domínio)"
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_services_symptom_scoring_orchestrator_py]]"
file_language: python
path: app/domain/services/symptom_scoring_orchestrator.py
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - dominio
  - servico
  - scoring
  - active-database
  - pt-br
related:
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
  - "[[br_ADR-001-active-database-pattern]]"
  - "[[br_file_db_database_py]]"
---

# `app/domain/services/symptom_scoring_orchestrator.py` — Serviço de Scoring de Sintomas

## Contexto & Propósito

Orquestra o cálculo de score de triagem para uma avaliação clínica. Este
serviço de domínio **não implementa lógica de scoring pura** — delega
inteiramente ao banco de dados via stored function PostgreSQL
`fn_calcular_score_triagem(:avaliacao_id)`.

Esta divisão de responsabilidades é central ao
[[br_ADR-001-active-database-pattern]]: lógica de negócio complexa que
opera sobre dados persistidos (pesos de sintomas, limiares de parâmetros,
histórico de avaliações) vive no banco, onde pode ser executada de forma
atômica sem round-trips adicionais de rede.

## Logic Breakdown

**`ScoringResult`** — dataclass congelada (NamedTuple ou `@dataclass(frozen=True)`),
DTO de retorno:

```python
@dataclass(frozen=True)
class ScoringResult:
    score_final: float
    limiar_usado: float
    recomenda_exame: bool
    versao_param: str
```

- `score_final` — valor numérico calculado pela stored function.
- `limiar_usado` — limiar de decisão vigente no momento do cálculo
  (versionado no banco).
- `recomenda_exame` — `True` se `score_final >= limiar_usado`.
- `versao_param` — identificador da versão dos parâmetros de scoring
  usados, para rastreabilidade e auditoria.

**`SymptomScoringOrchestrator`**

```python
class SymptomScoringOrchestrator:
    def __init__(self, session: AsyncSession) -> None: ...

    async def calcular_score(self, avaliacao_id: int) -> ScoringResult:
        """Delega a fn_calcular_score_triagem e retorna ScoringResult congelado."""
        ...
```

Fluxo interno de `calcular_score`:

1. Executa `SELECT * FROM fn_calcular_score_triagem(:avaliacao_id)` via
   `session.execute(text(...), {"avaliacao_id": avaliacao_id})`.
2. A stored function realiza todos os efeitos colaterais atomicamente no
   banco (persiste o resultado da avaliação, atualiza contadores, etc.).
3. Mapeia a linha retornada para `ScoringResult` congelado.
4. Retorna o `ScoringResult` — imutável, serializável, sem estado interno.

## Dependências
- **Externas:** `sqlalchemy[asyncio]` (apenas `AsyncSession` e `text`).
- **Internas:** [[br_file_db_database_py]] (sessão injetada via construtor).

## Consumidores
- [[br_file_application_use_cases_submit_anamnesis_py]] — chama
  `calcular_score(avaliacao_id)` após persistir a anamnese e obtém o
  `ScoringResult` para montar a resposta ao caller.

## Invariantes / Armadilhas
- **Sem lógica de scoring pura aqui.** Todo o cálculo real acontece
  dentro de `fn_calcular_score_triagem` no PostgreSQL. Este serviço é
  apenas o adaptador de chamada.
- **`ScoringResult` é imutável (`frozen=True`).** Não tente modificar
  campos após a criação — crie uma nova instância se necessário.
- **Efeitos colaterais são atômicos no DB.** A stored function pode
  gravar resultado de avaliação e atualizar agregados numa única
  transação; o serviço não precisa orquestrar commits separados.
- A sessão recebida via construtor JÁ tem a chave PGP injetada por
  `get_db_session()` ([[br_ADR-001-active-database-pattern]]). Não
  re-injete manualmente.
- Nunca logue `avaliacao_id` junto com dados do paciente no mesmo
  contexto de log — rastreabilidade sem re-identificação
  ([[br_006_LGPD_PII_Strategy]]).

## ADRs Relacionados
- [[br_ADR-001-active-database-pattern]]
- [[br_006_LGPD_PII_Strategy]]

#file #dominio #servico #scoring #active-database #pt-br
