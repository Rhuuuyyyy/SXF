---
title: tests/unit/use_cases
type: Directory
status: Active
language: pt-BR
mirrors: "[[dir_tests_unit_use_cases]]"
created_date: 2026-05-11
updated_date: 2026-05-11
author: backend-team
project: SXFp
parent: "[[br_dir_tests]]"
tags:
  - directory
  - tests
  - unit
  - use-cases
  - pt-br
related:
  - "[[br_file_tests_conftest_py]]"
  - "[[br_file_application_use_cases_get_dashboard_stats_py]]"
  - "[[br_file_application_use_cases_get_patient_history_py]]"
  - "[[br_file_application_use_cases_get_patient_list_py]]"
  - "[[br_file_application_use_cases_submit_anamnesis_py]]"
---

# `tests/unit/use_cases/` — Testes Unitários da Camada de Aplicação

## Contexto & Propósito

Testes unitários isolados para os Casos de Uso de Aplicação. Sem banco de dados,
sem cliente HTTP, sem boot do FastAPI. Todas as dependências de repositório são
substituídas por instâncias `AsyncMock` providas por [[br_file_tests_conftest_py]].

**Cobertura Sprint 6: 16 testes, 0 falhas.**

## Arquivos de Teste

### `test_dashboard_stats.py` — 6 testes
Testa aplicação de k-anonimato em [[br_file_application_use_cases_get_dashboard_stats_py]]:
- Linha única abaixo do `K_ANONYMITY_THRESHOLD` → `LGPDComplianceError`
- Qualquer linha abaixo do threshold em lista mista → `LGPDComplianceError`
- Todas as linhas no threshold ou acima → retorna resultado
- Fronteira: exatamente 5 → passa
- Resultado vazio → sem erro
- Filtros encaminhados verbatim ao repositório

### `test_patient_history.py` — 3 testes
Testa RBAC e paginação em [[br_file_application_use_cases_get_patient_history_py]]:
- Paciente sem avaliações → lista vazia, sem erro
- `limit > 200` → limitado silenciosamente a 200
- `usuario_id` encaminhado a `count_by_paciente` e `list_by_paciente`

### `test_patient_list.py` — 4 testes
Testa hash de CPF e paginação em [[br_file_application_use_cases_get_patient_list_py]]:
- CPF bruto hasheado para SHA-256 antes de chegar ao repositório
- Sem filtro de CPF → `cpf_hash_filter=None` para o repositório
- `limit > HARD_LIMIT` → limitado silenciosamente
- Resultado paginado com total e itens corretos

### `test_submit_anamnesis.py` — 3 testes
Testa orquestração em [[br_file_application_use_cases_submit_anamnesis_py]]:
- Retorno de `create_rascunho` usado como `avaliacao_id` em `insert_respostas`
- Quatro passos executados: rascunho → log_analise → respostas → scoring
- Itens do checklist encaminhados verbatim ao `ChecklistRepository.insert_respostas`

## Padrões

- **AsyncMock(spec=)** — aplica interface do repositório; falha em métodos desconhecidos.
- **Sem HTTP** — casos de uso testados sem subir FastAPI.
- **Sem DB** — repositórios mockados; SQL nunca executa.
- **`asyncio_mode = "auto"`** — funções `async def test_*` rodam sem `@pytest.mark.asyncio`.

#directory #tests #unit #use-cases #pt-br
