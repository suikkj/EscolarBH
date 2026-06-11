-- ============================================================
-- V8: Tabela AUDIT_LOG (Trilha de Auditoria)
-- ============================================================
-- Log imutável de todas as operações em dados sensíveis.
-- Usa JSONB para armazenar diffs de dados (before/after).
-- Trigger automático em tabelas sensíveis.
-- ============================================================

CREATE TABLE audit_log (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Quem
    user_id         UUID,                               -- NULL para operações do sistema
    user_role       user_role,
    ip_origem       INET,
    
    -- O que
    tabela          VARCHAR(100)    NOT NULL,            -- Nome da tabela afetada
    operacao        VARCHAR(10)     NOT NULL,            -- INSERT, UPDATE, DELETE
    registro_id     UUID            NOT NULL,            -- ID do registro afetado
    
    -- Dados (diff)
    dados_antes     JSONB,                              -- Snapshot antes da operação (NULL para INSERT)
    dados_depois    JSONB,                              -- Snapshot depois da operação (NULL para DELETE)
    campos_alterados TEXT[],                             -- Lista de campos que mudaram
    
    -- Contexto
    motivo          TEXT,                                -- Motivo da operação (ex: "Atualização de endereço")
    endpoint        VARCHAR(255),                       -- Endpoint da API que originou
    request_id      UUID,                               -- ID de correlação do request
    
    -- Timestamp
    criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Índices para consultas de auditoria
CREATE INDEX idx_audit_user ON audit_log (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_tabela ON audit_log (tabela);
CREATE INDEX idx_audit_registro ON audit_log (registro_id);
CREATE INDEX idx_audit_operacao ON audit_log (operacao);
CREATE INDEX idx_audit_criado_em ON audit_log (criado_em DESC);

-- Índice GIN para busca em JSONB
CREATE INDEX idx_audit_dados_antes ON audit_log USING GIN (dados_antes jsonb_path_ops);
CREATE INDEX idx_audit_dados_depois ON audit_log USING GIN (dados_depois jsonb_path_ops);

-- Particionamento por mês (otimiza queries de auditoria por período)
-- Nota: Em produção, considerar pg_partman para gestão automática

-- ── FUNÇÃO GENÉRICA DE AUDITORIA ──
-- Chamada via trigger em tabelas sensíveis (students, contracts, subscriptions)
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

-- ── TRIGGERS DE AUDITORIA EM TABELAS SENSÍVEIS ──

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

COMMENT ON TABLE audit_log IS 'Trilha de auditoria imutável — todas as operações em dados sensíveis';
COMMENT ON COLUMN audit_log.dados_antes IS 'Snapshot JSONB do registro ANTES da operação';
COMMENT ON COLUMN audit_log.dados_depois IS 'Snapshot JSONB do registro DEPOIS da operação';
COMMENT ON COLUMN audit_log.campos_alterados IS 'Array dos nomes de campos que mudaram (apenas em UPDATE)';
