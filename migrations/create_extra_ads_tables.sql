-- Tabela para rastrear anúncios extras pendentes de pagamento
CREATE TABLE IF NOT EXISTS public.extra_ads_pending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_payment_id VARCHAR(255) NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Comentários na tabela
COMMENT ON TABLE public.extra_ads_pending IS 'Anúncios extras pendentes de pagamento';
COMMENT ON COLUMN public.extra_ads_pending.id IS 'ID único do registro';
COMMENT ON COLUMN public.extra_ads_pending.user_id IS 'ID do usuário que comprou o anúncio extra';
COMMENT ON COLUMN public.extra_ads_pending.asaas_payment_id IS 'ID do pagamento no Asaas';
COMMENT ON COLUMN public.extra_ads_pending.transaction_id IS 'ID da transação na tabela transactions';
COMMENT ON COLUMN public.extra_ads_pending.status IS 'Status do anúncio extra pendente (pending, completed, failed)';
COMMENT ON COLUMN public.extra_ads_pending.expires_at IS 'Data de expiração do anúncio extra após ativação';

-- Índices para melhorar a performance de buscas comuns
CREATE INDEX IF NOT EXISTS idx_extra_ads_pending_user_id ON public.extra_ads_pending(user_id);
CREATE INDEX IF NOT EXISTS idx_extra_ads_pending_asaas_payment_id ON public.extra_ads_pending(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_extra_ads_pending_status ON public.extra_ads_pending(status);

-- Tabela para armazenar os créditos de anúncios extras dos usuários
CREATE TABLE IF NOT EXISTS public.extra_ad_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    payment_id VARCHAR(255),
    transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Comentários na tabela
COMMENT ON TABLE public.extra_ad_credits IS 'Créditos de anúncios extras disponíveis para os usuários';
COMMENT ON COLUMN public.extra_ad_credits.id IS 'ID único do registro';
COMMENT ON COLUMN public.extra_ad_credits.user_id IS 'ID do usuário que possui o crédito';
COMMENT ON COLUMN public.extra_ad_credits.quantity IS 'Quantidade de créditos de anúncios extras';
COMMENT ON COLUMN public.extra_ad_credits.status IS 'Status do crédito (active, used, expired)';
COMMENT ON COLUMN public.extra_ad_credits.expires_at IS 'Data de expiração do crédito';
COMMENT ON COLUMN public.extra_ad_credits.payment_id IS 'ID do pagamento que gerou o crédito';
COMMENT ON COLUMN public.extra_ad_credits.transaction_id IS 'ID da transação associada ao crédito';

-- Índices para melhorar a performance de buscas comuns
CREATE INDEX IF NOT EXISTS idx_extra_ad_credits_user_id ON public.extra_ad_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_extra_ad_credits_status ON public.extra_ad_credits(status);
CREATE INDEX IF NOT EXISTS idx_extra_ad_credits_expires_at ON public.extra_ad_credits(expires_at);

-- Política RLS para limitar acesso às tabelas
ALTER TABLE public.extra_ads_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_ad_credits ENABLE ROW LEVEL SECURITY;

-- Política para extra_ads_pending
CREATE POLICY "Usuários podem ver apenas seus próprios registros de anúncios extras pendentes"
    ON public.extra_ads_pending
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Administradores podem ver todos os registros de anúncios extras pendentes"
    ON public.extra_ads_pending
    FOR ALL
    TO service_role
    USING (true);

-- Política para extra_ad_credits
CREATE POLICY "Usuários podem ver apenas seus próprios créditos de anúncios extras"
    ON public.extra_ad_credits
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Administradores podem ver todos os créditos de anúncios extras"
    ON public.extra_ad_credits
    FOR ALL
    TO service_role
    USING (true); 