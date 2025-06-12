-- =====================================================
-- MIGRAÇÃO 016: SISTEMA DE PAGAMENTOS E ASSINATURAS
-- =====================================================
-- Data: Dezembro 2024
-- Objetivo: Criar estrutura completa para pagamentos via Asaas

-- 1. Tabela de clientes Asaas
CREATE TABLE IF NOT EXISTS asaas_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_customer_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    postal_code VARCHAR(10),
    address TEXT,
    address_number VARCHAR(10),
    complement VARCHAR(255),
    province VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_subscription_id VARCHAR(255) UNIQUE,
    asaas_customer_id VARCHAR(255) NOT NULL,
    plan_type subscription_plan_type NOT NULL DEFAULT 'FREE',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED, OVERDUE, SUSPENDED, CANCELLED
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
    next_due_date DATE,
    description TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT unique_user_active_subscription UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- 3. Tabela de transações/cobranças
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    asaas_payment_id VARCHAR(255) UNIQUE,
    asaas_customer_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- SUBSCRIPTION, HIGHLIGHT, UPGRADE, DOWNGRADE
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
    amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2),
    billing_type VARCHAR(20) NOT NULL, -- BOLETO, CREDIT_CARD, PIX
    due_date DATE NOT NULL,
    paid_date TIMESTAMPTZ,
    description TEXT,
    external_reference VARCHAR(255),
    invoice_url TEXT,
    bank_slip_url TEXT,
    transaction_receipt_url TEXT,
    pix_qr_code TEXT,
    pix_payload TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de histórico de mudanças de plano
CREATE TABLE IF NOT EXISTS subscription_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    from_plan subscription_plan_type,
    to_plan subscription_plan_type NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- UPGRADE, DOWNGRADE, CANCEL, REACTIVATE
    effective_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de webhooks do Asaas
CREATE TABLE IF NOT EXISTS asaas_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    asaas_payment_id VARCHAR(255),
    asaas_subscription_id VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_asaas_customers_user_id ON asaas_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customers_asaas_id ON asaas_customers(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_id ON subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asaas_id ON transactions(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON asaas_webhooks(event_type);

-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_asaas_customers_updated_at ON asaas_customers;
CREATE TRIGGER update_asaas_customers_updated_at
    BEFORE UPDATE ON asaas_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Políticas RLS
ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas para asaas_customers
DROP POLICY IF EXISTS "Usuários podem ver seus próprios clientes Asaas" ON asaas_customers;
CREATE POLICY "Usuários podem ver seus próprios clientes Asaas" ON asaas_customers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios clientes Asaas" ON asaas_customers;
CREATE POLICY "Usuários podem inserir seus próprios clientes Asaas" ON asaas_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios clientes Asaas" ON asaas_customers;
CREATE POLICY "Usuários podem atualizar seus próprios clientes Asaas" ON asaas_customers
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para subscriptions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias assinaturas" ON subscriptions;
CREATE POLICY "Usuários podem inserir suas próprias assinaturas" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON subscriptions;
CREATE POLICY "Usuários podem atualizar suas próprias assinaturas" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para transactions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON transactions;
CREATE POLICY "Usuários podem ver suas próprias transações" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias transações" ON transactions;
CREATE POLICY "Usuários podem inserir suas próprias transações" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias transações" ON transactions;
CREATE POLICY "Usuários podem atualizar suas próprias transações" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para subscription_changes
DROP POLICY IF EXISTS "Usuários podem ver seu histórico de mudanças" ON subscription_changes;
CREATE POLICY "Usuários podem ver seu histórico de mudanças" ON subscription_changes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir mudanças de plano" ON subscription_changes;
CREATE POLICY "Usuários podem inserir mudanças de plano" ON subscription_changes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para webhooks (apenas service role)
DROP POLICY IF EXISTS "Service role pode gerenciar webhooks" ON asaas_webhooks;
CREATE POLICY "Service role pode gerenciar webhooks" ON asaas_webhooks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. Funções úteis
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    plan_type subscription_plan_type,
    status VARCHAR,
    value DECIMAL,
    cycle VARCHAR,
    next_due_date DATE,
    expires_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_type,
        s.status,
        s.value,
        s.cycle,
        s.next_due_date,
        s.expires_at
    FROM subscriptions s
    WHERE s.user_id = p_user_id 
      AND s.status IN ('ACTIVE', 'OVERDUE')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_payment_history(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    type VARCHAR,
    status VARCHAR,
    amount DECIMAL,
    billing_type VARCHAR,
    due_date DATE,
    paid_date TIMESTAMPTZ,
    description TEXT,
    invoice_url TEXT,
    bank_slip_url TEXT,
    created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.type,
        t.status,
        t.amount,
        t.billing_type,
        t.due_date,
        t.paid_date,
        t.description,
        t.invoice_url,
        t.bank_slip_url,
        t.created_at
    FROM transactions t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 10. View para dados consolidados de assinatura
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    p.phone,
    s.id as subscription_id,
    s.plan_type,
    s.status as subscription_status,
    s.value as subscription_value,
    s.cycle,
    s.next_due_date,
    s.expires_at,
    ac.asaas_customer_id,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.status = 'CONFIRMED' THEN t.amount ELSE 0 END) as total_paid
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('ACTIVE', 'OVERDUE')
LEFT JOIN asaas_customers ac ON u.id = ac.user_id
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.email, p.full_name, p.phone, s.id, s.plan_type, s.status, s.value, s.cycle, s.next_due_date, s.expires_at, ac.asaas_customer_id;

-- 11. Comentários
COMMENT ON TABLE asaas_customers IS 'Clientes sincronizados com o Asaas';
COMMENT ON TABLE subscriptions IS 'Assinaturas de planos dos usuários';
COMMENT ON TABLE transactions IS 'Histórico de todas as transações e cobranças';
COMMENT ON TABLE subscription_changes IS 'Histórico de mudanças de planos';
COMMENT ON TABLE asaas_webhooks IS 'Log de webhooks recebidos do Asaas';

-- Inserir assinatura gratuita para usuários existentes que não possuem
INSERT INTO subscriptions (user_id, plan_type, status, value, cycle, description, expires_at)
SELECT 
    u.id,
    'FREE',
    'ACTIVE',
    0.00,
    'MONTHLY',
    'Plano Gratuito - Migração automática',
    '2099-12-31'::date
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT DO NOTHING;

COMMIT; 