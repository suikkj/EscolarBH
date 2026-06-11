-- ============================================================
-- V5: Tabela CONTRACTS
-- ============================================================
-- Contratos eletrônicos entre pais e motoristas.
-- Inclui evidências de assinatura digital para validade jurídica
-- (MP 2200-2): IP, User-Agent, timestamp, token da plataforma de assinatura.
-- ============================================================

CREATE TYPE contract_status AS ENUM (
    'RASCUNHO',         -- Contrato criado, aguardando assinatura
    'AGUARDANDO_ASSINATURA',  -- Enviado para assinatura na ZapSign
    'ATIVO',            -- Assinado e vigente
    'SUSPENSO',         -- Suspenso por inadimplência
    'ENCERRADO',        -- Encerrado normalmente
    'CANCELADO'         -- Cancelado antes do início
);

CREATE TABLE contracts (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id      UUID                NOT NULL,
    driver_id           UUID                NOT NULL,
    
    -- Status e vigência
    status              contract_status     NOT NULL DEFAULT 'RASCUNHO',
    vigencia_inicio     DATE,
    vigencia_fim        DATE,
    
    -- Documento e assinatura eletrônica
    pdf_url             TEXT,                               -- URL no Supabase Storage
    pdf_storage_path    VARCHAR(500),                       -- Path no bucket do Supabase
    
    -- Evidências de assinatura (validade jurídica)
    assinatura_token    VARCHAR(255),                       -- Token do documento na ZapSign
    ip_assinatura       INET,                               -- IP do contratante no momento da assinatura
    user_agent          TEXT,                                -- User-Agent do navegador
    assinado_em         TIMESTAMPTZ,                        -- Timestamp da assinatura
    
    -- Termos aceitos
    versao_termos       VARCHAR(20)         NOT NULL DEFAULT '1.0',
    hash_termos         VARCHAR(64),                        -- SHA-256 do conteúdo dos termos aceitos
    
    -- Alunos vinculados a este contrato (armazena IDs dos students)
    alunos_ids          UUID[]              NOT NULL DEFAULT '{}',
    
    -- Timestamps
    criado_em           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_contracts_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_driver
        FOREIGN KEY (driver_id) REFERENCES drivers_profiles(id)
        ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT ck_contracts_vigencia
        CHECK (vigencia_fim IS NULL OR vigencia_fim > vigencia_inicio),
    CONSTRAINT ck_contracts_assinatura_completa
        CHECK (
            (status != 'ATIVO')
            OR (assinado_em IS NOT NULL AND ip_assinatura IS NOT NULL)
        )
);

-- Índices
CREATE INDEX idx_contracts_responsavel ON contracts (responsavel_id);
CREATE INDEX idx_contracts_driver ON contracts (driver_id);
CREATE INDEX idx_contracts_status ON contracts (status);
CREATE INDEX idx_contracts_assinatura_token ON contracts (assinatura_token) WHERE assinatura_token IS NOT NULL;
CREATE INDEX idx_contracts_criado_em ON contracts (criado_em DESC);

-- Trigger de atualização automática
CREATE TRIGGER trg_contracts_atualizado_em
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Política: Pai vê apenas SEUS contratos
CREATE POLICY contracts_parent_access ON contracts
    FOR ALL
    USING (
        responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

-- Política: Motorista vê apenas contratos DELE
CREATE POLICY contracts_driver_access ON contracts
    FOR SELECT
    USING (
        driver_id IN (
            SELECT dp.id FROM drivers_profiles dp
            WHERE dp.user_id = current_setting('app.current_user_id', TRUE)::UUID
        )
    );

COMMENT ON TABLE contracts IS 'Contratos eletrônicos de transporte escolar com evidências de assinatura digital';
COMMENT ON COLUMN contracts.ip_assinatura IS 'Endereço IP coletado no momento da assinatura — evidência jurídica (MP 2200-2)';
COMMENT ON COLUMN contracts.hash_termos IS 'SHA-256 da versão exata dos termos aceitos — prova de integridade';
COMMENT ON COLUMN contracts.alunos_ids IS 'Array de UUIDs dos alunos vinculados a este contrato';

-- Política (movida da V3 para garantir que 'contracts' e 'drivers_profiles' já existam)
CREATE POLICY students_driver_access ON students
    FOR SELECT
    USING (
        current_setting('app.current_user_role', TRUE) = 'MOTORISTA'
        AND id IN (
            SELECT s.id FROM students s
            INNER JOIN contracts c ON c.responsavel_id = s.responsavel_id
            INNER JOIN drivers_profiles dp ON dp.id = c.driver_id
            WHERE dp.user_id = current_setting('app.current_user_id', TRUE)::UUID
            AND c.status = 'ATIVO'
        )
    );
