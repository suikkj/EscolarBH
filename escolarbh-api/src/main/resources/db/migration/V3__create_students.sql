-- ============================================================
-- V3: Tabela STUDENTS (Dados de Menores — LGPD Art. 14)
-- ============================================================
-- ATENÇÃO LGPD: Esta tabela contém dados de crianças/adolescentes.
-- Os campos nome_completo_enc, cpf_enc e restricoes_medicas_enc são
-- criptografados em nível de aplicação (AES-256-GCM) antes de serem
-- inseridos. O sufixo _enc indica campo cifrado.
--
-- O campo cpf é OPCIONAL para menores (nem todos possuem).
-- O consentimento deve existir em consent_records ANTES da inserção.
-- ============================================================

CREATE TABLE students (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id          UUID            NOT NULL,
    
    -- Campos criptografados (AES-256-GCM em nível de aplicação)
    -- Armazenados como TEXT (Base64 do ciphertext + IV + tag)
    nome_completo_enc       TEXT            NOT NULL,
    cpf_enc                 TEXT,                           -- Opcional para menores
    restricoes_medicas_enc  TEXT,                           -- Alergias, medicamentos, etc.
    
    -- Campos NÃO sensíveis (em texto plano para queries)
    primeiro_nome           VARCHAR(100)    NOT NULL,       -- Para exibição ao motorista (minimização)
    data_nascimento         DATE            NOT NULL,
    escola_nome             VARCHAR(255),
    escola_endereco         TEXT,
    
    -- Ponto de busca/entrega (geolocalização)
    ponto_busca_geo         GEOMETRY(POINT, 4326),          -- Coordenadas lat/lng
    ponto_busca_endereco    TEXT,                            -- Endereço em texto
    
    -- LGPD metadata
    consentimento_id        UUID,                            -- FK para consent_records
    dados_anonimizados      BOOLEAN         NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    criado_em               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_students_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES users(id)
        ON DELETE RESTRICT,          -- NUNCA deletar pai que tem alunos cadastrados
    
    -- Constraints
    CONSTRAINT ck_students_data_nascimento
        CHECK (data_nascimento <= CURRENT_DATE),
    CONSTRAINT ck_students_menor_idade
        CHECK (data_nascimento > CURRENT_DATE - INTERVAL '18 years')
);

-- Índices
CREATE INDEX idx_students_responsavel ON students (responsavel_id);
CREATE INDEX idx_students_ponto_busca ON students USING GIST (ponto_busca_geo);
CREATE INDEX idx_students_criado_em ON students (criado_em DESC);
CREATE INDEX idx_students_anonimizados ON students (dados_anonimizados) WHERE dados_anonimizados = FALSE;

-- Trigger de atualização automática
CREATE TRIGGER trg_students_atualizado_em
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Política: Pai vê apenas SEUS dependentes
CREATE POLICY students_parent_access ON students
    FOR ALL
    USING (
        responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );



COMMENT ON TABLE students IS 'Alunos/dependentes — dados sensíveis de menores (LGPD Art. 14)';
COMMENT ON COLUMN students.nome_completo_enc IS 'Nome completo criptografado AES-256-GCM (Base64)';
COMMENT ON COLUMN students.cpf_enc IS 'CPF criptografado AES-256-GCM — opcional para menores';
COMMENT ON COLUMN students.restricoes_medicas_enc IS 'Restrições médicas criptografadas — acessível apenas ao responsável';
COMMENT ON COLUMN students.primeiro_nome IS 'Primeiro nome em texto plano — único dado visível ao motorista (minimização LGPD)';
COMMENT ON COLUMN students.ponto_busca_geo IS 'Coordenadas do ponto de busca — tipo GEOMETRY(POINT, 4326) para queries PostGIS';
