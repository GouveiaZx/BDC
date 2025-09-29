-- ================================
-- RPC FUNCTIONS FOR DASHBOARD STATS
-- Required functions for /api/dashboard/stats endpoint
-- ================================

-- Enable necessary extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ad_views_log table if it doesn't exist
-- (Some older migrations may not have created this)
CREATE TABLE IF NOT EXISTS ad_views_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    viewed_at TIMESTAMP DEFAULT NOW(),
    is_unique_view BOOLEAN DEFAULT false
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ad_views_log_ad_id ON ad_views_log(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_log_viewed_at ON ad_views_log(viewed_at);
CREATE INDEX IF NOT EXISTS idx_ad_views_log_user_id ON ad_views_log(user_id);

-- ================================
-- FUNCTION 1: get_real_ad_counts
-- Returns count of ads by status for a specific user
-- ================================
CREATE OR REPLACE FUNCTION get_real_ad_counts(target_user_id UUID)
RETURNS TABLE(
    active_count INTEGER,
    pending_count INTEGER,
    rejected_count INTEGER,
    finished_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- Allows function to bypass RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN status = 'approved' OR status = 'active' THEN 1 END)::INTEGER AS active_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER AS pending_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::INTEGER AS rejected_count,
        COUNT(CASE WHEN status = 'expired' OR status = 'finished' OR status = 'paused' THEN 1 END)::INTEGER AS finished_count
    FROM ads 
    WHERE user_id = target_user_id;
END;
$$;

-- ================================
-- FUNCTION 2: generate_user_notifications
-- Generates smart notifications based on user's ads and activity
-- ================================
CREATE OR REPLACE FUNCTION generate_user_notifications(target_user_id UUID)
RETURNS TABLE(
    notification_id TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_name TEXT;
    pending_count INTEGER := 0;
    active_count INTEGER := 0;
    expired_count INTEGER := 0;
    expiring_soon_count INTEGER := 0;
BEGIN
    -- Get user name for personalization
    SELECT name INTO user_name FROM users WHERE id = target_user_id LIMIT 1;
    IF user_name IS NULL THEN
        user_name := 'Usuário';
    END IF;
    
    -- Get ad counts for notifications
    SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END),
        COUNT(CASE WHEN status = 'approved' OR status = 'active' THEN 1 END),
        COUNT(CASE WHEN status = 'expired' THEN 1 END),
        COUNT(CASE WHEN expires_at <= NOW() + INTERVAL '7 days' AND status IN ('approved', 'active') THEN 1 END)
    INTO pending_count, active_count, expired_count, expiring_soon_count
    FROM ads 
    WHERE user_id = target_user_id;
    
    -- Generate smart notifications based on user's situation
    
    -- Welcome notification for new users (no ads yet)
    IF pending_count = 0 AND active_count = 0 AND expired_count = 0 THEN
        RETURN QUERY SELECT 
            'welcome-' || target_user_id::TEXT,
            'Bem-vindo ao BDC Classificados!',
            'Olá ' || user_name || '! Crie seu primeiro anúncio gratuito e comece a vender hoje mesmo.',
            'tip',
            NOW();
    END IF;
    
    -- Pending ads notification
    IF pending_count > 0 THEN
        RETURN QUERY SELECT 
            'pending-' || target_user_id::TEXT,
            'Anúncios em análise',
            CASE 
                WHEN pending_count = 1 THEN 'Você tem 1 anúncio aguardando aprovação.'
                ELSE 'Você tem ' || pending_count::TEXT || ' anúncios aguardando aprovação.'
            END,
            'alert',
            NOW();
    END IF;
    
    -- Active ads notification
    IF active_count > 0 THEN
        RETURN QUERY SELECT 
            'active-' || target_user_id::TEXT,
            'Anúncios ativos',
            CASE 
                WHEN active_count = 1 THEN 'Você tem 1 anúncio ativo recebendo visualizações.'
                ELSE 'Você tem ' || active_count::TEXT || ' anúncios ativos recebendo visualizações.'
            END,
            'approval',
            NOW();
    END IF;
    
    -- Expiring soon notification
    IF expiring_soon_count > 0 THEN
        RETURN QUERY SELECT 
            'expiring-' || target_user_id::TEXT,
            'Anúncios expirando em breve',
            CASE 
                WHEN expiring_soon_count = 1 THEN '1 anúncio expira nos próximos 7 dias. Considere renovar!'
                ELSE expiring_soon_count::TEXT || ' anúncios expiram nos próximos 7 dias. Considere renovar!'
            END,
            'alert',
            NOW();
    END IF;
    
    -- Tips for users with active ads
    IF active_count > 0 THEN
        RETURN QUERY SELECT 
            'tip-photos-' || target_user_id::TEXT,
            'Dica: Melhore suas fotos',
            'Anúncios com fotos de qualidade recebem 3x mais visualizações! Adicione mais imagens aos seus anúncios.',
            'tip',
            NOW();
    END IF;
    
    -- Upgrade suggestion for users with multiple ads
    IF active_count >= 1 AND pending_count = 0 THEN
        RETURN QUERY SELECT 
            'upgrade-' || target_user_id::TEXT,
            'Potencialize seus resultados',
            'Com um plano premium, você pode ter mais anúncios simultâneos e destaques diários. Conheça nossos planos!',
            'subscription',
            NOW();
    END IF;
    
    -- If no specific notifications, return a general tip
    IF pending_count = 0 AND active_count = 0 AND expired_count > 0 THEN
        RETURN QUERY SELECT 
            'general-tip-' || target_user_id::TEXT,
            'Hora de criar um novo anúncio',
            'Seus anúncios anteriores expiraram. Que tal criar um novo anúncio e voltar a vender?',
            'tip',
            NOW();
    END IF;
    
    RETURN;
END;
$$;

-- ================================
-- FUNCTION 3: get_ad_views_data
-- Returns view statistics for a user's ads
-- ================================
CREATE OR REPLACE FUNCTION get_ad_views_data(target_user_id UUID)
RETURNS TABLE(
    total_views BIGINT,
    views_7d BIGINT,
    views_30d BIGINT,
    unique_views_7d BIGINT,
    unique_views_30d BIGINT,
    most_viewed_ad_id UUID,
    most_viewed_ad_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_ads AS (
        SELECT id, title, view_count 
        FROM ads 
        WHERE user_id = target_user_id
    ),
    view_stats AS (
        SELECT 
            -- Total views from ads table (more reliable)
            COALESCE(SUM(ua.view_count), 0) AS total_views_from_ads,
            
            -- Views from log table if exists
            COALESCE(COUNT(avl.id), 0) AS total_views_from_log,
            
            -- Last 7 days (from log if available, otherwise estimate)
            COALESCE(COUNT(CASE WHEN avl.viewed_at >= NOW() - INTERVAL '7 days' THEN 1 END), 
                     GREATEST(0, SUM(ua.view_count)::BIGINT / 10)) AS views_last_7d,
            
            -- Last 30 days (from log if available, otherwise estimate)  
            COALESCE(COUNT(CASE WHEN avl.viewed_at >= NOW() - INTERVAL '30 days' THEN 1 END),
                     GREATEST(0, SUM(ua.view_count)::BIGINT / 3)) AS views_last_30d,
            
            -- Unique views (best effort)
            COALESCE(COUNT(DISTINCT CASE WHEN avl.viewed_at >= NOW() - INTERVAL '7 days' AND avl.is_unique_view THEN avl.id END), 0) AS unique_7d,
            COALESCE(COUNT(DISTINCT CASE WHEN avl.viewed_at >= NOW() - INTERVAL '30 days' AND avl.is_unique_view THEN avl.id END), 0) AS unique_30d
            
        FROM user_ads ua
        LEFT JOIN ad_views_log avl ON ua.id = avl.ad_id
    ),
    most_viewed AS (
        SELECT id, title, view_count
        FROM user_ads
        ORDER BY view_count DESC
        LIMIT 1
    )
    SELECT 
        vs.total_views_from_ads AS total_views,
        vs.views_last_7d AS views_7d,
        vs.views_last_30d AS views_30d,
        vs.unique_7d AS unique_views_7d,
        vs.unique_30d AS unique_views_30d,
        mv.id AS most_viewed_ad_id,
        mv.title AS most_viewed_ad_title
    FROM view_stats vs
    CROSS JOIN (
        SELECT 
            COALESCE(id, uuid_generate_v4()) AS id, 
            COALESCE(title, 'Nenhum anúncio') AS title
        FROM most_viewed
        UNION ALL
        SELECT uuid_generate_v4(), 'Nenhum anúncio'
        LIMIT 1
    ) mv
    LIMIT 1;
END;
$$;

-- ================================
-- GRANT PERMISSIONS
-- ================================
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_real_ad_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_user_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ad_views_data(UUID) TO authenticated;

-- Grant permissions to anon users as well (for public dashboards)
GRANT EXECUTE ON FUNCTION get_real_ad_counts(UUID) TO anon;
GRANT EXECUTE ON FUNCTION generate_user_notifications(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_ad_views_data(UUID) TO anon;

-- ================================
-- COMMENTS FOR DOCUMENTATION
-- ================================
COMMENT ON FUNCTION get_real_ad_counts(UUID) IS 'Returns count of ads by status (active, pending, rejected, finished) for a specific user';
COMMENT ON FUNCTION generate_user_notifications(UUID) IS 'Generates smart contextual notifications based on user activity and ad status';
COMMENT ON FUNCTION get_ad_views_data(UUID) IS 'Returns comprehensive view statistics for all ads belonging to a user';

-- Test the functions work (optional - can be removed in production)
-- SELECT * FROM get_real_ad_counts('00000000-0000-0000-0000-000000000000');
-- SELECT * FROM generate_user_notifications('00000000-0000-0000-0000-000000000000');  
-- SELECT * FROM get_ad_views_data('00000000-0000-0000-0000-000000000000');