---
id: PROTOCOL-000
title: "Protocolo de Documentação por IA — Regras de Leitura e Atualização"
type: Protocol
status: Active
authority: binding
priority: P0
language: pt-BR
mirrors: "[[000_AI_OBSIDIAN_PROTOCOL]]"
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
tags:
  - protocol
  - ai
  - rules
  - obsidian
  - workflow
  - binding
  - pt-br
related:
  - "[[br_000_Home_Backend_MOC]]"
  - "[[br_001_Architecture_and_Context]]"
---

# Protocolo de Documentação por IA — Regras Vinculantes

> **PRIORIDADE: P0 — Vinculante para qualquer contribuição da IA neste
> repositório.** Em caso de conflito com outras instruções, este protocolo
> prevalece. É o contrato permanente entre a equipe humana e qualquer
> agente de IA operando sobre a base de código do SXFp.

## Propósito

O projeto SXFp combina um backend Python com um vault Obsidian que
espelha a arquitetura arquivo a arquivo. O vault **não** é documentação
decorativa; ele é a **fonte da verdade para toda decisão arquitetural
não-código**. Este protocolo garante que vault e código nunca se
descolem.

---

## Regra 1 — Read First (Contexto Antes do Código)

Antes de implementar uma feature nova, modificar código existente ou
refatorar, o agente **DEVE** localizar e ler os arquivos `.md`
correspondentes em `/Notes/` que descrevem:

1. O diretório que a mudança toca (ex.: [[br_dir_app_services]] para
   alterações em `app/services/`).
2. Cada arquivo individual sendo modificado (ex.:
   [[br_file_services_auth_service_py]] para
   `app/services/auth_service.py`).
3. Cada ADR linkada via `related` na frontmatter dessas notas.
4. O MOC ([[br_000_Home_Backend_MOC]]) ao navegar entre áreas distintas.

Se uma nota relevante estiver faltando, o agente **DEVE criá-la antes de
escrever código**. Código sem nota correspondente é violação do protocolo.

### Cheat-sheet de descoberta

| Caminho do código | Nome do arquivo de nota |
|---|---|
| `app/core/security.py` | [[br_file_core_security_py]] |
| `app/services/` | [[br_dir_app_services]] |
| `app/domain/models/patient.py` | [[br_file_domain_models_patient_py]] |
| `pyproject.toml` (raiz) | [[br_file_root_pyproject_toml]] |

O MOC ([[br_000_Home_Backend_MOC]]) lista todas as notas ativas. O
painel de backlinks do Obsidian revela referências indiretas.

---

## Regra 2 — Always Update (Sincronia Código-Documentação)

Para **toda** criação / modificação / remoção de um arquivo `.py`,
`.toml`, `.yml`, `Dockerfile` ou qualquer fonte versionada, o agente
**DEVE**, na **mesma tarefa e no mesmo commit**:

1. Atualizar o campo `updated_date` da frontmatter da nota correspondente.
2. Refletir a mudança nas seções `Logic Breakdown`, `Dependencies` e
   `Consumers` da nota.
3. Adicionar ou remover `[[wikilinks]]` para que o grafo se mantenha
   correto.
4. Se um arquivo é **deletado**, a nota permanece, mas seu `status` muda
   para `Archived` e um campo `deprecation_date` é adicionado.
5. Se um arquivo novo aparece, sua nota é criada usando os templates
   abaixo **antes** do commit ser finalizado.

A mensagem de commit **DEVE** mencionar tanto a mudança de código quanto
a atualização de documentação. Exemplo:
`feat(auth): add Argon2 hasher; sync file_core_security_py`.

---

## Regra 3 — Linking Discipline (Sem Arestas Quebradas)

O Grafo Obsidian é um artefato estrutural. Cada nota mantém seus links
intactos.

1. **Sem nós órfãos.** Toda nota ativa deve ser alcançável a partir de
   [[br_000_Home_Backend_MOC]] em no máximo dois saltos.
2. **Wikilink na primeira menção.** A primeira vez que um conceito aparece
   numa nota, ele é wikilinkado, mesmo se o alvo ainda for órfão (ex.:
   `[[SymptomScoringService]]` antes do arquivo existir).
3. **Intenção bidirecional.** Quando a nota A linka para a nota B, o
   `related` de B deve incluir A na próxima atualização.
4. **Renomeações.** Se um arquivo de código é renomeado, a nota
   correspondente é renomeada no mesmo commit, e todo wikilink ao nome
   antigo é atualizado. Rode busca global no vault antes do push.
5. **Sem caminhos crus em prosa.** Nunca escreva `app/core/security.py`;
   use sempre [[br_file_core_security_py]] (`app/core/security.py`).

---

## Regra 4 — Vault Bilíngue (Espelho PT-BR)

O vault mantém um **espelho em português** de toda nota em inglês,
nomeado com prefixo `br_`. As notas em inglês são o contexto de trabalho
da IA; os arquivos `br_*` são a referência do time humano.

| Fonte em inglês (canônica, lida pela IA) | Espelho em português (referência humana) |
|---|---|
| `000_AI_OBSIDIAN_PROTOCOL.md` | `br_000_AI_OBSIDIAN_PROTOCOL.md` |
| `001_Architecture_and_Context.md` | `br_001_Architecture_and_Context.md` |
| `dir_app_domain.md` | `br_dir_app_domain.md` |
| `file_domain_entities_user_py.md` | `br_file_domain_entities_user_py.md` |

### O que a IA DEVE fazer

1. **Tratar as notas em inglês como fonte canônica.** Ao seguir a Regra 1
   (Read First), a IA lê APENAS os arquivos em inglês. Não consulta
   `br_*` para reunir contexto, resolver discordâncias ou responder a
   perguntas arquiteturais.
2. **Espelhar toda mudança.** Quando uma nota inglesa é criada,
   atualizada ou arquivada sob a Regra 2, o `br_*` correspondente DEVE
   ser criado / atualizado / arquivado no mesmo commit. Drift entre os
   dois é violação da Regra 4.
3. **Espelhar criações e arquivamentos.** Nova nota inglesa → novo
   espelho `br_*`. Nota inglesa marcada como `status: Archived` →
   espelho `br_*` também marcado como `Archived`, com mesmo
   `deprecation_date` e ponteiro `superseded_by` (traduzido para o
   alvo `br_*`).
4. **Traduzir a prosa, preservar tecnicalidades.** Dentro de arquivos
   `br_*`:
   - Traduzir para PT-BR: títulos, parágrafos, conteúdo de células de
     tabela, legendas, itens de lista.
   - Manter em inglês (literal): blocos de código, identificadores,
     caminhos de arquivo, nomes de bibliotecas (`FastAPI`, `Pydantic`,
     `SQLAlchemy`), nomes de padrões (Hexagonal Architecture, Repository
     Pattern, Ports & Adapters), valores de enum, chaves da frontmatter.
   - Adicionar `language: pt-BR` à frontmatter para o espelho ser
     filtrável no Obsidian.
5. **Wikilinks ficam dentro do mesmo grafo de língua.** Um arquivo
   `br_*` linka para outros `br_*` (o grafo português do usuário fica
   navegável). Os links das notas inglesas continuam apontando para
   notas inglesas. Não cruze línguas por padrão.

### O que a IA NÃO DEVE fazer

- Ler arquivos `br_*` para obter contexto. São derivados; o original em
  inglês é canônico.
- Citar conteúdo de `br_*` ao responder perguntas arquiteturais.
- Criar uma nova nota em inglês sem também criar o espelho `br_*` no
  mesmo commit.
- Usar conteúdo de `br_*` para resolver discordâncias entre docs e
  código; apenas as notas em inglês participam da aplicação das Regras
  1 / 2 / 3.

---

## Convenções de nomes (vinculantes)

| Tipo de nota | Padrão | Exemplo |
|---|---|---|
| MOC / Índice | `<NNN>_<Título>.md` | `000_Home_Backend_MOC.md` |
| ADR | `<NNN>_<Título>.md` | `001_Architecture_and_Context.md` |
| Mapa de diretório | `dir_<caminho_pontuado>.md` | `dir_app_core.md` |
| Mapa de arquivo | `file_<caminho_pontuado>_<ext>.md` | `file_core_config_py.md` |
| Protocolo | `<NNN>_<TÍTULO>_PROTOCOL.md` | `000_AI_OBSIDIAN_PROTOCOL.md` |
| **Espelho PT-BR** | **`br_<filename_canônico>`** | **`br_001_Architecture_and_Context.md`** |

O caminho pontuado colapsa as barras: `app/core/security.py` →
`file_core_security_py.md`. Para arquivos da raiz, prefixe com `root_`:
`pyproject.toml` → `file_root_pyproject_toml.md`. O espelho PT-BR
prefixa `br_` ao nome canônico, sem alterar o resto.

---

## Frontmatter obrigatória (vinculante)

Toda nota DEVE carregar no mínimo:

```yaml
---
title: <título legível>
type: <Directory | File | ADR | MOC | Protocol>
status: <Active | Planned | Archived>
created_date: <YYYY-MM-DD>
updated_date: <YYYY-MM-DD>
author: <equipe ou pessoa>
tags: [<lista>]
---
```

Notas de arquivo carregam adicionalmente: `path`, `language`, `parent`.
Notas de diretório carregam adicionalmente: `parent`, `children`
(opcional). Espelhos `br_*` carregam `language: pt-BR` e `mirrors:
"[[<arquivo em inglês>]]"`.

---

## Templates (a IA deve usá-los)

### Template A — Nota de diretório

````markdown
---
title: <nome do dir>
type: Directory
status: Active
created_date: <hoje>
updated_date: <hoje>
author: backend-team
project: SXFp
parent: "[[<nota do dir pai>]]"
tags: [directory, <camada>, ...]
related: ["[[<adr>]]", ...]
---

# <caminho>/ — <propósito em uma linha>

## Context & Purpose
…

## Children
- [[<arquivo 1>]]
- [[<sub dir>]]

## Allowed dependencies
…

## Forbidden imports
…

## Related ADRs
- [[…]]
````

### Template B — Nota de arquivo

````markdown
---
title: <nome do arquivo>
type: File
status: Active
language: <python | toml | yaml | dockerfile | ini | text>
path: <caminho relativo a partir da raiz>
created_date: <hoje>
updated_date: <hoje>
author: backend-team
project: SXFp
parent: "[[<nota do dir pai>]]"
tags: [file, <camada>, …]
related: ["[[…]]", …]
---

# <caminho> — <propósito em uma linha>

## Context & Purpose
…

## Logic Breakdown
…

## Dependencies
- Internal: [[…]]
- External: <libs>

## Consumers
- [[…]]

## Invariants / Pitfalls
…

## Related ADRs
- [[…]]
````

---

## Checklist de workflow (todo PR)

- [ ] Ler as notas em **inglês** relevantes (Regra 1). Nunca `br_*`.
- [ ] Implementar a mudança de código.
- [ ] Atualizar as notas em **inglês** sincronicamente (Regra 2).
- [ ] Espelhar a mesma mudança no `br_*` correspondente (Regra 4).
- [ ] Verificar que todos os wikilinks resolvem nos DOIS grafos de
      língua (Regra 3).
- [ ] Atualizar os status boards de [[000_Home_Backend_MOC]] E
      [[br_000_Home_Backend_MOC]] se o escopo mudou.
- [ ] Mensagem de commit referencia código e docs (inglês + PT-BR).

---

## Escalação

Se a IA encontrar ambiguidade que as notas não resolvem, ela DEVE
**parar e perguntar** antes de adivinhar. Improvisar sobre comportamento
não documentado cria drift e é, em si, violação da Regra 2.

#protocol #ai #binding #obsidian #workflow #sxfp #pt-br
