-- ================================
-- DADOS INICIAIS - BDC CLASSIFICADOS
-- ================================

-- ================================
-- CIDADES PRÉ-DEFINIDAS
-- ================================
INSERT INTO cities (name, state) VALUES 
-- Paraná
('Curitiba', 'PR'),
('Londrina', 'PR'),
('Maringá', 'PR'),
('Ponta Grossa', 'PR'),
('Cascavel', 'PR'),
('São José dos Pinhais', 'PR'),
('Foz do Iguaçu', 'PR'),
('Colombo', 'PR'),
('Guarapuava', 'PR'),
('Paranaguá', 'PR'),

-- São Paulo (principais)
('São Paulo', 'SP'),
('Guarulhos', 'SP'),
('Campinas', 'SP'),
('São Bernardo do Campo', 'SP'),
('Santo André', 'SP'),
('Osasco', 'SP'),
('Ribeirão Preto', 'SP'),
('Sorocaba', 'SP'),

-- Rio de Janeiro
('Rio de Janeiro', 'RJ'),
('São Gonçalo', 'RJ'),
('Duque de Caxias', 'RJ'),
('Nova Iguaçu', 'RJ'),
('Niterói', 'RJ'),
('Belford Roxo', 'RJ'),

-- Minas Gerais
('Belo Horizonte', 'MG'),
('Uberlândia', 'MG'),
('Contagem', 'MG'),
('Juiz de Fora', 'MG'),

-- Santa Catarina
('Florianópolis', 'SC'),
('Joinville', 'SC'),
('Blumenau', 'SC'),
('São José', 'SC'),

-- Rio Grande do Sul
('Porto Alegre', 'RS'),
('Caxias do Sul', 'RS'),
('Pelotas', 'RS'),
('Canoas', 'RS');

-- ================================
-- CATEGORIAS DE ANÚNCIOS
-- ================================
INSERT INTO categories (name, slug, icon, description, sort_order) VALUES 
('Veículos', 'veiculos', 'car', 'Carros, motos, caminhões e outros veículos', 1),
('Imóveis', 'imoveis', 'home', 'Casas, apartamentos, terrenos e imóveis comerciais', 2),
('Eletrônicos', 'eletronicos', 'smartphone', 'Celulares, computadores, TVs e eletrônicos', 3),
('Móveis e Decoração', 'moveis-decoracao', 'sofa', 'Móveis para casa, decoração e utensílios', 4),
('Moda e Beleza', 'moda-beleza', 'shirt', 'Roupas, calçados, acessórios e cosméticos', 5),
('Esportes e Lazer', 'esportes-lazer', 'dumbbell', 'Equipamentos esportivos, bicicletas e lazer', 6),
('Animais de Estimação', 'pets', 'paw', 'Cães, gatos e acessórios para pets', 7),
('Bebês e Crianças', 'bebes-criancas', 'baby', 'Produtos infantis, brinquedos e roupas de bebê', 8),
('Serviços', 'servicos', 'tools', 'Prestação de serviços diversos', 9),
('Agro e Indústria', 'agro-industria', 'tractor', 'Máquinas agrícolas, ferramentas industriais', 10),
('Livros e Educação', 'livros-educacao', 'book', 'Livros, cursos e materiais educativos', 11),
('Outros', 'outros', 'more', 'Outros produtos e serviços', 12);

-- ================================
-- PLANOS DE ASSINATURA
-- ================================
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, max_ads, max_highlights_per_day, ad_duration_days, max_photos_per_ad, has_premium_features, max_business_categories, is_featured) VALUES 

-- Plano Gratuito
('Gratuito', 'gratuito', 'Ideal para quem está começando. Publique seu primeiro anúncio gratuitamente.', 0.00, 0.00, 1, 0, 90, 5, false, 0, false),

-- Plano Microempresa
('Microempresa', 'microempresa', 'Para pequenos negócios que precisam de mais visibilidade.', 19.90, 199.00, 2, 0, 90, 8, false, 1, false),

-- Plano Pequena Empresa
('Pequena Empresa', 'pequena-empresa', 'Para empresas em crescimento com necessidade de destaque.', 49.90, 499.00, 5, 1, 90, 10, true, 2, false),

-- Plano Empresa
('Empresa', 'empresa', 'Para empresas estabelecidas que querem máxima visibilidade.', 99.90, 999.00, 10, 2, 90, 10, true, 3, true),

-- Plano Empresa Plus
('Empresa Plus', 'empresa-plus', 'Para grandes empresas com necessidades premium.', 199.90, 1999.00, 20, 3, 90, 10, true, 5, true);

-- ================================
-- USUÁRIO ADMINISTRADOR PADRÃO
-- ================================
INSERT INTO users (id, email, password_hash, name, user_type, is_active, email_verified, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@buscaaquibdc.com.br', crypt('admin123456', gen_salt('bf')), 'Administrador BDC', 'admin', true, true, NOW());

-- ================================
-- CUPONS DE EXEMPLO
-- ================================
INSERT INTO coupons (code, name, description, discount_type, discount_value, usage_limit, valid_until, is_active, created_by) VALUES 
('WELCOME30', 'Bem-vindo BDC', 'Desconto de 30% para novos usuários', 'percentage', 30.00, 100, NOW() + INTERVAL '30 days', true, '550e8400-e29b-41d4-a716-446655440000'),
('FIRST50', 'Primeira Assinatura', '50% de desconto na primeira assinatura', 'percentage', 50.00, 50, NOW() + INTERVAL '60 days', true, '550e8400-e29b-41d4-a716-446655440000'),
('PROMO10', 'Promoção Relâmpago', 'R$ 10 de desconto', 'fixed_amount', 10.00, 200, NOW() + INTERVAL '15 days', true, '550e8400-e29b-41d4-a716-446655440000');

-- ================================
-- INSERIR INDEXES ADICIONAIS (se necessário)
-- ================================

-- Index para busca por texto nos anúncios
CREATE INDEX IF NOT EXISTS idx_ads_title_search ON ads USING gin(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_ads_description_search ON ads USING gin(to_tsvector('portuguese', description));

-- Index composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_ads_category_city_status ON ads(category_id, city_id, status);
CREATE INDEX IF NOT EXISTS idx_ads_status_published ON ads(status, published_at DESC);

-- ================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- ================================

-- View para estatísticas de anúncios por categoria
CREATE OR REPLACE VIEW ads_by_category AS
SELECT 
    c.name as category_name,
    c.slug as category_slug,
    COUNT(a.id) as total_ads,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_ads,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_ads,
    AVG(a.view_count) as avg_views
FROM categories c
LEFT JOIN ads a ON c.id = a.category_id
GROUP BY c.id, c.name, c.slug
ORDER BY total_ads DESC;

-- View para usuários com suas assinaturas ativas
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    p.name as plan_name,
    s.status,
    s.starts_at,
    s.ends_at,
    s.is_trial,
    s.ads_used,
    p.max_ads
FROM users u
JOIN subscriptions s ON u.id = s.user_id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW());

-- View para anúncios que estão prestes a expirar
CREATE OR REPLACE VIEW expiring_ads AS
SELECT 
    a.id,
    a.title,
    a.user_id,
    u.name as user_name,
    u.email as user_email,
    a.expires_at,
    DATE_PART('day', a.expires_at - NOW()) as days_to_expire
FROM ads a
JOIN users u ON a.user_id = u.id
WHERE a.status = 'approved' 
  AND a.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY a.expires_at ASC;

-- ================================
-- FUNÇÕES ÚTEIS
-- ================================

-- Função para limpar anúncios expirados
CREATE OR REPLACE FUNCTION cleanup_expired_ads()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE ads 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'approved' 
      AND expires_at < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar highlights expirados
CREATE OR REPLACE FUNCTION cleanup_expired_highlights()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM highlights 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================

COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE ads IS 'Anúncios publicados pelos usuários';
COMMENT ON TABLE categories IS 'Categorias disponíveis para classificar anúncios';
COMMENT ON TABLE cities IS 'Cidades onde anúncios podem ser publicados';
COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas dos usuários';
COMMENT ON TABLE highlights IS 'Destaques (stories) publicados pelos usuários';
COMMENT ON TABLE reports IS 'Denúncias feitas pelos usuários';
COMMENT ON TABLE coupons IS 'Cupons de desconto para assinaturas';
COMMENT ON TABLE notifications IS 'Notificações para os usuários';

-- ================================
-- CONFIGURAÇÕES ESPECÍFICAS DO SUPABASE
-- ================================

-- Configurar storage para imagens (se usando Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ads-photos', 'ads-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('highlights', 'highlights', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true); 