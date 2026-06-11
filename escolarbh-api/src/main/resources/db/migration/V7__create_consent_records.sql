-- ============================================================
-- V7: Tabela CONSENT_RECORDS (LGPD Art. 14 — Consentimentos)
-- ============================================================
-- Registro granular de consentimentos para tratamento de dados
-- de menores de idade. Obrigatório ANTES de qualquer inserção
-- na tabela students.
--
-- Cada tipo de tratamento requer um consentimento específico.
-- O consentimento pode ser revogado, mas a revogação é registrada
-- como novo registro (não deleta o anterior — auditoria).
-- ============================================================

CREATE TYPE consent_type AS ENUM (
    'CADASTRO_DADOS_PESSOAIS',      -- Nome, CPF, data de nascimento
    'CADASTRO_DADOS_SAUDE',          -- Restrições médicas, alergias
    'COMPARTILHAMENTO_MOTORISTA',    -- Compartilhar primeiro nome e ponto de busca com motorista
    'GEOLOCALIZACAO',                -- Armazenar coordenadas do ponto de busca
    'COMUNICACAO_PUSH',              -- Enviar notificações push
    'ARMAZENAMENTO_CONTRATO'         -- Armazenar cópia do contrato assinado
);

CREATE TYPE consent_action AS ENUM (
    'CONCEDIDO',        -- Consentimento dado
    'REVOGADO',         -- Consentimento revogado
    'RENOVADO'          -- Consentimento renovado (ex: atualização anual)
);

CREATE TABLE consent_records (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id          UUID            NOT NULL,
    student_id              UUID,                           -- NULL se consentimento pré-cadastro
    
    -- Tipo e ação
    tipo_consentimento      consent_type    NOT NULL,
    acao                    consent_action  NOT NULL,
    
    -- Finalidade (LGPD Art. 6, I)
    finalidade_tratamento   TEXT            NOT NULL,       -- Descrição da finalidade em linguagem acessível
    
    -- Evidências eletrônicas
    ip_origem               INET            NOT NULL,
    user_agent              TEXT,
    dispositivo             VARCHAR(100),                   -- Ex: "Chrome 120 / Windows 11"
    
    -- Versão dos termos
    versao_politica_privacidade VARCHAR(20) NOT NULL DEFAULT '1.0',
    hash_politica           VARCHAR(64),                    -- SHA-256 da política vigente
    
    -- Validade
    valido_ate              DATE,                           -- NULL = sem expiração
    revogado_em             TIMESTAMPTZ,
    motivo_revogacao        TEXT,
    
    -- Timestamp
    criado_em               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_consent_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_consent_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_consent_responsavel ON consent_records (responsavel_id);
CREATE INDEX idx_consent_student ON consent_records (student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_consent_tipo ON consent_records (tipo_consentimento);
CREATE INDEX idx_consent_acao ON consent_records (acao);
CREATE INDEX idx_consent_criado_em ON consent_records (criado_em DESC);

-- Índice composto para verificar consentimento ativo de um tipo específico
CREATE INDEX idx_consent_ativo ON consent_records (responsavel_id, tipo_consentimento, acao)
    WHERE acao = 'CONCEDIDO';

-- Row-Level Security
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Política: Apenas o responsável e admins podem ver consentimentos
CREATE POLICY consent_self_access ON consent_records
    FOR ALL
    USING (
        responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

COMMENT ON TABLE consent_records IS 'Registros de consentimento LGPD Art. 14 — imutáveis (append-only)';
COMMENT ON COLUMN consent_records.finalidade_tratamento IS 'Descrição em linguagem acessível da finalidade do tratamento de dados';
COMMENT ON COLUMN consent_records.hash_politica IS 'SHA-256 da versão exata da política de privacidade aceita';
