-- ============================================
-- ÍNDICES COMPOSTOS PARA OTIMIZAÇÃO DE QUERIES
-- ============================================
-- Data: 07 de Janeiro de 2025
-- Objetivo: Criar índices compostos para queries mais rápidas

-- 1. Índice composto para queries de admin (filtro + ordenação)
CREATE INDEX IF NOT EXISTS idx_users_role_created 
ON users(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_blocked_created 
ON users(is_blocked, created_at DESC);

-- 2. Índice composto para meetings (status + data)
CREATE INDEX IF NOT EXISTS idx_meetings_status_scheduled 
ON meetings(status, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS idx_meetings_user_scheduled 
ON meetings(user_id, scheduled_for DESC);

-- 3. Índices para pesquisa de texto (usando pg_trgm)
-- Requer extensão pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_email_trgm 
ON users USING gin(email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_name_trgm 
ON users USING gin(full_name gin_trgm_ops);

-- 4. Índice para filtros comuns
CREATE INDEX IF NOT EXISTS idx_users_role_blocked 
ON users(role, is_blocked) 
WHERE is_blocked = true;

-- 5. Índice parcial para reuniões futuras
CREATE INDEX IF NOT EXISTS idx_meetings_future 
ON meetings(scheduled_for) 
WHERE scheduled_for > NOW();

-- 6. Índice para joins comum (meetings + users)
CREATE INDEX IF NOT EXISTS idx_meetings_user_id 
ON meetings(user_id);

-- 7. Comentários para documentação
COMMENT ON INDEX idx_users_role_created IS 
'Otimiza queries de listagem de usuários por role com ordenação por data';

COMMENT ON INDEX idx_users_email_trgm IS 
'Permite busca fuzzy por email usando trigrams';

COMMENT ON INDEX idx_meetings_status_scheduled IS 
'Otimiza queries de reuniões por status com ordenação por data';

-- 8. Análise de tabelas para atualizar estatísticas do planner
ANALYZE users;
ANALYZE meetings;

