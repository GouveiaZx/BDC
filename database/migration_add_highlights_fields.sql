-- ====================================
-- MIGRAÇÃO: Adicionar campos ausentes à tabela highlights
-- Data: 2025-09-15
-- Objetivo: Suporte completo ao sistema de moderação de destaques
-- ====================================

-- Adicionar campos de status
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'pending';

-- Adicionar campos de mídia separados  
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Adicionar campos de pagamento
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Adicionar campos de moderação
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id);

-- Adicionar campos extras para funcionalidades completas
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS highlight_type VARCHAR(50) DEFAULT 'promotion',
ADD COLUMN IF NOT EXISTS background_color VARCHAR(10) DEFAULT '#FF6B35',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(10) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS link_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Migrar dados existentes
UPDATE highlights 
SET 
    image_url = CASE WHEN media_type = 'image' THEN media_url ELSE NULL END,
    video_url = CASE WHEN media_type = 'video' THEN media_url ELSE NULL END,
    status = CASE WHEN is_active = true THEN 'active' ELSE 'pending_review' END,
    moderation_status = CASE WHEN is_active = true THEN 'approved' ELSE 'pending' END
WHERE image_url IS NULL OR video_url IS NULL OR status = 'pending_review';

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_highlights_status ON highlights(status);
CREATE INDEX IF NOT EXISTS idx_highlights_moderation_status ON highlights(moderation_status);
CREATE INDEX IF NOT EXISTS idx_highlights_payment_status ON highlights(payment_status);

-- Comentários sobre próximos passos:
-- 1. Aplicar esta migração no Supabase Dashboard -> SQL Editor
-- 2. Verificar se todos os campos foram criados corretamente  
-- 3. Executar queries de validação para confirmar migração dos dados