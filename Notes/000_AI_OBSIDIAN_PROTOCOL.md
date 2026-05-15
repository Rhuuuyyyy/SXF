---
id: PROTOCOL-000
title: "AI Documentation Protocol — Read & Update Rules"
type: Protocol
status: Active
authority: binding
priority: P0
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
related:
  - "[[000_Home_Backend_MOC]]"
  - "[[001_Architecture_and_Context]]"
  - "[[100_Codebase_and_Directory_Map]]"
---

# AI Documentation Protocol — Binding Rules

> **PRIORITY: P0 — Binding for every AI-driven contribution to this repository.**
> If this protocol conflicts with another instruction, this protocol wins. It
> is the standing contract between the human team and any AI agent operating
> on the SXFp codebase.

## Purpose

The SXFp project couples a Python backend with an Obsidian vault that mirrors
its architecture file-for-file. The vault is **not** decorative documentation;
it is the **source of truth for every non-code architectural decision**. This
protocol guarantees that vault and code never drift apart.

---

## Rule 1 — Read First (Context Before Code)

Before implementing a new feature, modifying existing code, or refactoring,
the AI agent **MUST** locate and read the corresponding `.md` files in
`/Notes/` that describe:

1. The directory the change touches (e.g., [[dir_app_services]] for changes
   under `app/services/`).
2. Each individual file being modified (e.g., [[file_services_auth_service_py]]
   for `app/services/auth_service.py`).
3. Every ADR linked from those notes via the `related` frontmatter key.
4. The MOC ([[000_Home_Backend_MOC]]) when navigating between unrelated areas.

If a relevant note is missing, the agent **MUST create it before writing
code**. Code without a corresponding note is a protocol violation.

### Discovery cheat-sheet

| Code path | Note filename |
|---|---|
| `app/core/security.py` | [[file_core_security_py]] |
| `app/services/` | [[dir_app_services]] |
| `app/domain/models/patient.py` | [[file_domain_models_patient_py]] |
| `pyproject.toml` (root) | [[file_root_pyproject_toml]] |

The MOC ([[000_Home_Backend_MOC]]) lists every active note. Obsidian's
backlinks pane surfaces indirect references.

---

## Rule 2 — Always Update (Code-Doc Synchrony)

For **every** create / modify / delete on a `.py`, `.toml`, `.yml`, `Dockerfile`,
or any other tracked source file, the AI agent **MUST**, in the **same task and
the same commit**:

1. Bump the corresponding note's `updated_date` frontmatter field.
2. Reflect the change in the `Logic Breakdown`, `Dependencies` and `Consumers`
   sections.
3. Add or remove `[[wikilinks]]` so the graph stays accurate.
4. If a file is **deleted**, the note remains but its `status` flips to
   `Archived` and a `deprecation_date` field is added.
5. If a brand-new file appears, its note is created using the templates below
   **before** the commit is finalised.

The commit message **MUST** mention both the code change and the doc update.
Example: `feat(auth): add Argon2 hasher; sync file_core_security_py`.

---

## Rule 3 — Linking Discipline (No Broken Edges)

The Obsidian Graph is a load-bearing artefact. Every note must keep its links
intact.

1. **No orphan nodes.** Every active note must be reachable from
   [[000_Home_Backend_MOC]] in at most two hops.
2. **Wikilink first mention.** The first time a concept appears in any note,
   it must be wikilinked, even if the target is still an orphan
   (e.g., `[[SymptomScoringService]]` before that file exists).
3. **Bidirectional intent.** When note A links to note B, note B's `related`
   list should include A on its next update.
4. **Renames.** If a code file is renamed, the corresponding note is renamed
   in the same commit, and every wikilink to the old name is updated. Run a
   vault-wide search before pushing.
5. **No bare paths in prose.** Never write `app/core/security.py`; always
   wikilink as [[file_core_security_py]] (`app/core/security.py`).

---

## Rule 4 — Bilingual Vault (PT-BR Mirror)

The vault keeps a **Portuguese-language mirror** of every English note,
named with the `br_` prefix. The English notes are the AI's working
context; the `br_*` files are the human team's reference.

| English source (canonical, AI reads) | Portuguese mirror (human reference) |
|---|---|
| `000_AI_OBSIDIAN_PROTOCOL.md` | `br_000_AI_OBSIDIAN_PROTOCOL.md` |
| `001_Architecture_and_Context.md` | `br_001_Architecture_and_Context.md` |
| `dir_app_domain.md` | `br_dir_app_domain.md` |
| `file_domain_entities_user_py.md` | `br_file_domain_entities_user_py.md` |

### What the AI MUST do

1. **Treat English notes as the canonical source.** When following Rule 1
   (Read First), the AI reads ONLY the English files. It MUST NOT consult
   `br_*` files to gather context, resolve disagreements, or answer
   architectural questions.
2. **Mirror every change.** Whenever an English note is created, updated,
   or archived under Rule 2, its `br_*` counterpart MUST be created /
   updated / archived in the same commit. Drift between the two is a
   Rule 4 violation.
3. **Mirror creations and archivals.** New English note → new `br_*`
   mirror. English note flipped to `status: Archived` → matching `br_*`
   mirror also flipped to `status: Archived` with the same
   `deprecation_date` and `superseded_by` pointer (translated to a
   `br_*` target).
4. **Translate prose, preserve technicalities.** Inside `br_*` files:
   - Translate to PT-BR: headings, paragraphs, table-cell prose,
     captions, list items.
   - Keep in English (verbatim): code blocks, identifiers, file paths,
     library names (`FastAPI`, `Pydantic`, `SQLAlchemy`), pattern names
     (Hexagonal Architecture, Repository Pattern, Ports & Adapters),
     enum values, frontmatter keys.
   - Add `language: pt-BR` to the frontmatter so the mirror is
     filterable in Obsidian.
5. **Wikilinks stay inside the same language graph.** A `br_*` file
   links to other `br_*` files (the user's Portuguese graph stays
   navigable). The English file links stay English. Do not cross-link
   languages by default.

### What the AI MUST NOT do

- Read `br_*` files for context. They are derived; the English source is
  canonical.
- Quote `br_*` content when answering architectural questions.
- Create a new English note without also creating its `br_*` mirror in
  the same commit.
- Use `br_*` content to resolve disagreements between docs and code;
  only English files participate in Rule 1 / Rule 2 / Rule 3 enforcement.

---

## Filename conventions (binding)

| Note kind | Pattern | Example |
|---|---|---|
| MOC / Index | `<NNN>_<Title>.md` | `000_Home_Backend_MOC.md` |
| ADR | `<NNN>_<Title>.md` | `001_Architecture_and_Context.md` |
| Directory map | `dir_<dotted_path>.md` | `dir_app_core.md` |
| File map | `file_<dotted_path>_<ext>.md` | `file_core_config_py.md` |
| Protocol | `<NNN>_<TITLE>_PROTOCOL.md` | `000_AI_OBSIDIAN_PROTOCOL.md` |
| **PT-BR mirror** | **`br_<original_filename>`** | **`br_001_Architecture_and_Context.md`** |

The dotted path collapses slashes: `app/core/security.py` → `file_core_security_py.md`.
For root files, prefix with `root_`: `pyproject.toml` → `file_root_pyproject_toml.md`.
The PT-BR mirror prepends `br_` to the canonical filename, never altering
the rest of the name.

---

## Mandatory frontmatter (binding)

Every note MUST carry at least:

```yaml
---
title: <human-readable title>
type: <Directory | File | ADR | MOC | Protocol>
status: <Active | Planned | Archived>
created_date: <YYYY-MM-DD>
updated_date: <YYYY-MM-DD>
author: <team or person>
tags: [<list>]
---
```

File notes additionally carry: `path`, `language`, `parent`.
Directory notes additionally carry: `parent`, `children` (optional).

---

## Templates (the agent must use these)

### Template A — Directory note

````markdown
---
title: <dir name>
type: Directory
status: Active
created_date: <today>
updated_date: <today>
author: backend-team
project: SXFp
parent: "[[<parent dir note>]]"
tags: [directory, <layer>, ...]
related: ["[[<adr>]]", ...]
---

# <path>/ — <one-line purpose>

## Context & Purpose
…

## Children
- [[<file 1>]]
- [[<sub dir>]]

## Allowed dependencies
…

## Forbidden imports
…

## Related ADRs
- [[…]]
````

### Template B — File note

````markdown
---
title: <file name>
type: File
status: Active
language: <python | toml | yaml | dockerfile | ini | text>
path: <relative path from repo root>
created_date: <today>
updated_date: <today>
author: backend-team
project: SXFp
parent: "[[<parent dir note>]]"
tags: [file, <layer>, …]
related: ["[[…]]", …]
---

# <path> — <one-line purpose>

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

## Workflow checklist (every PR)

- [ ] Read the relevant **English** notes (Rule 1). Never `br_*`.
- [ ] Implement the code change.
- [ ] Update **English** notes synchronously (Rule 2).
- [ ] Mirror the same change in the `br_*` counterpart (Rule 4).
- [ ] Verify all wikilinks resolve in BOTH language graphs (Rule 3).
- [ ] Update [[000_Home_Backend_MOC]] AND [[br_000_Home_Backend_MOC]] status
      boards if scope changed.
- [ ] Commit message references both code and docs (English + PT-BR).

---

## Escalation

If the agent encounters ambiguity that the notes do not resolve, it must
**stop and ask** before guessing. Improvising on undocumented behaviour
creates drift and is itself a Rule 2 violation.

#protocol #ai #binding #obsidian #workflow #sxfp
