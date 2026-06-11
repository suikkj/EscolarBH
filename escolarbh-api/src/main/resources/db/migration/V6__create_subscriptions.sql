-- ============================================================
-- V6: Tabela SUBSCRIPTIONS (Mensalidades Recorrentes)
-- ============================================================
-- Gerenciada pelo Asaas via webhook.
-- Cada subscription está vinculada a um contrato ativo.
-- O gateway_subscription_id referencia o ID no Asaas.
-- ============================================================

CREATE TYPE payment_status AS ENUM (
    'PENDENTE',         -- Aguardando primeiro pagamento
    'PAGO',             -- Última cobrança paga
    'INADIMPLENTE',     -- Cobrança vencida não paga
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
    
    -- Referência ao gateway (Asaas)
    gateway_subscription_id     VARCHAR(255),       -- ID da subscription no Asaas
    gateway_customer_id         VARCHAR(255),       -- ID do customer no Asaas
    gateway_payment_id          VARCHAR(255),       -- ID do último payment no Asaas
    
    -- Datas
    proximo_vencimento          DATE                NOT NULL,
    ultimo_pagamento_em         TIMESTAMPTZ,
    dia_vencimento              INTEGER             NOT NULL DEFAULT 10,  -- Dia do mês para cobrança
    
    -- Controle de inadimplência
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

-- Índices
CREATE INDEX idx_subscriptions_contract ON subscriptions (contract_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status_pagamento);
CREATE INDEX idx_subscriptions_vencimento ON subscriptions (proximo_vencimento);
CREATE INDEX idx_subscriptions_gateway_sub ON subscriptions (gateway_subscription_id) WHERE gateway_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_gateway_pay ON subscriptions (gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX idx_subscriptions_inadimplente ON subscriptions (status_pagamento) WHERE status_pagamento = 'INADIMPLENTE';

-- Trigger de atualização automática
CREATE TRIGGER trg_subscriptions_atualizado_em
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Row-Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Acesso via contrato (pai ou motorista do contrato)
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

COMMENT ON TABLE subscriptions IS 'Mensalidades recorrentes gerenciadas via Asaas — 1:1 com contratos';
COMMENT ON COLUMN subscriptions.gateway_subscription_id IS 'ID da subscription no Asaas — usado para consultas e cancelamentos';
COMMENT ON COLUMN subscriptions.valor_cobrado IS 'Coluna gerada: valor_mensalidade - desconto';
COMMENT ON COLUMN subscriptions.dia_vencimento IS 'Dia do mês para cobrança (1-28, evita problemas com meses curtos)';
