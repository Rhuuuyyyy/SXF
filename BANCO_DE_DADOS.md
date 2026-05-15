# SXFp — Especificação Completa do Banco de Dados

**Versão:** 1.0  
**Banco:** PostgreSQL 15+  
**Extensões obrigatórias:** `pgcrypto`  
**Conformidade:** LGPD (Lei nº 13.709/2018)

---

## 0. Convenções Gerais

| Convenção | Valor |
|---|---|
| Charset | `UTF8` |
| Timezone | `UTC` |
| Prefixo de tabelas físicas | `tb_` |
| Views lógicas | sem prefixo (`pacientes`, `avaliacoes`) |
| Chave PGP de app | injetada via `SET app.pgp_key = '...'` no início de cada sessão (ver `app/db/database.py`) |
| Collation padrão | `pt_BR.utf8` |

---

## 1. Tabelas Físicas

### 1.1 `tb_usuarios` — Médicos e administradores

```sql
CREATE TABLE tb_usuarios (
    id              BIGSERIAL       PRIMARY KEY,
    email           TEXT            NOT NULL UNIQUE,
    senha_hash      TEXT            NOT NULL,       -- bcrypt via trigger (ver §4.1)
    nome_completo   TEXT            NOT NULL,
    crm             TEXT,
    role            TEXT            NOT NULL DEFAULT 'doctor'
                                    CHECK (role IN ('doctor', 'admin')),
    ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tb_usuarios IS
    'Profissionais de saúde autorizados. Senhas armazenadas como bcrypt (trigger).';
COMMENT ON COLUMN tb_usuarios.role IS
    'doctor: acesso padrão; admin: pode executar REFRESH MATERIALIZED VIEW.';
```

### 1.2 `tb_pacientes` — Dados clínicos dos pacientes

```sql
CREATE TABLE tb_pacientes (
    id                          BIGSERIAL   PRIMARY KEY,
    uuid                        UUID        NOT NULL UNIQUE,        -- identidade de domínio
    nome_enc                    BYTEA       NOT NULL,               -- PGP: pgp_sym_encrypt(nome, key)
    cpf_hash                    TEXT,                               -- SHA-256 do CPF (nunca CPF plano)
    data_nascimento             DATE        NOT NULL,
    sexo                        CHAR(1)     NOT NULL CHECK (sexo IN ('M', 'F', 'I')),
    etnia                       TEXT        NOT NULL,
    uf_nascimento               CHAR(2)     NOT NULL,
    municipio_residencia        TEXT        NOT NULL,
    uf_residencia               CHAR(2)     NOT NULL,
    prematuro                   BOOLEAN     NOT NULL DEFAULT FALSE,
    idade_gestacional_semanas   INT,
    peso_nascimento_gramas      NUMERIC(7,2),
    escolaridade                TEXT,
    tem_diagnostico_autismo     BOOLEAN     NOT NULL DEFAULT FALSE,
    tem_diagnostico_tdah        BOOLEAN     NOT NULL DEFAULT FALSE,
    outras_comorbidades         TEXT,
    medicamentos_uso            TEXT,
    acompanhante_id             BIGINT      REFERENCES tb_acompanhantes(id),
    grau_parentesco             TEXT,
    diagnostico_confirmado_fxs  BOOLEAN,
    family_history_fxs          BOOLEAN     NOT NULL DEFAULT FALSE,
    criado_por                  BIGINT      NOT NULL REFERENCES tb_usuarios(id),
    criado_em                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pacientes_criado_por  ON tb_pacientes(criado_por);
CREATE INDEX idx_pacientes_cpf_hash    ON tb_pacientes(cpf_hash) WHERE cpf_hash IS NOT NULL;
CREATE INDEX idx_pacientes_uf          ON tb_pacientes(uf_residencia);

COMMENT ON COLUMN tb_pacientes.uuid IS
    'UUID v4 gerado pelo domínio Python. Usado como identidade pública.';
COMMENT ON COLUMN tb_pacientes.nome_enc IS
    'Nome completo criptografado com pgp_sym_encrypt(). Descriptografado apenas pela view.';
COMMENT ON COLUMN tb_pacientes.cpf_hash IS
    'SHA-256 hexadecimal do CPF sem pontuação. Permite busca exata sem expor o dado.';
```

### 1.3 `tb_acompanhantes` — Cuidadores/responsáveis

```sql
CREATE TABLE tb_acompanhantes (
    id          BIGSERIAL   PRIMARY KEY,
    uuid        UUID        NOT NULL UNIQUE,
    nome        TEXT        NOT NULL,
    cpf_hash    TEXT,                               -- SHA-256 (opcional)
    telefone    TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tb_acompanhantes IS
    'Cuidadores ou responsáveis legais. Relacionado a tb_pacientes via FK.';
```

### 1.4 `tb_sintomas` — Catálogo de sintomas com pesos estatísticos

```sql
CREATE TABLE tb_sintomas (
    id          BIGSERIAL   PRIMARY KEY,
    codigo      TEXT        NOT NULL UNIQUE,    -- ex: 'deficiencia_intelectual'
    descricao   TEXT        NOT NULL,
    peso_m      NUMERIC(6,4) NOT NULL,          -- peso para sexo Masculino
    peso_f      NUMERIC(6,4),                   -- peso para sexo Feminino (NULL = não aplicável)
    ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
    versao      TEXT        NOT NULL DEFAULT 'ROMERO_2025_v1'
);

COMMENT ON TABLE tb_sintomas IS
    'Catálogo imutável de sintomas clínicos validados (Romero 2025). '
    'Alterar pesos requer novo registro de versão e ADR.';
```

### 1.5 `tb_avaliacoes` — Avaliações clínicas

```sql
CREATE TABLE tb_avaliacoes (
    id                      BIGSERIAL   PRIMARY KEY,
    paciente_id             BIGINT      NOT NULL REFERENCES tb_pacientes(id),
    usuario_id              BIGINT      NOT NULL REFERENCES tb_usuarios(id),
    data_avaliacao          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observacoes             TEXT        NOT NULL DEFAULT '',
    diagnostico_previo_fxs  BOOLEAN     NOT NULL DEFAULT FALSE,
    score_final             BYTEA,              -- ENCRYPTED: pgp_sym_encrypt(score::TEXT, key)
    score_plain             NUMERIC(6,4)
        GENERATED ALWAYS AS (
            -- Note: geração funcional não pode chamar pgp. Use trigger para descriptografar.
            -- Esta coluna pode ser NULL até o trigger de scoring preencher score_final.
            NULL
        ) STORED,
    limiar_usado            NUMERIC(5,2),
    recomenda_exame         BOOLEAN,
    versao_param            TEXT,
    status                  TEXT        NOT NULL DEFAULT 'rascunho'
                                        CHECK (status IN ('rascunho', 'finalizada', 'cancelada')),
    criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nota: score_plain não pode ser GENERATED com pgp; usar view para descriptografia.
-- Remover a coluna GENERATED e usar somente score_final (BYTEA) + view de leitura.

CREATE INDEX idx_avaliacoes_paciente    ON tb_avaliacoes(paciente_id);
CREATE INDEX idx_avaliacoes_usuario     ON tb_avaliacoes(usuario_id);
CREATE INDEX idx_avaliacoes_data        ON tb_avaliacoes(data_avaliacao DESC);

COMMENT ON COLUMN tb_avaliacoes.score_final IS
    'Score calculado por fn_calcular_score_triagem(), armazenado PGP-criptografado.';
```

> **Nota de implementação:** Remover a coluna `score_plain GENERATED ALWAYS` — PostgreSQL não permite chamar `pgp_sym_decrypt` em colunas geradas. A descriptografia do score ocorre exclusivamente na `avaliacoes` VIEW.

### 1.6 `tb_respostas_checklist` — Respostas individuais por sintoma

```sql
CREATE TABLE tb_respostas_checklist (
    id              BIGSERIAL   PRIMARY KEY,
    avaliacao_id    BIGINT      NOT NULL REFERENCES tb_avaliacoes(id),
    sintoma_id      BIGINT      NOT NULL REFERENCES tb_sintomas(id),
    presente        BOOLEAN     NOT NULL,
    observacao      TEXT        NOT NULL DEFAULT '',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (avaliacao_id, sintoma_id)
);

CREATE INDEX idx_respostas_avaliacao ON tb_respostas_checklist(avaliacao_id);
```

### 1.7 `tb_log_sessoes` — Sessões autenticadas

```sql
CREATE TABLE tb_log_sessoes (
    id                  BIGSERIAL   PRIMARY KEY,
    usuario_id          BIGINT      NOT NULL REFERENCES tb_usuarios(id),
    ip_origem           TEXT        NOT NULL,
    user_agent          TEXT        NOT NULL DEFAULT '',
    iniciada_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    encerrada_em        TIMESTAMPTZ,
    tipo_encerramento   TEXT        CHECK (tipo_encerramento IN ('logout', 'timeout', 'revogado')),
    ativa               BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_sessoes_usuario  ON tb_log_sessoes(usuario_id, ativa);
CREATE INDEX idx_sessoes_iniciada ON tb_log_sessoes(iniciada_em DESC);
```

### 1.8 `tb_log_tentativas_login` — Auditoria de autenticação (anti-brute-force)

```sql
CREATE TABLE tb_log_tentativas_login (
    id              BIGSERIAL   PRIMARY KEY,
    email_tentado   TEXT        NOT NULL,
    ip_origem       TEXT        NOT NULL,
    user_agent      TEXT        NOT NULL DEFAULT '',
    sucesso         BOOLEAN     NOT NULL,
    usuario_id      BIGINT      REFERENCES tb_usuarios(id),
    sessao_id       BIGINT      REFERENCES tb_log_sessoes(id),
    motivo_falha    TEXT,
    tentado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_ip        ON tb_log_tentativas_login(ip_origem, tentado_em DESC);
CREATE INDEX idx_login_email     ON tb_log_tentativas_login(email_tentado, tentado_em DESC);
```

### 1.9 `tb_log_analises` — Registro de abertura do formulário de checklist

```sql
CREATE TABLE tb_log_analises (
    id              BIGSERIAL   PRIMARY KEY,
    avaliacao_id    BIGINT      NOT NULL REFERENCES tb_avaliacoes(id),
    usuario_id      BIGINT      NOT NULL REFERENCES tb_usuarios(id),
    sessao_id       BIGINT      NOT NULL REFERENCES tb_log_sessoes(id),
    aberto_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    encerrado_em    TIMESTAMPTZ
);
```

---

## 2. Views Lógicas

As views são a **única interface de leitura/escrita** do backend Python. O backend nunca acessa `tb_*` diretamente.

### 2.1 `pacientes` (view de escrita+leitura)

```sql
CREATE VIEW pacientes AS
SELECT
    p.id,
    p.uuid,
    pgp_sym_decrypt(p.nome_enc, current_setting('app.pgp_key', true)) AS nome,
    p.cpf_hash,
    p.data_nascimento,
    p.sexo,
    p.etnia,
    p.uf_nascimento,
    p.municipio_residencia,
    p.uf_residencia,
    p.prematuro,
    p.idade_gestacional_semanas,
    p.peso_nascimento_gramas,
    p.escolaridade,
    p.tem_diagnostico_autismo,
    p.tem_diagnostico_tdah,
    p.outras_comorbidades,
    p.medicamentos_uso,
    p.acompanhante_id,
    p.grau_parentesco,
    p.diagnostico_confirmado_fxs,
    p.family_history_fxs,
    p.criado_por,
    p.criado_em
FROM tb_pacientes p;

-- INSTEAD OF INSERT trigger faz: PGP encrypt(nome), store uuid, RETURNING id (BIGSERIAL)
CREATE TRIGGER trg_paciente_insert
    INSTEAD OF INSERT ON pacientes
    FOR EACH ROW EXECUTE FUNCTION fn_paciente_insert();
```

**Contrato com o backend Python:**
- INSERT: usa coluna `uuid` para o UUID do domínio; coluna `nome` para o nome em claro
- RETURNING `id`: retorna o BIGSERIAL gerado (populado em `Patient.db_id`)
- SELECT `id`: retorna BIGSERIAL (usado como `paciente_id` em `avaliacoes`)

### 2.2 `avaliacoes` (view de escrita+leitura)

```sql
CREATE VIEW avaliacoes AS
SELECT
    a.id,
    a.paciente_id,
    a.usuario_id,
    a.data_avaliacao,
    a.observacoes,
    a.diagnostico_previo_fxs,
    pgp_sym_decrypt(a.score_final, current_setting('app.pgp_key', true))::NUMERIC AS score_final,
    a.limiar_usado,
    a.recomenda_exame,
    a.versao_param,
    a.status,
    a.criado_em
FROM tb_avaliacoes a
WHERE a.status != 'cancelada';

-- INSERT (status='rascunho'), UPDATE (após score), RETURNING id
CREATE TRIGGER trg_avaliacao_insert
    INSTEAD OF INSERT ON avaliacoes
    FOR EACH ROW EXECUTE FUNCTION fn_avaliacao_insert();
```

---

## 3. Funções e Procedures

### 3.1 `fn_paciente_insert()` — Trigger INSTEAD OF INSERT na view `pacientes`

```sql
CREATE OR REPLACE FUNCTION fn_paciente_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_serial_id BIGINT;
    v_pgp_key   TEXT := current_setting('app.pgp_key', true);
BEGIN
    INSERT INTO tb_pacientes (
        uuid, nome_enc, cpf_hash, data_nascimento, sexo,
        etnia, uf_nascimento, municipio_residencia, uf_residencia,
        prematuro, idade_gestacional_semanas, peso_nascimento_gramas,
        escolaridade, tem_diagnostico_autismo, tem_diagnostico_tdah,
        outras_comorbidades, medicamentos_uso, acompanhante_id, grau_parentesco,
        diagnostico_confirmado_fxs, criado_por, criado_em
    ) VALUES (
        NEW.uuid::UUID,
        pgp_sym_encrypt(NEW.nome, v_pgp_key),
        NEW.cpf_hash,
        NEW.data_nascimento,
        NEW.sexo,
        NEW.etnia,
        NEW.uf_nascimento,
        NEW.municipio_residencia,
        NEW.uf_residencia,
        COALESCE(NEW.prematuro, FALSE),
        NEW.idade_gestacional_semanas,
        NEW.peso_nascimento_gramas,
        NEW.escolaridade,
        COALESCE(NEW.tem_diagnostico_autismo, FALSE),
        COALESCE(NEW.tem_diagnostico_tdah, FALSE),
        NEW.outras_comorbidades,
        NEW.medicamentos_uso,
        NEW.acompanhante_id,
        NEW.grau_parentesco,
        NEW.diagnostico_confirmado_fxs,
        NEW.criado_por,
        COALESCE(NEW.criado_em, NOW())
    )
    RETURNING id INTO v_serial_id;

    -- Substituir o uuid pelo BIGSERIAL no NEW retornado para que
    -- RETURNING id na instrução INSERT da view retorne o serial correto.
    NEW.id := v_serial_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 `fn_avaliacao_insert()` — Trigger INSTEAD OF INSERT na view `avaliacoes`

```sql
CREATE OR REPLACE FUNCTION fn_avaliacao_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_serial_id BIGINT;
BEGIN
    INSERT INTO tb_avaliacoes (
        paciente_id, usuario_id, observacoes,
        diagnostico_previo_fxs, status, criado_em
    ) VALUES (
        NEW.paciente_id,
        NEW.usuario_id,
        COALESCE(NEW.observacoes, ''),
        COALESCE(NEW.diagnostico_previo_fxs, FALSE),
        'rascunho',
        NOW()
    )
    RETURNING id INTO v_serial_id;

    NEW.id := v_serial_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 `fn_calcular_score_triagem(avaliacao_id BIGINT)` — Cálculo do score

Esta é a função central do **Active Database Pattern**. Ela é chamada pelo backend após a inserção das respostas do checklist.

```sql
CREATE OR REPLACE FUNCTION fn_calcular_score_triagem(p_avaliacao_id BIGINT)
RETURNS TABLE (
    score_final         NUMERIC,
    limiar_usado        NUMERIC,
    recomenda_exame     BOOLEAN,
    versao_param        TEXT
) AS $$
DECLARE
    v_sexo          CHAR(1);
    v_score         NUMERIC(6,4) := 0;
    v_limiar        NUMERIC(5,2);
    v_recomenda     BOOLEAN;
    v_versao        TEXT;
    v_pgp_key       TEXT := current_setting('app.pgp_key', true);
BEGIN
    -- 1. Descobrir o sexo do paciente para selecionar pesos corretos
    SELECT p.sexo
    INTO   v_sexo
    FROM   tb_avaliacoes a
    JOIN   tb_pacientes  p ON p.id = a.paciente_id
    WHERE  a.id = p_avaliacao_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Avaliação % não encontrada', p_avaliacao_id;
    END IF;

    -- 2. Somar os pesos dos sintomas marcados como presentes
    SELECT COALESCE(SUM(
        CASE
            WHEN v_sexo = 'M' THEN s.peso_m
            ELSE COALESCE(s.peso_f, 0)
        END
    ), 0)
    INTO v_score
    FROM tb_respostas_checklist rc
    JOIN tb_sintomas             s  ON s.id = rc.sintoma_id
    WHERE rc.avaliacao_id = p_avaliacao_id
      AND rc.presente = TRUE
      AND s.ativo     = TRUE;

    -- 3. Aplicar limiar validado pelo estudo Romero 2025
    v_limiar   := CASE WHEN v_sexo = 'M' THEN 0.56 ELSE 0.55 END;
    v_recomenda := (v_score >= v_limiar);
    v_versao   := 'ROMERO_2025_v1_' || v_sexo;

    -- 4. Atualizar a avaliação com o score e marcar como finalizada
    UPDATE tb_avaliacoes
    SET
        score_final     = pgp_sym_encrypt(v_score::TEXT, v_pgp_key),
        limiar_usado    = v_limiar,
        recomenda_exame = v_recomenda,
        versao_param    = v_versao,
        status          = 'finalizada'
    WHERE id = p_avaliacao_id;

    -- 5. Encerrar o log de análise
    UPDATE tb_log_analises
    SET encerrado_em = NOW()
    WHERE avaliacao_id = p_avaliacao_id
      AND encerrado_em IS NULL;

    -- 6. Retornar o resultado para o backend
    RETURN QUERY
    SELECT v_score, v_limiar, v_recomenda, v_versao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_calcular_score_triagem IS
    'Calcula o score de triagem SXF, atualiza tb_avaliacoes e encerra tb_log_analises. '
    'Pesos validados: Romero 2025 (AUC 0,73♂ / 0,76♀). Alterar exige novo ADR.';
```

### 3.4 `fn_acompanhante_insert()` — Trigger INSTEAD OF INSERT na view `acompanhantes`

```sql
CREATE OR REPLACE FUNCTION fn_acompanhante_insert()
RETURNS TRIGGER AS $$
DECLARE v_id BIGINT;
BEGIN
    INSERT INTO tb_acompanhantes (uuid, nome, cpf_hash, telefone, email)
    VALUES (NEW.uuid::UUID, NEW.nome, NEW.cpf_hash, NEW.telefone, NEW.email)
    RETURNING id INTO v_id;

    NEW.id := v_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Triggers

### 4.1 `trg_hash_senha_usuario` — Bcrypt automático no INSERT/UPDATE de senhas

```sql
CREATE OR REPLACE FUNCTION fn_hash_senha_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Apenas hasheia se a senha mudou e não é já um hash bcrypt
    IF NEW.senha_hash IS DISTINCT FROM OLD.senha_hash
       AND NEW.senha_hash NOT LIKE '$2%' THEN
        NEW.senha_hash := crypt(NEW.senha_hash, gen_salt('bf', 12));
    END IF;
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hash_senha_usuario
    BEFORE INSERT OR UPDATE OF senha_hash ON tb_usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_hash_senha_usuario();

COMMENT ON TRIGGER trg_hash_senha_usuario ON tb_usuarios IS
    'Converte senha em texto plano para bcrypt (custo 12) automaticamente. '
    'O backend nunca armazena nem loga senhas em claro.';
```

### 4.2 `trg_sessao_atualiza_ativa` — Fecha sessão ao registrar encerramento

```sql
CREATE OR REPLACE FUNCTION fn_sessao_atualiza_ativa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.encerrada_em IS NOT NULL AND OLD.encerrada_em IS NULL THEN
        NEW.ativa := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sessao_atualiza_ativa
    BEFORE UPDATE OF encerrada_em ON tb_log_sessoes
    FOR EACH ROW EXECUTE FUNCTION fn_sessao_atualiza_ativa();
```

---

## 5. View Materializada — Dashboard Epidemiológico

```sql
CREATE MATERIALIZED VIEW vw_dashboard_anonimizado AS
SELECT
    p.uf_residencia,
    p.sexo,
    CASE
        WHEN DATE_PART('year', AGE(p.data_nascimento)) BETWEEN 0  AND 4  THEN '0-4'
        WHEN DATE_PART('year', AGE(p.data_nascimento)) BETWEEN 5  AND 9  THEN '5-9'
        WHEN DATE_PART('year', AGE(p.data_nascimento)) BETWEEN 10 AND 17 THEN '10-17'
        WHEN DATE_PART('year', AGE(p.data_nascimento)) BETWEEN 18 AND 29 THEN '18-29'
        WHEN DATE_PART('year', AGE(p.data_nascimento)) BETWEEN 30 AND 44 THEN '30-44'
        ELSE '45+'
    END                                              AS faixa_etaria,
    p.etnia,
    COUNT(a.id)                                      AS total_avaliacoes,
    ROUND(AVG(
        pgp_sym_decrypt(a.score_final, current_setting('app.pgp_key', true))::NUMERIC
    ), 4)                                            AS media_score,
    ROUND(
        COUNT(*) FILTER (WHERE a.recomenda_exame = TRUE)::NUMERIC
        / NULLIF(COUNT(a.id), 0), 4
    )                                                AS taxa_recomendacao_exame
FROM tb_avaliacoes a
JOIN tb_pacientes  p ON p.id = a.paciente_id
WHERE a.status = 'finalizada'
GROUP BY p.uf_residencia, p.sexo, faixa_etaria, p.etnia;

-- Índice único obrigatório para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_vw_dashboard_unique
    ON vw_dashboard_anonimizado(uf_residencia, sexo, faixa_etaria, etnia)
    NULLS NOT DISTINCT;

COMMENT ON MATERIALIZED VIEW vw_dashboard_anonimizado IS
    'Agregados epidemiológicos sujeitos a k-anonimato (threshold=5) no use case Python. '
    'Atualizada via POST /api/v1/dashboard/refresh (role admin).';
```

> **Atenção PGP:** A view materializada chama `pgp_sym_decrypt` durante o `REFRESH`. O `SET app.pgp_key` deve estar ativo na sessão que executa o `REFRESH MATERIALIZED VIEW`.

---

## 6. Dados de Seed

### 6.1 Seed da tabela `tb_sintomas` — IDs 1–12 (imutáveis)

> ⚠️ **Crítico:** Os IDs abaixo devem corresponder exatamente ao `SINTOMA_ID_MAP` em `frontend/app/lib/sintomaIds.js`. Alterar a ordem ou os IDs quebra a submissão do checklist.

```sql
INSERT INTO tb_sintomas (id, codigo, descricao, peso_m, peso_f, versao)
OVERRIDING SYSTEM VALUE
VALUES
    (1,  'deficiencia_intelectual',   'Deficiência intelectual',      0.3200, 0.2000, 'ROMERO_2025_v1'),
    (2,  'face_alongada_orelhas',     'Face alongada / orelhas',      0.2900, 0.0900, 'ROMERO_2025_v1'),
    (3,  'macroorquidismo',           'Macroorquidismo',              0.2600, NULL,   'ROMERO_2025_v1'),
    (4,  'hipermobilidade_articular', 'Hipermobilidade articular',    0.1900, 0.0400, 'ROMERO_2025_v1'),
    (5,  'dificuldades_aprendizagem', 'Dificuldades de aprendizagem', 0.1800, 0.2800, 'ROMERO_2025_v1'),
    (6,  'deficit_atencao',           'Déficit de atenção',           0.1700, 0.1200, 'ROMERO_2025_v1'),
    (7,  'movimentos_repetitivos',    'Movimentos repetitivos',       0.1700, 0.0500, 'ROMERO_2025_v1'),
    (8,  'atraso_fala',               'Atraso na fala',               0.1400, 0.0100, 'ROMERO_2025_v1'),
    (9,  'hiperatividade',            'Hiperatividade',               0.1200, 0.0400, 'ROMERO_2025_v1'),
    (10, 'evita_contato_visual',      'Evita contato visual',         0.0600, 0.0800, 'ROMERO_2025_v1'),
    (11, 'evita_contato_fisico',      'Evita contato físico',         0.0400, 0.0700, 'ROMERO_2025_v1'),
    (12, 'agressividade',             'Agressividade',                0.0100, 0.0200, 'ROMERO_2025_v1');

-- Reiniciar a sequência para que próximos inserts não colidam
SELECT SETVAL('tb_sintomas_id_seq', 12, TRUE);
```

### 6.2 Seed de usuário administrador inicial

```sql
-- A trigger fn_hash_senha_usuario faz o bcrypt automaticamente.
INSERT INTO tb_usuarios (email, senha_hash, nome_completo, role)
VALUES (
    'admin@sxf.med.br',
    'TrocarEstasenha123!',   -- será hasheada pela trigger
    'Administrador SXF',
    'admin'
);
```

---

## 7. Roles de Banco e Permissões

```sql
-- Role transacional (usada pelo FastAPI)
CREATE ROLE nivel_1 NOLOGIN;
GRANT CONNECT ON DATABASE sxfp TO nivel_1;
GRANT USAGE  ON SCHEMA public TO nivel_1;

-- Permissões de leitura/escrita apenas nas views e funções
GRANT SELECT, INSERT, UPDATE ON pacientes   TO nivel_1;
GRANT SELECT, INSERT, UPDATE ON avaliacoes  TO nivel_1;
GRANT SELECT, INSERT         ON acompanhantes TO nivel_1;
GRANT SELECT, INSERT         ON respostas_checklist TO nivel_1;  -- tabela física (sem view)
GRANT SELECT, INSERT         ON tb_log_sessoes TO nivel_1;
GRANT SELECT, INSERT         ON tb_log_tentativas_login TO nivel_1;
GRANT SELECT, INSERT, UPDATE ON tb_log_analises TO nivel_1;
GRANT EXECUTE ON FUNCTION fn_calcular_score_triagem(BIGINT) TO nivel_1;
GRANT SELECT ON vw_dashboard_anonimizado TO nivel_1;

-- Proibir acesso direto às tabelas físicas de pacientes
REVOKE ALL ON tb_pacientes FROM nivel_1;
REVOKE ALL ON tb_avaliacoes FROM nivel_1;

-- Role de app (login com senha)
CREATE ROLE app_user LOGIN PASSWORD 'definir_em_env' IN ROLE nivel_1;
```

---

## 8. Índices de Performance Recomendados

```sql
-- Busca de avaliações por data (dashboard summary)
CREATE INDEX idx_avaliacoes_data_usuario
    ON tb_avaliacoes(usuario_id, data_avaliacao DESC)
    WHERE status = 'finalizada';

-- Busca de pacientes por nome (ILIKE — requer pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_pacientes_nome_trgm
    ON tb_pacientes USING GIN (pgp_sym_decrypt(nome_enc, current_setting('app.pgp_key', true)) gin_trgm_ops);
-- Nota: este índice não pode usar colunas PGP diretamente. Alternativa: índice funcional
-- com uma função wrapper, ou descriptografar na camada da view e usar FTS.

-- Alternativa prática: índice GIN no nome da view (requer função IMMUTABLE)
-- A ser definido junto com o DBA após testes de performance.
```

---

## 9. Variáveis de Configuração da Sessão

O backend (ver `app/db/database.py`) executa no início de cada sessão de banco:

```sql
SET app.pgp_key = '<valor da variável PGP_KEY do .env>';
```

Isso torna a chave disponível para todas as funções via `current_setting('app.pgp_key', true)`.

---

## 10. Checklist de Setup (ordem de execução)

```
1. CREATE DATABASE sxfp;
2. \c sxfp
3. CREATE EXTENSION pgcrypto;
4. CREATE EXTENSION pg_trgm;     -- para buscas por nome
5. Criar tabelas (§1) na ordem:
   tb_usuarios → tb_acompanhantes → tb_pacientes →
   tb_sintomas → tb_avaliacoes → tb_respostas_checklist →
   tb_log_sessoes → tb_log_tentativas_login → tb_log_analises
6. Criar funções de trigger (§3)
7. Criar triggers (§4)
8. Criar views e INSTEAD OF triggers (§2)
9. Criar view materializada (§5)
10. Criar roles e permissões (§7)
11. Executar seeds (§6)
12. Testar: SELECT * FROM fn_calcular_score_triagem(<id>)
```

---

*Documento gerado para a fase de persistência do SXFp. Qualquer alteração nos pesos da tabela `tb_sintomas` deve ser tratada como nova versão e acompanhada de ADR.*
