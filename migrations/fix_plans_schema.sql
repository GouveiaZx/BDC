-- ================================
-- MIGRATION: Correção da tabela plans
-- Adiciona coluna plan_type que está faltando
-- ================================

-- Adicionar coluna plan_type se não existir
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'free';

-- Atualizar registros existentes com base no slug/name
UPDATE plans SET plan_type = 'free' WHERE slug = 'free' OR name ILIKE '%free%' OR name ILIKE '%gratuito%';
UPDATE plans SET plan_type = 'micro_business' WHERE slug = 'micro_business' OR name ILIKE '%micro%';
UPDATE plans SET plan_type = 'small_business' WHERE slug = 'small_business' OR name ILIKE '%small%' OR name ILIKE '%pequen%';
UPDATE plans SET plan_type = 'business_simple' WHERE slug = 'business_simple' OR name ILIKE '%business%simple%' OR name ILIKE '%simples%';
UPDATE plans SET plan_type = 'business_plus' WHERE slug = 'business_plus' OR name ILIKE '%business%plus%' OR name ILIKE '%premium%';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_plans_plan_type ON plans(plan_type);

-- Verificar se os registros básicos existem, se não, inserir
INSERT INTO plans (name, slug, plan_type, description, price_monthly, price_yearly, max_ads, max_highlights_per_day, is_active)
VALUES 
    ('Gratuito', 'free', 'free', 'Plano gratuito básico', 0.00, 0.00, 3, 0, true),
    ('Micro Negócio', 'micro_business', 'micro_business', 'Ideal para pequenos anunciantes', 19.90, 199.00, 5, 1, true),
    ('Pequeno Negócio', 'small_business', 'small_business', 'Para pequenas empresas', 39.90, 399.00, 10, 2, true),
    ('Negócio Simples', 'business_simple', 'business_simple', 'Solução completa para negócios', 79.90, 799.00, 20, 5, true),
    ('Negócio Plus', 'business_plus', 'business_plus', 'Plano premium com todos os recursos', 149.90, 1499.00, 50, 10, true)
ON CONFLICT (slug) DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    max_ads = EXCLUDED.max_ads,
    max_highlights_per_day = EXCLUDED.max_highlights_per_day,
    is_active = EXCLUDED.is_active;

-- Garantir que não há registros NULL
UPDATE plans SET plan_type = 'free' WHERE plan_type IS NULL; 