-- ================================
-- SCHEMA COMPLETO - BDC CLASSIFICADOS
-- Banco de dados PostgreSQL (Supabase)
-- ================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- TABELA: users (usuários)
-- ================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    user_type VARCHAR(50) DEFAULT 'advertiser', -- 'advertiser', 'admin', 'visitor'
    profile_image_url VARCHAR(500),
    bio TEXT,
    city_id UUID REFERENCES cities(id),
    state VARCHAR(2),
    address TEXT,
    zip_code VARCHAR(10),
    website VARCHAR(255),
    
    -- Social Login
    google_id VARCHAR(255),
    apple_id VARCHAR(255),
    facebook_id VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0
);

-- ================================
-- TABELA: cities (cidades)
-- ================================
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: categories (categorias)
-- ================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: plans (planos de assinatura)
-- ================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    
    -- Limites do plano
    max_ads INTEGER DEFAULT 1,
    max_highlights_per_day INTEGER DEFAULT 0,
    ad_duration_days INTEGER DEFAULT 90,
    max_photos_per_ad INTEGER DEFAULT 10,
    has_premium_features BOOLEAN DEFAULT false,
    max_business_categories INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: subscriptions (assinaturas)
-- ================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    
    -- Período da assinatura
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'trialing'
    is_trial BOOLEAN DEFAULT false,
    
    -- Pagamento
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    payment_method VARCHAR(50), -- 'credit_card', 'google_pay', 'apple_pay'
    
    -- Contadores de uso
    ads_used INTEGER DEFAULT 0,
    highlights_used_today INTEGER DEFAULT 0,
    last_highlight_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP
);

-- ================================
-- TABELA: ads (anúncios)
-- ================================
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    city_id UUID NOT NULL REFERENCES cities(id),
    
    -- Conteúdo do anúncio
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    price_type VARCHAR(50) DEFAULT 'fixed', -- 'fixed', 'negotiable', 'free'
    
    -- Contato
    contact_phone VARCHAR(20),
    contact_whatsapp VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Status e moderação
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired', 'paused'
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    
    -- Estatísticas
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    
    -- Datas
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Moderação
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP
);

-- ================================
-- TABELA: ad_photos (fotos dos anúncios)
-- ================================
CREATE TABLE ad_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: highlights (destaques/stories)
-- ================================
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conteúdo
    title VARCHAR(255),
    description TEXT,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image', 'video'
    media_duration INTEGER, -- em segundos para vídeos
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_admin_post BOOLEAN DEFAULT false,
    
    -- Estatísticas
    view_count INTEGER DEFAULT 0,
    
    -- Datas
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: reports (denúncias)
-- ================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    ad_id UUID REFERENCES ads(id),
    highlight_id UUID REFERENCES highlights(id),
    
    -- Detalhes da denúncia
    reason VARCHAR(100) NOT NULL, -- 'spam', 'inappropriate', 'fake', 'offensive', 'other'
    description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    admin_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- ================================
-- TABELA: coupons (cupons de desconto)
-- ================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Desconto
    discount_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed_amount'
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2),
    
    -- Limites
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1,
    
    -- Aplicabilidade
    applicable_to VARCHAR(50) DEFAULT 'all', -- 'all', 'specific_plans'
    plan_ids UUID[],
    
    -- Período de validade
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- ================================
-- TABELA: coupon_usage (uso de cupons)
-- ================================
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: admin_logs (logs administrativos)
-- ================================
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'ad', 'user', 'highlight', 'coupon', etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================
-- TABELA: notifications (notificações)
-- ================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'ad_approved', 'ad_expired', 'subscription', 'system'
    
    -- Dados relacionados
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    
    -- Push notification
    push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- ================================
-- ÍNDICES PARA PERFORMANCE
-- ================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city_id ON users(city_id);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Ads
CREATE INDEX idx_ads_user_id ON ads(user_id);
CREATE INDEX idx_ads_category_id ON ads(category_id);
CREATE INDEX idx_ads_city_id ON ads(city_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_published_at ON ads(published_at);
CREATE INDEX idx_ads_expires_at ON ads(expires_at);
CREATE INDEX idx_ads_is_featured ON ads(is_featured);
CREATE INDEX idx_ads_price ON ads(price);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);

-- Highlights
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
CREATE INDEX idx_highlights_is_active ON highlights(is_active);
CREATE INDEX idx_highlights_expires_at ON highlights(expires_at);
CREATE INDEX idx_highlights_created_at ON highlights(created_at);

-- Ad Photos
CREATE INDEX idx_ad_photos_ad_id ON ad_photos(ad_id);
CREATE INDEX idx_ad_photos_sort_order ON ad_photos(sort_order);

-- Reports
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ================================
-- TRIGGERS PARA UPDATED_AT
-- ================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- RLS (Row Level Security) - Configuração básica
-- ================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (podem ser refinadas depois)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public ads are viewable by everyone" ON ads FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can manage their own ads" ON ads FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id); 