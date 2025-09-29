-- RPC para buscar anúncio com dados completos do usuário
-- Prioriza dados: users.name > profiles.name > fallback "Anunciante"

CREATE OR REPLACE FUNCTION get_advertisement_with_user(ad_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Buscar anúncio com dados do usuário priorizando tabela users
  SELECT json_build_object(
    -- Dados do anúncio
    'id', a.id,
    'title', a.title,
    'description', a.description,
    'price', a.price,
    'images', a.images,
    'category', a.category,
    'sub_category', a.sub_category,
    'condition', a.condition,
    'city', a.city,
    'state', a.state,
    'location', a.location,
    'created_at', a.created_at,
    'updated_at', a.updated_at,
    'view_count', a.view_count,
    'user_id', a.user_id,
    'status', a.status,
    'moderation_status', a.moderation_status,
    'whatsapp', a.whatsapp,
    
    -- Dados do usuário (priorizando users > profiles > fallback)
    'user_name', COALESCE(u.name, p.name, 'Anunciante'),
    'user_email', COALESCE(u.email, p.email, ''),
    'user_profile_image_url', COALESCE(u.profile_image_url, p.avatar_url, '/images/avatar-placeholder.png'),
    'user_phone', COALESCE(p.phone, ''),
    'user_whatsapp', COALESCE(p.whatsapp, a.whatsapp, ''),
    'user_created_at', COALESCE(u.created_at, p.created_at)
  )
  INTO result
  FROM advertisements a
  LEFT JOIN users u ON a.user_id = u.id
  LEFT JOIN profiles p ON a.user_id = p.id
  WHERE a.id = ad_id
    AND a.status = 'active'
    AND a.moderation_status = 'approved';
  
  -- Se não encontrar o anúncio, retornar null
  IF result IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Dar permissões
GRANT EXECUTE ON FUNCTION get_advertisement_with_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_advertisement_with_user(uuid) TO authenticated; 