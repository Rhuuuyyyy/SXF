---
title: user_repository.py (port)
type: File
status: Active
language: pt-BR
mirrors: "[[file_domain_ports_user_repository_py]]"
file_language: python
path: app/domain/ports/user_repository.py
created_date: 2026-05-03
updated_date: 2026-05-03
author: backend-team
project: SXFp
parent: "[[br_dir_app_domain]]"
tags:
  - file
  - domain
  - port
  - protocol
  - user
  - repository
  - dba-interface
  - pt-br
related:
  - "[[br_file_domain_entities_user_py]]"
  - "[[br_file_domain_ports_patient_repository_py]]"
  - "[[br_file_domain_ports_evaluation_repository_py]]"
  - "[[br_001_Architecture_and_Context]]"
  - "[[br_003_Hexagonal_Architecture_Strategy]]"
  - "[[br_005_Integration_Contracts_DTOs]]"
---

# `app/domain/ports/user_repository.py` — Port IUserRepository

## Context & Purpose

Declara o **contrato de persistência** para o aggregate
[[br_file_domain_entities_user_py]]. Este Port é a *única* coisa que a
camada de aplicação (use cases, services) vê quando precisa ler ou
escrever users. Adapters concretos (SQLAlchemy, fake in-memory, remote
service) vivem na camada de infraestrutura e satisfazem esse Protocol
estruturalmente.

O Port é a **fonte da verdade para a integração com [[br_DBA_Team]]**:
uma vez que aterrisse, eles podem implementar contra as assinaturas sem
nova coordenação com o backend.

## Logic Breakdown

```python
class IUserRepository(Protocol):
    async def get(self, user_id: UUID) -> User | None: ...
    async def get_by_email(self, email: str) -> User | None: ...
    async def add(self, user: User) -> User: ...
    async def update(self, user: User) -> User: ...
    async def list_active(
        self, *, limit: int = 50, offset: int = 0
    ) -> list[User]: ...
```

Semântica dos métodos:

- **`get`** — lookup por primary-key; retorna `None` para missing em
  vez de levantar, para callers escolherem entre 404 e
  "create-on-miss".
- **`get_by_email`** — caminho de login; implementações DEVEM matchar
  case-insensitivamente (a entity armazena email na forma canônica).
- **`add`** — insere user novo; levanta se email já existe. O tipo
  exato de exception é específico do adapter; use cases traduzem para
  um `ConflictError` de domínio na fronteira da aplicação.
- **`update`** — substituição completa de campos mutáveis por `id`.
  Concorrência otimista (ex.: coluna de version) é preocupação futura
  documentada em [[br_Concurrency_Strategy]] *(planejado)*.
- **`list_active`** — paginado; default 50/0 mantém respostas
  pequenas. Necessário para a tela futura de admin-dashboard.

## Por que `Protocol` (e não `ABC`)

Tipagem estrutural casa com ports precisamente:

- **Sem herança exigida.** Test doubles podem ser dicts simples
  embrulhados em uma classe; mypy ainda verifica que satisfazem o
  contrato.
- **Sem acoplamento ao path de import da abstração.** O domínio define
  o Protocol; adapters nunca importam só para "reivindicar herança".
  Eles simplesmente implementam os métodos.
- **Compatibilidade first-class com FastAPI DI.** Adapters fazem bind
  no composition root; o resto da base tipa suas dependências como
  `IUserRepository`.

## Dependencies
- **Internas:** [[br_file_domain_entities_user_py]].
- **Externas:** `typing.Protocol`, `uuid` apenas.

## Consumers
- Futuros `AuthenticateDoctorUseCase`, `RegisterUserUseCase`,
  `ListDoctorsUseCase`.
- Adapter futuro de infraestrutura (SQLAlchemy, propriedade do
  [[br_DBA_Team]]).
- Test fakes (`InMemoryUserRepository`).

## Invariants / Pitfalls
- **Async por design.** Mesmo sem impl concreta, toda assinatura é
  `async`. Misturar repositórios sync e async nesta camada forçaria
  todo consumer a saber qual é qual.
- **`None` para missing, não exception.** Adapters precisam retornar
  `None` de `get`/`get_by_email` em vez de levantar.
- **Email é canonicalizado antes do lookup.** Implementações de
  adapter precisam matchar a forma lower-case da entity para evitar
  colisões case-sensitive.
- **Sem método `delete` no Port.** Deleção LGPD-compliant é
  pseudonimização + `is_active=False`, modelada na entity. Hard
  delete está intencionalmente ausente.

## Related ADRs
- [[br_001_Architecture_and_Context]]
- [[br_003_Hexagonal_Architecture_Strategy]]
- [[br_005_Integration_Contracts_DTOs]]
- [[br_006_LGPD_PII_Strategy]]

#file #domain #port #protocol #user #repository #pt-br
