-- ============================================================
-- V1: ExtensÃµes PostgreSQL necessÃ¡rias
-- ============================================================
-- Executar no Supabase via SQL Editor ou localmente via Flyway.
-- No Supabase, postgis e uuid-ossp geralmente jÃ¡ estÃ£o habilitados.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ComentÃ¡rio de auditoria
COMMENT ON EXTENSION "uuid-ossp" IS 'GeraÃ§Ã£o de UUIDv4 para chaves primÃ¡rias';
COMMENT ON EXTENSION "postgis" IS 'Tipos e funÃ§Ãµes geoespaciais para geofencing';
COMMENT ON EXTENSION "pgcrypto" IS 'FunÃ§Ãµes criptogrÃ¡ficas auxiliares';
-- ============================================================
-- V2: Tabela USERS
-- ============================================================
-- UsuÃ¡rios do sistema: pais (CONTRATANTE), motoristas (MOTORISTA), admins (ADMIN).
-- CPF e email sÃ£o Ãºnicos. Senha armazenada com bcrypt via Spring Security.
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

-- Ãndices para buscas frequentes
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

-- PolÃ­tica: usuÃ¡rio sÃ³ vÃª/edita a si mesmo (exceto ADMIN)
CREATE POLICY users_self_access ON users
    FOR ALL
    USING (
        id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

COMMENT ON TABLE users IS 'UsuÃ¡rios da plataforma EscolarBH';
COMMENT ON COLUMN users.senha_hash IS 'Hash bcrypt da senha â€” nunca armazenar em texto plano';
COMMENT ON COLUMN users.cpf IS 'CPF formatado (000.000.000-00) â€” constraint de formato';
-- ============================================================
-- V3: Tabela STUDENTS (Dados de Menores â€” LGPD Art. 14)
-- ============================================================
-- ATENÃ‡ÃƒO LGPD: Esta tabela contÃ©m dados de crianÃ§as/adolescentes.
-- Os campos nome_completo_enc, cpf_enc e restricoes_medicas_enc sÃ£o
-- criptografados em nÃ­vel de aplicaÃ§Ã£o (AES-256-GCM) antes de serem
-- inseridos. O sufixo _enc indica campo cifrado.
--
-- O campo cpf Ã© OPCIONAL para menores (nem todos possuem).
-- O consentimento deve existir em consent_records ANTES da inserÃ§Ã£o.
-- ============================================================

CREATE TABLE students (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id          UUID            NOT NULL,
    
    -- Campos criptografados (AES-256-GCM em nÃ­vel de aplicaÃ§Ã£o)
    -- Armazenados como TEXT (Base64 do ciphertext + IV + tag)
    nome_completo_enc       TEXT            NOT NULL,
    cpf_enc                 TEXT,                           -- Opcional para menores
    restricoes_medicas_enc  TEXT,                           -- Alergias, medicamentos, etc.
    
    -- Campos NÃƒO sensÃ­veis (em texto plano para queries)
    primeiro_nome           VARCHAR(100)    NOT NULL,       -- Para exibiÃ§Ã£o ao motorista (minimizaÃ§Ã£o)
    data_nascimento         DATE            NOT NULL,
    escola_nome             VARCHAR(255),
    escola_endereco         TEXT,
    
    -- Ponto de busca/entrega (geolocalizaÃ§Ã£o)
    ponto_busca_geo         GEOMETRY(POINT, 4326),          -- Coordenadas lat/lng
    ponto_busca_endereco    TEXT,                            -- EndereÃ§o em texto
    
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

-- Ãndices
CREATE INDEX idx_students_responsavel ON students (responsavel_id);
CREATE INDEX idx_students_ponto_busca ON students USING GIST (ponto_busca_geo);
CREATE INDEX idx_students_criado_em ON students (criado_em DESC);
CREATE INDEX idx_students_anonimizados ON students (dados_anonimizados) WHERE dados_anonimizados = FALSE;

-- Trigger de atualizaÃ§Ã£o automÃ¡tica
CREATE TRIGGER trg_students_atualizado_em
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Pai vÃª apenas SEUS dependentes
CREATE POLICY students_parent_access ON students
    FOR ALL
    USING (
        responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );



COMMENT ON TABLE students IS 'Alunos/dependentes â€” dados sensÃ­veis de menores (LGPD Art. 14)';
COMMENT ON COLUMN students.nome_completo_enc IS 'Nome completo criptografado AES-256-GCM (Base64)';
COMMENT ON COLUMN students.cpf_enc IS 'CPF criptografado AES-256-GCM â€” opcional para menores';
COMMENT ON COLUMN students.restricoes_medicas_enc IS 'RestriÃ§Ãµes mÃ©dicas criptografadas â€” acessÃ­vel apenas ao responsÃ¡vel';
COMMENT ON COLUMN students.primeiro_nome IS 'Primeiro nome em texto plano â€” Ãºnico dado visÃ­vel ao motorista (minimizaÃ§Ã£o LGPD)';
COMMENT ON COLUMN students.ponto_busca_geo IS 'Coordenadas do ponto de busca â€” tipo GEOMETRY(POINT, 4326) para queries PostGIS';
-- ============================================================
-- V4: Tabela DRIVERS_PROFILES
-- ============================================================
-- Perfil profissional do motorista escolar.
-- O campo poligono_atuacao_geo armazena a Ã¡rea geogrÃ¡fica de
-- atendimento como um POLYGON PostGIS (SRID 4326 = WGS84).
-- Usado com ST_Contains para verificar cobertura de endereÃ§o.
-- ============================================================

CREATE TABLE drivers_profiles (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID            NOT NULL,
    
    -- Dados profissionais (BHTRANS)
    registro_bhtrans        VARCHAR(50)     NOT NULL,       -- NÃºmero do registro na BHTRANS
    cnh_categoria           VARCHAR(5)      NOT NULL,       -- Ex: 'D', 'E'
    cnh_validade            DATE            NOT NULL,
    
    -- VeÃ­culo
    veiculo_placa           VARCHAR(10),
    veiculo_modelo          VARCHAR(100),
    veiculo_ano             INTEGER,
    veiculo_capacidade      INTEGER         DEFAULT 15,     -- Capacidade de passageiros
    
    -- Ãrea de atuaÃ§Ã£o (Geofencing via PostGIS)
    poligono_atuacao_geo    GEOMETRY(POLYGON, 4326),        -- PolÃ­gono da Ã¡rea de atendimento
    
    -- ConfiguraÃ§Ãµes de negÃ³cio
    valor_mensalidade_base  DECIMAL(10, 2),                 -- Valor base sugerido
    aceita_novos_clientes   BOOLEAN         NOT NULL DEFAULT TRUE,
    
    -- Status
    ativo                   BOOLEAN         NOT NULL DEFAULT TRUE,
    verificado              BOOLEAN         NOT NULL DEFAULT FALSE,  -- Aprovado pela plataforma
    
    -- Timestamps
    criado_em               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_drivers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT uk_drivers_user UNIQUE (user_id),             -- 1 perfil por usuÃ¡rio
    CONSTRAINT uk_drivers_registro_bhtrans UNIQUE (registro_bhtrans),
    CONSTRAINT ck_drivers_cnh_categoria CHECK (cnh_categoria IN ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE')),
    CONSTRAINT ck_drivers_cnh_validade CHECK (cnh_validade > CURRENT_DATE),
    CONSTRAINT ck_drivers_veiculo_ano CHECK (veiculo_ano >= 2010 AND veiculo_ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    CONSTRAINT ck_drivers_capacidade CHECK (veiculo_capacidade > 0 AND veiculo_capacidade <= 50)
);

-- Ãndice GiST para queries geoespaciais rÃ¡pidas (ST_Contains, ST_Intersects)
CREATE INDEX idx_drivers_poligono_geo ON drivers_profiles USING GIST (poligono_atuacao_geo);
CREATE INDEX idx_drivers_user_id ON drivers_profiles (user_id);
CREATE INDEX idx_drivers_ativo ON drivers_profiles (ativo) WHERE ativo = TRUE;
CREATE INDEX idx_drivers_aceita_novos ON drivers_profiles (aceita_novos_clientes) WHERE aceita_novos_clientes = TRUE;
CREATE INDEX idx_drivers_registro ON drivers_profiles (registro_bhtrans);

-- Trigger de atualizaÃ§Ã£o automÃ¡tica
CREATE TRIGGER trg_drivers_atualizado_em
    BEFORE UPDATE ON drivers_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE drivers_profiles ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Motorista edita apenas SEU perfil
CREATE POLICY drivers_self_access ON drivers_profiles
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

-- PolÃ­tica: Contratantes podem VER perfis ativos (para busca de motoristas)
CREATE POLICY drivers_public_read ON drivers_profiles
    FOR SELECT
    USING (
        ativo = TRUE
        AND verificado = TRUE
        AND current_setting('app.current_user_role', TRUE) = 'CONTRATANTE'
    );

COMMENT ON TABLE drivers_profiles IS 'Perfil profissional do motorista escolar â€” inclui Ã¡rea de atuaÃ§Ã£o geogrÃ¡fica';
COMMENT ON COLUMN drivers_profiles.poligono_atuacao_geo IS 'PolÃ­gono PostGIS (WGS84/SRID 4326) da Ã¡rea de atendimento â€” usado com ST_Contains para geofencing';
COMMENT ON COLUMN drivers_profiles.registro_bhtrans IS 'Registro obrigatÃ³rio na BHTRANS para operar transporte escolar em BH';
-- ============================================================
-- V5: Tabela CONTRACTS
-- ============================================================
-- Contratos eletrÃ´nicos entre pais e motoristas.
-- Inclui evidÃªncias de assinatura digital para validade jurÃ­dica
-- (MP 2200-2): IP, User-Agent, timestamp, token da plataforma de assinatura.
-- ============================================================

CREATE TYPE contract_status AS ENUM (
    'RASCUNHO',         -- Contrato criado, aguardando assinatura
    'AGUARDANDO_ASSINATURA',  -- Enviado para assinatura na ZapSign
    'ATIVO',            -- Assinado e vigente
    'SUSPENSO',         -- Suspenso por inadimplÃªncia
    'ENCERRADO',        -- Encerrado normalmente
    'CANCELADO'         -- Cancelado antes do inÃ­cio
);

CREATE TABLE contracts (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id      UUID                NOT NULL,
    driver_id           UUID                NOT NULL,
    
    -- Status e vigÃªncia
    status              contract_status     NOT NULL DEFAULT 'RASCUNHO',
    vigencia_inicio     DATE,
    vigencia_fim        DATE,
    
    -- Documento e assinatura eletrÃ´nica
    pdf_url             TEXT,                               -- URL no Supabase Storage
    pdf_storage_path    VARCHAR(500),                       -- Path no bucket do Supabase
    
    -- EvidÃªncias de assinatura (validade jurÃ­dica)
    assinatura_token    VARCHAR(255),                       -- Token do documento na ZapSign
    ip_assinatura       INET,                               -- IP do contratante no momento da assinatura
    user_agent          TEXT,                                -- User-Agent do navegador
    assinado_em         TIMESTAMPTZ,                        -- Timestamp da assinatura
    
    -- Termos aceitos
    versao_termos       VARCHAR(20)         NOT NULL DEFAULT '1.0',
    hash_termos         VARCHAR(64),                        -- SHA-256 do conteÃºdo dos termos aceitos
    
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

-- Ãndices
CREATE INDEX idx_contracts_responsavel ON contracts (responsavel_id);
CREATE INDEX idx_contracts_driver ON contracts (driver_id);
CREATE INDEX idx_contracts_status ON contracts (status);
CREATE INDEX idx_contracts_assinatura_token ON contracts (assinatura_token) WHERE assinatura_token IS NOT NULL;
CREATE INDEX idx_contracts_criado_em ON contracts (criado_em DESC);

-- Trigger de atualizaÃ§Ã£o automÃ¡tica
CREATE TRIGGER trg_contracts_atualizado_em
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Pai vÃª apenas SEUS contratos
CREATE POLICY contracts_parent_access ON contracts
    FOR ALL
    USING (
        responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

-- PolÃ­tica: Motorista vÃª apenas contratos DELE
CREATE POLICY contracts_driver_access ON contracts
    FOR SELECT
    USING (
        driver_id IN (
            SELECT dp.id FROM drivers_profiles dp
            WHERE dp.user_id = current_setting('app.current_user_id', TRUE)::UUID
        )
    );

COMMENT ON TABLE contracts IS 'Contratos eletrÃ´nicos de transporte escolar com evidÃªncias de assinatura digital';
COMMENT ON COLUMN contracts.ip_assinatura IS 'EndereÃ§o IP coletado no momento da assinatura â€” evidÃªncia jurÃ­dica (MP 2200-2)';
COMMENT ON COLUMN contracts.hash_termos IS 'SHA-256 da versÃ£o exata dos termos aceitos â€” prova de integridade';
COMMENT ON COLUMN contracts.alunos_ids IS 'Array de UUIDs dos alunos vinculados a este contrato';

-- PolÃ­tica (movida da V3 para garantir que 'contracts' e 'drivers_profiles' jÃ¡ existam)
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
-- ============================================================
-- V6: Tabela SUBSCRIPTIONS (Mensalidades Recorrentes)
-- ============================================================
-- Gerenciada pelo Asaas via webhook.
-- Cada subscription estÃ¡ vinculada a um contrato ativo.
-- O gateway_subscription_id referencia o ID no Asaas.
-- ============================================================

CREATE TYPE payment_status AS ENUM (
    'PENDENTE',         -- Aguardando primeiro pagamento
    'PAGO',             -- Ãšltima cobranÃ§a paga
    'INADIMPLENTE',     -- CobranÃ§a vencida nÃ£o paga
    'CANCELADO',        -- Assinatura cancelada
    'SUSPENSO'          -- Assinatura suspensa temporariamente
);

CREATE TYPE payment_method AS ENUM (
    'BOLETO',
    'PIX',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO'
);

CREATE TABLE subscriptions (
    id                          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id                 UUID                NOT NULL,
    
    -- Valores
    valor_mensalidade           DECIMAL(10, 2)      NOT NULL,
    desconto                    DECIMAL(10, 2)      DEFAULT 0.00,
    valor_cobrado               DECIMAL(10, 2)      GENERATED ALWAYS AS (valor_mensalidade - desconto) STORED,
    
    -- Status e controle
    status_pagamento            payment_status      NOT NULL DEFAULT 'PENDENTE',
    metodo_pagamento            payment_method,
    
    -- ReferÃªncia ao gateway (Asaas)
    gateway_subscription_id     VARCHAR(255),       -- ID da subscription no Asaas
    gateway_customer_id         VARCHAR(255),       -- ID do customer no Asaas
    gateway_payment_id          VARCHAR(255),       -- ID do Ãºltimo payment no Asaas
    
    -- Datas
    proximo_vencimento          DATE                NOT NULL,
    ultimo_pagamento_em         TIMESTAMPTZ,
    dia_vencimento              INTEGER             NOT NULL DEFAULT 10,  -- Dia do mÃªs para cobranÃ§a
    
    -- Controle de inadimplÃªncia
    dias_inadimplente           INTEGER             DEFAULT 0,
    tentativas_cobranca         INTEGER             DEFAULT 0,
    
    -- Timestamps
    criado_em                   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    atualizado_em               TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_subscriptions_contract
        FOREIGN KEY (contract_id) REFERENCES contracts(id)
        ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT uk_subscriptions_contract UNIQUE (contract_id),  -- 1 subscription por contrato
    CONSTRAINT ck_subscriptions_valor CHECK (valor_mensalidade > 0),
    CONSTRAINT ck_subscriptions_desconto CHECK (desconto >= 0 AND desconto < valor_mensalidade),
    CONSTRAINT ck_subscriptions_dia_vencimento CHECK (dia_vencimento >= 1 AND dia_vencimento <= 28)
);

-- Ãndices
CREATE INDEX idx_subscriptions_contract ON subscriptions (contract_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status_pagamento);
CREATE INDEX idx_subscriptions_vencimento ON subscriptions (proximo_vencimento);
CREATE INDEX idx_subscriptions_gateway_sub ON subscriptions (gateway_subscription_id) WHERE gateway_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_gateway_pay ON subscriptions (gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX idx_subscriptions_inadimplente ON subscriptions (status_pagamento) WHERE status_pagamento = 'INADIMPLENTE';

-- Trigger de atualizaÃ§Ã£o automÃ¡tica
CREATE TRIGGER trg_subscriptions_atualizado_em
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Acesso via contrato (pai ou motorista do contrato)
CREATE POLICY subscriptions_access ON subscriptions
    FOR ALL
    USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            WHERE c.responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        )
        OR contract_id IN (
            SELECT c.id FROM contracts c
            INNER JOIN drivers_profiles dp ON dp.id = c.driver_id
            WHERE dp.user_id = current_setting('app.current_user_id', TRUE)::UUID
        )
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

COMMENT ON TABLE subscriptions IS 'Mensalidades recorrentes gerenciadas via Asaas â€” 1:1 com contratos';
COMMENT ON COLUMN subscriptions.gateway_subscription_id IS 'ID da subscription no Asaas â€” usado para consultas e cancelamentos';
COMMENT ON COLUMN subscriptions.valor_cobrado IS 'Coluna gerada: valor_mensalidade - desconto';
COMMENT ON COLUMN subscriptions.dia_vencimento IS 'Dia do mÃªs para cobranÃ§a (1-28, evita problemas com meses curtos)';
-- ============================================================
-- V7: Tabela CONSENT_RECORDS (LGPD Art. 14 â€” Consentimentos)
-- ============================================================
-- Registro granular de consentimentos para tratamento de dados
-- de menores de idade. ObrigatÃ³rio ANTES de qualquer inserÃ§Ã£o
-- na tabela students.
--
-- Cada tipo de tratamento requer um consentimento especÃ­fico.
-- O consentimento pode ser revogado, mas a revogaÃ§Ã£o Ã© registrada
-- como novo registro (nÃ£o deleta o anterior â€” auditoria).
-- ============================================================

CREATE TYPE consent_type AS ENUM (
    'CADASTRO_DADOS_PESSOAIS',      -- Nome, CPF, data de nascimento
    'CADASTRO_DADOS_SAUDE',          -- RestriÃ§Ãµes mÃ©dicas, alergias
    'COMPARTILHAMENTO_MOTORISTA',    -- Compartilhar primeiro nome e ponto de busca com motorista
    'GEOLOCALIZACAO',                -- Armazenar coordenadas do ponto de busca
    'COMUNICACAO_PUSH',              -- Enviar notificaÃ§Ãµes push
    'ARMAZENAMENTO_CONTRATO'         -- Armazenar cÃ³pia do contrato assinado
);

CREATE TYPE consent_action AS ENUM (
    'CONCEDIDO',        -- Consentimento dado
    'REVOGADO',         -- Consentimento revogado
    'RENOVADO'          -- Consentimento renovado (ex: atualizaÃ§Ã£o anual)
);

CREATE TABLE consent_records (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id          UUID            NOT NULL,
    student_id              UUID,                           -- NULL se consentimento prÃ©-cadastro
    
    -- Tipo e aÃ§Ã£o
    tipo_consentimento      consent_type    NOT NULL,
    acao                    consent_action  NOT NULL,
    
    -- Finalidade (LGPD Art. 6, I)
    finalidade_tratamento   TEXT            NOT NULL,       -- DescriÃ§Ã£o da finalidade em linguagem acessÃ­vel
    
    -- EvidÃªncias eletrÃ´nicas
    ip_origem               INET            NOT NULL,
    user_agent              TEXT,
    dispositivo             VARCHAR(100),                   -- Ex: "Chrome 120 / Windows 11"
    
    -- VersÃ£o dos termos
    versao_politica_privacidade VARCHAR(20) NOT NULL DEFAULT '1.0',
    hash_politica           VARCHAR(64),                    -- SHA-256 da polÃ­tica vigente
    
    -- Validade
    valido_ate              DATE,                           -- NULL = sem expiraÃ§Ã£o
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

-- Ãndices
CREATE INDEX idx_consent_responsavel ON consent_records (responsavel_id);
CREATE INDEX idx_consent_student ON consent_records (student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_consent_tipo ON consent_records (tipo_consentimento);
CREATE INDEX idx_consent_acao ON consent_records (acao);
CREATE INDEX idx_consent_criado_em ON consent_records (criado_em DESC);

-- Ãndice composto para verificar consentimento ativo de um tipo especÃ­fico
CREATE INDEX idx_consent_ativo ON consent_records (responsavel_id, tipo_consentimento, acao)
    WHERE acao = 'CONCEDIDO';

-- Row-Level Security
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Apenas o responsÃ¡vel e admins podem ver consentimentos
CREATE POLICY consent_self_access ON consent_records
    FOR ALL
    USING (
        responsavel_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

COMMENT ON TABLE consent_records IS 'Registros de consentimento LGPD Art. 14 â€” imutÃ¡veis (append-only)';
COMMENT ON COLUMN consent_records.finalidade_tratamento IS 'DescriÃ§Ã£o em linguagem acessÃ­vel da finalidade do tratamento de dados';
COMMENT ON COLUMN consent_records.hash_politica IS 'SHA-256 da versÃ£o exata da polÃ­tica de privacidade aceita';
-- ============================================================
-- V8: Tabela AUDIT_LOG (Trilha de Auditoria)
-- ============================================================
-- Log imutÃ¡vel de todas as operaÃ§Ãµes em dados sensÃ­veis.
-- Usa JSONB para armazenar diffs de dados (before/after).
-- Trigger automÃ¡tico em tabelas sensÃ­veis.
-- ============================================================

CREATE TABLE audit_log (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Quem
    user_id         UUID,                               -- NULL para operaÃ§Ãµes do sistema
    user_role       user_role,
    ip_origem       INET,
    
    -- O que
    tabela          VARCHAR(100)    NOT NULL,            -- Nome da tabela afetada
    operacao        VARCHAR(10)     NOT NULL,            -- INSERT, UPDATE, DELETE
    registro_id     UUID            NOT NULL,            -- ID do registro afetado
    
    -- Dados (diff)
    dados_antes     JSONB,                              -- Snapshot antes da operaÃ§Ã£o (NULL para INSERT)
    dados_depois    JSONB,                              -- Snapshot depois da operaÃ§Ã£o (NULL para DELETE)
    campos_alterados TEXT[],                             -- Lista de campos que mudaram
    
    -- Contexto
    motivo          TEXT,                                -- Motivo da operaÃ§Ã£o (ex: "AtualizaÃ§Ã£o de endereÃ§o")
    endpoint        VARCHAR(255),                       -- Endpoint da API que originou
    request_id      UUID,                               -- ID de correlaÃ§Ã£o do request
    
    -- Timestamp
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Ãndices para consultas de auditoria
CREATE INDEX idx_audit_user ON audit_log (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_tabela ON audit_log (tabela);
CREATE INDEX idx_audit_registro ON audit_log (registro_id);
CREATE INDEX idx_audit_operacao ON audit_log (operacao);
CREATE INDEX idx_audit_criado_em ON audit_log (criado_em DESC);

-- Ãndice GIN para busca em JSONB
CREATE INDEX idx_audit_dados_antes ON audit_log USING GIN (dados_antes jsonb_path_ops);
CREATE INDEX idx_audit_dados_depois ON audit_log USING GIN (dados_depois jsonb_path_ops);

-- Particionamento por mÃªs (otimiza queries de auditoria por perÃ­odo)
-- Nota: Em produÃ§Ã£o, considerar pg_partman para gestÃ£o automÃ¡tica

-- â”€â”€ FUNÃ‡ÃƒO GENÃ‰RICA DE AUDITORIA â”€â”€
-- Chamada via trigger em tabelas sensÃ­veis (students, contracts, subscriptions)
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    _dados_antes JSONB;
    _dados_depois JSONB;
    _campos TEXT[];
    _user_id UUID;
    _user_role user_role;
BEGIN
    -- Captura contexto do request (setado pelo Spring Boot via SET LOCAL)
    _user_id := current_setting('app.current_user_id', TRUE)::UUID;
    _user_role := current_setting('app.current_user_role', TRUE)::user_role;

    IF TG_OP = 'INSERT' THEN
        _dados_antes := NULL;
        _dados_depois := to_jsonb(NEW);
        _campos := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        _dados_antes := to_jsonb(OLD);
        _dados_depois := to_jsonb(NEW);
        -- Identifica campos que mudaram
        SELECT array_agg(key) INTO _campos
        FROM jsonb_each(_dados_depois) 
        WHERE _dados_antes->key IS DISTINCT FROM _dados_depois->key;
    ELSIF TG_OP = 'DELETE' THEN
        _dados_antes := to_jsonb(OLD);
        _dados_depois := NULL;
        _campos := NULL;
    END IF;

    INSERT INTO audit_log (
        user_id, user_role, tabela, operacao, registro_id,
        dados_antes, dados_depois, campos_alterados
    ) VALUES (
        _user_id, _user_role, TG_TABLE_NAME, TG_OP,
        COALESCE(NEW.id, OLD.id),
        _dados_antes, _dados_depois, _campos
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- â”€â”€ TRIGGERS DE AUDITORIA EM TABELAS SENSÃVEIS â”€â”€

CREATE TRIGGER trg_audit_students
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_contracts
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_subscriptions
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_consent_records
    AFTER INSERT ON consent_records
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- Row-Level Security (apenas admins podem ler audit_log)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_admin_only ON audit_log
    FOR ALL
    USING (current_setting('app.current_user_role', TRUE) = 'ADMIN');

COMMENT ON TABLE audit_log IS 'Trilha de auditoria imutÃ¡vel â€” todas as operaÃ§Ãµes em dados sensÃ­veis';
COMMENT ON COLUMN audit_log.dados_antes IS 'Snapshot JSONB do registro ANTES da operaÃ§Ã£o';
COMMENT ON COLUMN audit_log.dados_depois IS 'Snapshot JSONB do registro DEPOIS da operaÃ§Ã£o';
COMMENT ON COLUMN audit_log.campos_alterados IS 'Array dos nomes de campos que mudaram (apenas em UPDATE)';
-- V9__create_presence_records.sql

CREATE TABLE presence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    status VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8)
);

-- Habilitar RLS
ALTER TABLE presence_records ENABLE ROW LEVEL SECURITY;

-- Pai sÃ³ vÃª registros de seus filhos (via join com student)
CREATE POLICY "Pai pode visualizar presenca de seus dependentes"
ON presence_records FOR SELECT
USING (
    student_id IN (
        SELECT id FROM students WHERE responsavel_id = auth.uid()
    )
);

-- Motorista pode visualizar registros que ele mesmo criou
CREATE POLICY "Motorista pode visualizar seus registros"
ON presence_records FOR SELECT
USING (driver_id = auth.uid());

-- Motorista pode inserir registros para si
CREATE POLICY "Motorista pode inserir registros"
ON presence_records FOR INSERT
WITH CHECK (driver_id = auth.uid());
