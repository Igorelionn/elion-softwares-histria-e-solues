-- ============================================
-- RPC FUNCTIONS OTIMIZADAS
-- ============================================
-- Data: 07 de Janeiro de 2025
-- Objetivo: Criar functions RPC que reduzem número de queries

-- 1. Function para buscar perfil completo com estatísticas (1 query em vez de múltiplas)
CREATE OR REPLACE FUNCTION get_profile_with_stats(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', row_to_json(u.*),
    'meetings_count', (
      SELECT COUNT(*) 
      FROM meetings 
      WHERE user_id = user_id_param
    ),
    'pending_meetings', (
      SELECT COUNT(*) 
      FROM meetings 
      WHERE user_id = user_id_param AND status = 'pending'
    ),
    'is_admin', (u.role = 'admin'),
    'is_blocked', COALESCE(u.is_blocked, false),
    'has_avatar', (u.avatar_url IS NOT NULL AND u.avatar_url != '')
  ) INTO result
  FROM users u
  WHERE u.id = user_id_param;

  RETURN result;
END;
$$;

-- 2. Function para buscar estatísticas do admin (usa view materializada se disponível)
CREATE OR REPLACE FUNCTION get_admin_stats_fast()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  has_materialized_view BOOLEAN;
BEGIN
  -- Verificar se view materializada existe
  SELECT EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE schemaname = 'public' AND matviewname = 'admin_stats_cache'
  ) INTO has_materialized_view;

  IF has_materialized_view THEN
    -- Usar view materializada (mais rápido)
    SELECT row_to_json(asc.*) INTO result
    FROM admin_stats_cache asc
    LIMIT 1;
  ELSE
    -- Fallback para queries diretas
    SELECT json_build_object(
      'total_users', (SELECT COUNT(*) FROM users),
      'blocked_users', (SELECT COUNT(*) FROM users WHERE is_blocked = true),
      'total_meetings', (SELECT COUNT(*) FROM meetings),
      'pending_meetings', (SELECT COUNT(*) FROM meetings WHERE status = 'pending'),
      'last_updated', NOW()
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

-- 3. Function para buscar usuários com filtros (otimizada para paginação)
CREATE OR REPLACE FUNCTION get_users_paginated(
  page_size INT DEFAULT 50,
  page_offset INT DEFAULT 0,
  role_filter TEXT DEFAULT NULL,
  blocked_filter BOOLEAN DEFAULT NULL,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  role TEXT,
  is_blocked BOOLEAN,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.company,
    u.avatar_url,
    u.role,
    COALESCE(u.is_blocked, false) as is_blocked,
    u.created_at,
    COUNT(*) OVER() as total_count
  FROM users u
  WHERE 
    (role_filter IS NULL OR u.role = role_filter)
    AND (blocked_filter IS NULL OR u.is_blocked = blocked_filter)
    AND (
      search_term IS NULL 
      OR u.email ILIKE '%' || search_term || '%'
      OR u.full_name ILIKE '%' || search_term || '%'
    )
  ORDER BY u.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 4. Function para buscar reuniões com informações do usuário (1 query com join)
CREATE OR REPLACE FUNCTION get_meetings_with_users(
  page_size INT DEFAULT 50,
  page_offset INT DEFAULT 0,
  status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  scheduled_for TIMESTAMPTZ,
  meeting_type TEXT,
  status TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    u.full_name as user_name,
    u.email as user_email,
    m.scheduled_for,
    m.meeting_type,
    m.status,
    m.notes,
    m.admin_notes,
    m.created_at,
    COUNT(*) OVER() as total_count
  FROM meetings m
  JOIN users u ON m.user_id = u.id
  WHERE 
    (status_filter IS NULL OR m.status = status_filter)
  ORDER BY m.scheduled_for DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;

-- 5. Comentários para documentação
COMMENT ON FUNCTION get_profile_with_stats IS 
'Retorna perfil completo do usuário com estatísticas em uma única query';

COMMENT ON FUNCTION get_admin_stats_fast IS 
'Retorna estatísticas do admin usando view materializada quando disponível';

COMMENT ON FUNCTION get_users_paginated IS 
'Busca usuários com filtros e paginação otimizada';

COMMENT ON FUNCTION get_meetings_with_users IS 
'Busca reuniões com join otimizado para incluir dados do usuário';

-- 6. Permissões (apenas authenticated users)
GRANT EXECUTE ON FUNCTION get_profile_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats_fast TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_meetings_with_users TO authenticated;

