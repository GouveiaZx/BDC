-- ====================================
-- SCRIPT DE LIMPEZA: Dados inconsistentes na tabela highlights
-- Data: 2025-09-15
-- Objetivo: Corrigir dados inconsistentes após migração
-- ====================================

-- 1. VERIFICAR ESTADO ATUAL DOS DADOS
SELECT 
  'Verificação Inicial' as etapa,
  COUNT(*) as total_highlights,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativos_antigo,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos_novo,
  COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as aprovados
FROM highlights;

-- 2. IDENTIFICAR INCONSISTÊNCIAS
SELECT 
  id,
  title,
  is_active,
  status,
  moderation_status,
  expires_at,
  created_at,
  CASE 
    WHEN is_active = true AND status != 'active' THEN 'INCONSISTENTE: is_active=true mas status!=active'
    WHEN is_active = true AND moderation_status != 'approved' THEN 'INCONSISTENTE: is_active=true mas não aprovado'
    WHEN status = 'active' AND moderation_status != 'approved' THEN 'INCONSISTENTE: ativo mas não aprovado'
    ELSE 'OK'
  END as status_analysis
FROM highlights
WHERE 
  (is_active = true AND status != 'active') OR
  (is_active = true AND moderation_status != 'approved') OR
  (status = 'active' AND moderation_status != 'approved');

-- 3. CORRIGIR DESTAQUES QUE DEVEM ESTAR APROVADOS
-- (is_active=true deve corresponder a status=active E moderation_status=approved)
UPDATE highlights 
SET 
  status = 'active',
  moderation_status = 'approved',
  moderated_at = COALESCE(moderated_at, NOW())
WHERE 
  is_active = true AND 
  (status != 'active' OR moderation_status != 'approved');

-- 4. CORRIGIR DESTAQUES QUE DEVEM ESTAR PENDENTES
-- (is_active=false deve corresponder a status=pending_review E moderation_status=pending)
UPDATE highlights 
SET 
  status = 'pending_review',
  moderation_status = 'pending'
WHERE 
  is_active = false AND 
  status = 'active';

-- 5. MIGRAR URLS DE MÍDIA PARA CAMPOS ESPECÍFICOS
UPDATE highlights 
SET 
  image_url = CASE WHEN media_type = 'image' THEN media_url ELSE image_url END,
  video_url = CASE WHEN media_type = 'video' THEN media_url ELSE video_url END
WHERE 
  (media_type = 'image' AND (image_url IS NULL OR image_url = '')) OR
  (media_type = 'video' AND (video_url IS NULL OR video_url = ''));

-- 6. CORRIGIR DESTAQUES EXPIRADOS
UPDATE highlights 
SET 
  is_active = false,
  status = 'expired'
WHERE 
  expires_at < NOW() AND 
  (is_active = true OR status = 'active');

-- 7. VERIFICAR RESULTADO FINAL
SELECT 
  'Verificação Final' as etapa,
  COUNT(*) as total_highlights,
  COUNT(CASE WHEN is_active = true AND status = 'active' AND moderation_status = 'approved' THEN 1 END) as aprovados_corretos,
  COUNT(CASE WHEN is_active = false AND status != 'active' THEN 1 END) as inativos_corretos,
  COUNT(CASE WHEN expires_at < NOW() AND status = 'expired' THEN 1 END) as expirados_corretos
FROM highlights;

-- 8. LISTAR DESTAQUES APROVADOS E ATIVOS (que devem aparecer na homepage)
SELECT 
  id,
  title,
  is_active,
  status,
  moderation_status,
  expires_at,
  CASE WHEN expires_at > NOW() THEN 'NÃO EXPIRADO' ELSE 'EXPIRADO' END as expiry_status
FROM highlights
WHERE 
  is_active = true AND 
  status = 'active' AND 
  moderation_status = 'approved'
ORDER BY created_at DESC;