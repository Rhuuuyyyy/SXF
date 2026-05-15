---
title: docs
type: Directory
status: Planned
language: pt-BR
mirrors: "[[dir_docs]]"
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_100_Codebase_and_Directory_Map]]"
tags:
  - directory
  - docs
  - external-documentation
  - openapi
  - pt-br
related:
  - "[[br_000_Home_Backend_MOC]]"
  - "[[br_000_AI_OBSIDIAN_PROTOCOL]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
  - "[[br_file_root_main_py]]"
---

# `docs/` — Documentação Externa

## Context & Purpose

`docs/` é a **superfície pública de documentação** distinta do vault
Obsidian sob [[br_000_Home_Backend_MOC]]:

| Superfície | Audiência | Formato | Origem |
|---|---|---|---|
| **Vault Obsidian** (`Notes/`) | Time interno, agente de IA | Markdown com wikilinks | curado à mão |
| **`docs/`** | Time de frontend, parceiros, auditores | MkDocs / site estático | parcialmente autogen |
| **OpenAPI** | Time de frontend, integradores | JSON 3.1 | autogerado por [[br_FastAPI]] |

O vault é o "porquê"; `docs/` é o "como consumir". Eles se referenciam
mas têm regras de autoria distintas:

- O vault é a **fonte da verdade** sob [[br_000_AI_OBSIDIAN_PROTOCOL]].
- `docs/` pode **extrair e publicar** trechos do vault, mas nunca
  contradizê-lo.

## Children (layout canônico)

```
docs/
├── index.md                # landing page
├── architecture.md         # export limpo de [[br_001_Architecture_and_Context]]
├── api/
│   ├── overview.md
│   └── openapi.json        # cópia em build-time de /api/v1/openapi.json
├── runbooks/
│   ├── local-dev.md
│   └── deploy.md
└── compliance/
    ├── lgpd.md             # resumo executivo de [[br_006_LGPD_PII_Strategy]]
    └── audit.md            # resumo executivo de [[br_007_Audit_Logging_Middleware]]
```

## Allowed dependencies
- Markdown / MkDocs / themes mkdocs-material.
- Script de build que copia `/api/v1/openapi.json` de uma app rodando
  para `docs/api/openapi.json`.

## Forbidden imports
- `docs/` é **conteúdo**, não código. Nada em `docs/` deve ser
  importado por nada em [[br_dir_app]].
- **NÃO** inclua PII real ou secrets de produção em nenhum exemplo —
  ver [[br_006_LGPD_PII_Strategy]].

## Patterns
- **Single-source-of-truth vence.** Quando uma nota do vault e uma
  página de docs divergem, a nota é canônica e a página de docs é
  regenerada.
- **Diagramas públicos são renderizados.** Fontes mermaid ficam no
  vault; docs shipam SVGs renderizados para serem legíveis sem Obsidian.
- **Docs versionadas** espelham a versão da API: `/v1/`, `/v2/`.
  Versões fora de suporte vão para `docs/archive/`.

## Related ADRs
- [[br_000_AI_OBSIDIAN_PROTOCOL]]
- [[br_001_Architecture_and_Context]]
- [[br_005_Integration_Contracts_DTOs]]

#directory #docs #external-documentation #pt-br
