-- ============================================================
-- V4: Tabela DRIVERS_PROFILES
-- ============================================================
-- Perfil profissional do motorista escolar.
-- O campo poligono_atuacao_geo armazena a área geográfica de
-- atendimento como um POLYGON PostGIS (SRID 4326 = WGS84).
-- Usado com ST_Contains para verificar cobertura de endereço.
-- ============================================================

CREATE TABLE drivers_profiles (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID            NOT NULL,
    
    -- Dados profissionais (BHTRANS)
    registro_bhtrans        VARCHAR(50)     NOT NULL,       -- Número do registro na BHTRANS
    cnh_categoria           VARCHAR(5)      NOT NULL,       -- Ex: 'D', 'E'
    cnh_validade            DATE            NOT NULL,
    
    -- Veículo
    veiculo_placa           VARCHAR(10),
    veiculo_modelo          VARCHAR(100),
    veiculo_ano             INTEGER,
    veiculo_capacidade      INTEGER         DEFAULT 15,     -- Capacidade de passageiros
    
    -- Área de atuação (Geofencing via PostGIS)
    poligono_atuacao_geo    GEOMETRY(POLYGON, 4326),        -- Polígono da área de atendimento
    
    -- Configurações de negócio
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
    CONSTRAINT uk_drivers_user UNIQUE (user_id),             -- 1 perfil por usuário
    CONSTRAINT uk_drivers_registro_bhtrans UNIQUE (registro_bhtrans),
    CONSTRAINT ck_drivers_cnh_categoria CHECK (cnh_categoria IN ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE')),
    CONSTRAINT ck_drivers_cnh_validade CHECK (cnh_validade > CURRENT_DATE),
    CONSTRAINT ck_drivers_veiculo_ano CHECK (veiculo_ano >= 2010 AND veiculo_ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    CONSTRAINT ck_drivers_capacidade CHECK (veiculo_capacidade > 0 AND veiculo_capacidade <= 50)
);

-- Índice GiST para queries geoespaciais rápidas (ST_Contains, ST_Intersects)
CREATE INDEX idx_drivers_poligono_geo ON drivers_profiles USING GIST (poligono_atuacao_geo);
CREATE INDEX idx_drivers_user_id ON drivers_profiles (user_id);
CREATE INDEX idx_drivers_ativo ON drivers_profiles (ativo) WHERE ativo = TRUE;
CREATE INDEX idx_drivers_aceita_novos ON drivers_profiles (aceita_novos_clientes) WHERE aceita_novos_clientes = TRUE;
CREATE INDEX idx_drivers_registro ON drivers_profiles (registro_bhtrans);

-- Trigger de atualização automática
CREATE TRIGGER trg_drivers_atualizado_em
    BEFORE UPDATE ON drivers_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE drivers_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Motorista edita apenas SEU perfil
CREATE POLICY drivers_self_access ON drivers_profiles
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', TRUE)::UUID
        OR current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );

-- Política: Contratantes podem VER perfis ativos (para busca de motoristas)
CREATE POLICY drivers_public_read ON drivers_profiles
    FOR SELECT
    USING (
        ativo = TRUE
        AND verificado = TRUE
        AND current_setting('app.current_user_role', TRUE) = 'CONTRATANTE'
    );

COMMENT ON TABLE drivers_profiles IS 'Perfil profissional do motorista escolar — inclui área de atuação geográfica';
COMMENT ON COLUMN drivers_profiles.poligono_atuacao_geo IS 'Polígono PostGIS (WGS84/SRID 4326) da área de atendimento — usado com ST_Contains para geofencing';
COMMENT ON COLUMN drivers_profiles.registro_bhtrans IS 'Registro obrigatório na BHTRANS para operar transporte escolar em BH';
