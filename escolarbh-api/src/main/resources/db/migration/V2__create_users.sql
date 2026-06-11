-- ============================================================
-- V2: Tabela USERS
-- ============================================================
-- Usuários do sistema: pais (CONTRATANTE), motoristas (MOTORISTA), admins (ADMIN).
-- CPF e email são únicos. Senha armazenada com bcrypt via Spring Security.
-- ============================================================

CREATE TYPE user_role AS ENUM ('CONTRATANTE', 'MOTORISTA', 'ADMIN');

CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo   VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    senha_hash      VARCHAR(255)    NOT NULL,
    cpf             VARCHAR(14)     NOT NULL,       -- Formato: 000.000.000-00
    telefone        VARCHAR(20),                     -- Formato: +55 (31) 99999-9999
    role            user_role       NOT NULL DEFAULT 'CONTRATANTE',
    ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    email_verificado BOOLEAN        NOT NULL DEFAULT FALSE,
    ultimo_login    TIMESTAMPTZ,
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_cpf UNIQUE (cpf),
    CONSTRAINT ck_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT ck_users_cpf_format CHECK (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$')
);

-- Índices para buscas frequentes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_cpf ON users (cpf);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_criado_em ON users (criado_em DESC);

-- Trigger para atualizar 'atualizado_em' automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_atualizado_em
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê/edita a si mesmo (exceto ADMIN)
CREATE POLICY users_self_access ON users
    FOR ALL
    USING (
        id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

COMMENT ON TABLE users IS 'Usuários da plataforma EscolarBH';
COMMENT ON COLUMN users.senha_hash IS 'Hash bcrypt da senha — nunca armazenar em texto plano';
COMMENT ON COLUMN users.cpf IS 'CPF formatado (000.000.000-00) — constraint de formato';
