---
title: auth_service.py
type: File
status: Active
language: pt-BR
mirrors: "[[file_services_auth_service_py]]"
file_language: python
path: app/services/auth_service.py
created_date: 2026-05-03
updated_date: 2026-05-08
sprint: 3
author: backend-team
project: SXFp
parent: "[[br_dir_app_services]]"
tags:
  - file
  - services
  - auth
  - session
  - brute-force
  - audit
  - pt-br
related:
  - "[[br_file_core_exceptions_py]]"
  - "[[br_file_db_database_py]]"
  - "[[br_file_presentation_routers_auth_py]]"
  - "[[br_008_AuthN_Strategy]]"
  - "[[br_007_Audit_Logging_Middleware]]"
  - "[[br_006_LGPD_PII_Strategy]]"
---

# `app/services/auth_service.py` — Serviço de Autenticação e Ciclo de Vida de Sessão

## Contexto e Propósito

Escopo do Sprint 2: gerencia o **ciclo de vida de sessão** e a **trilha de
auditoria de login** contra `tb_log_sessoes` e `tb_log_tentativas_login`.
O fluxo completo de emissão JWT é o Sprint 3 (ADR-008).

A tabela `usuarios` usa bcrypt via trigger `trg_hash_senha_usuario`. A
verificação de senha usa o `crypt()` nativo do PostgreSQL — a camada Python
nunca lida com bcrypt diretamente.

## Logic Breakdown

**`open_session(usuario_id, ip_origem, user_agent) -> int`**
- Faz INSERT em `tb_log_sessoes`, retorna `sessao_id` (BIGSERIAL).
- O `sessao_id` retornado DEVE ser embutido no JWT como claim `sid`.

**`close_session(sessao_id, tipo_encerramento) -> None`**
- Faz UPDATE em `tb_log_sessoes` setando `encerrada_em = NOW()`.
- `tipo_encerramento`: `'logout' | 'timeout' | 'forcado' | 'expirado'`.

**`log_tentativa_login(email_tentado, ip_origem, user_agent, sucesso, ...) -> None`**
- INSERT append-only em `tb_log_tentativas_login`.
- `UPDATE`/`DELETE` são revogados para todos os roles — imutável por política do banco.
- Chamar em toda tentativa de login (sucesso e falha).

**`check_brute_force(ip_origem, janela_minutos=10, max_falhas=5) -> bool`**
- Conta falhas do `ip_origem` na janela deslizante.
- Retorna `True` se o threshold for excedido — o chamador deve abortar o login.
- Usa `CAST(:ip AS INET)` (tipo específico do PostgreSQL).
- Deve ser chamado ANTES da verificação de credenciais.

**`authenticate_doctor(email, senha_plain) -> int | None`** *(Sprint 3)*
- Verifica credenciais usando `crypt()` nativo do PostgreSQL — Python nunca
  toca bcrypt.
- Retorna o PK inteiro (`id`) se válido e `ativo = TRUE`, caso contrário `None`.
- `email` é lowercased na query.
- `senha_plain` NUNCA DEVE ser logada — restrição LGPD.

## Dependências
- **Interno:** [[br_file_db_database_py]] (`AsyncSession` injetado).
- **Externo:** `sqlalchemy`.

## Consumidores
- [[br_file_presentation_routers_auth_py]] (endpoints de login + logout).
- Futuros `RefreshTokenUseCase`, `ChangePasswordUseCase`.

## Invariantes / Armadilhas
- **Não logue senha nem email** em plaintext. Strings de token também são
  credenciais — nunca logar.
- `check_brute_force` deve rodar antes da verificação de credenciais para
  prevenir enumeração por timing.
- O Sprint 3 adicionará `authenticate_doctor()` usando
  `SELECT crypt(:pwd, senha_hash) = senha_hash FROM usuarios WHERE email = :email`.

## ADRs Relacionados
- [[br_006_LGPD_PII_Strategy]]
- [[br_007_Audit_Logging_Middleware]]
- [[br_008_AuthN_Strategy]] *(planejado)*
- [[br_009_Authorization_RBAC]] *(planejado)*

#file #services #auth #session #brute-force #audit #pt-br
