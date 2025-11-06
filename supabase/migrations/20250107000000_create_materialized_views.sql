-- ============================================
-- VIEWS MATERIALIZADAS PARA PERFORMANCE
-- ============================================
-- Data: 07 de Janeiro de 2025
-- Objetivo: Criar views materializadas para cach ear estatísticas pesadas no banco

-- 1. View para estatísticas de admin (cache no banco)
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_stats_cache AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'user') as regular_users,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
  (SELECT COUNT(*) FROM users WHERE is_blocked = true) as blocked_users,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
  (SELECT COUNT(*) FROM meetings) as total_meetings,
  (SELECT COUNT(*) FROM meetings WHERE status = 'pending') as pending_meetings,
  (SELECT COUNT(*) FROM meetings WHERE status = 'completed') as completed_meetings,
  (SELECT COUNT(*) FROM meetings WHERE status = 'cancelled') as cancelled_meetings,
  (SELECT COUNT(*) FROM meetings WHERE scheduled_for > NOW()) as future_meetings,
  NOW() as last_updated;

-- Índice único para a view (necessário para refresh concurrente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_stats_cache_last_updated 
ON admin_stats_cache (last_updated);

-- 2. Refresh manual da view (executar quando necessário)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY admin_stats_cache;

-- 3. Função para refresh automático (pode ser chamada por trigger ou cron)
CREATE OR REPLACE FUNCTION refresh_admin_stats_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_stats_cache;
END;
$$ LANGUAGE plpgsql;

-- 4. Comentários para documentação
COMMENT ON MATERIALIZED VIEW admin_stats_cache IS 
'Cache de estatísticas do painel admin. Refresh a cada 5 minutos via pg_cron ou manualmente.';

COMMENT ON FUNCTION refresh_admin_stats_cache IS 
'Atualiza a view materializada admin_stats_cache de forma concorrente (não bloqueia leituras).';

-- ============================================
-- NOTA: Para refresh automático via pg_cron
-- ============================================
-- Requer extensão pg_cron (disponível no Supabase Pro)
-- 
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 
-- SELECT cron.schedule(
--   'refresh-admin-stats',
--   '*/5 * * * *',  -- A cada 5 minutos
--   'SELECT refresh_admin_stats_cache();'
-- );

