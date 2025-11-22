-- ============================================================================
-- CORREÇÃO DEFINITIVA: ELIMINAR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================================================
-- Data: 2025-11-22
-- Problema: check_user_is_admin() causa recursão infinita ao consultar users
-- Solução: Usar security_definer function com tabela de cache
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA DE CACHE PARA ADMINS (para evitar recursão)
-- ============================================================================

-- Drop se existir
DROP TABLE IF EXISTS public.admin_role_cache CASCADE;

-- Criar tabela simples de cache
CREATE TABLE IF NOT EXISTS public.admin_role_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS (mas sem políticas - será apenas service_role)
ALTER TABLE public.admin_role_cache ENABLE ROW LEVEL SECURITY;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_admin_cache_user_id 
ON public.admin_role_cache(user_id) WHERE is_admin = true;

-- ============================================================================
-- 2. CRIAR FUNÇÃO SEGURA PARA VERIFICAR ADMIN (sem recursão)
-- ============================================================================

-- Drop função antiga se existir
DROP FUNCTION IF EXISTS public.check_user_is_admin_safe(UUID);

-- Criar função com SECURITY DEFINER (bypass RLS)
CREATE OR REPLACE FUNCTION public.check_user_is_admin_safe(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_role TEXT;
    is_admin_cached BOOLEAN;
    cache_age INTERVAL;
BEGIN
    -- 1. Tentar pegar do cache primeiro
    SELECT is_admin, NOW() - cached_at INTO is_admin_cached, cache_age
    FROM admin_role_cache
    WHERE user_id = check_user_id;

    -- Se encontrou no cache e é recente (< 5 minutos), retornar
    IF FOUND AND cache_age < INTERVAL '5 minutes' THEN
        RETURN is_admin_cached;
    END IF;

    -- 2. Se não tem cache ou está velho, consultar users
    -- SECURITY DEFINER permite bypass RLS aqui
    SELECT role INTO user_role
    FROM users
    WHERE id = check_user_id
    LIMIT 1;

    -- Se não encontrou, retornar false
    IF user_role IS NULL THEN
        RETURN false;
    END IF;

    -- Determinar se é admin
    is_admin_cached := (user_role = 'admin');

    -- 3. Atualizar cache
    INSERT INTO admin_role_cache (user_id, is_admin, cached_at)
    VALUES (check_user_id, is_admin_cached, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        is_admin = EXCLUDED.is_admin,
        cached_at = EXCLUDED.cached_at;

    RETURN is_admin_cached;
END;
$$;

-- ============================================================================
-- 3. REMOVER TODAS AS POLÍTICAS RLS ANTIGAS DA TABELA USERS
-- ============================================================================

DO $$ 
BEGIN
    -- Pegar todas as políticas da tabela users e remover
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.users;', ' ')
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
    );
END $$;

-- ============================================================================
-- 4. CRIAR POLÍTICAS RLS SIMPLES E OTIMIZADAS (sem recursão)
-- ============================================================================

-- SELECT: Usuários veem apenas seu próprio perfil (simples, sem função)
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- SELECT: Admins veem todos (usando função SEGURA)
CREATE POLICY "admins_select_all_safe"
ON public.users
FOR SELECT
TO authenticated
USING (check_user_is_admin_safe(auth.uid()));

-- INSERT: Usuários criam seu próprio perfil
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- INSERT: Service role para triggers
CREATE POLICY "service_insert"
ON public.users
FOR INSERT
TO anon, service_role
WITH CHECK (true);

-- UPDATE: Usuários atualizam apenas seu perfil (sem função)
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid() AND is_blocked = false)
WITH CHECK (id = auth.uid() AND is_blocked = false);

-- UPDATE: Admins atualizam qualquer perfil (função segura)
CREATE POLICY "admins_update_all_safe"
ON public.users
FOR UPDATE
TO authenticated
USING (check_user_is_admin_safe(auth.uid()))
WITH CHECK (check_user_is_admin_safe(auth.uid()));

-- DELETE: Admins deletam usuários (função segura)
CREATE POLICY "admins_delete_safe"
ON public.users
FOR DELETE
TO authenticated
USING (check_user_is_admin_safe(auth.uid()));

-- ============================================================================
-- 5. OTIMIZAR POLÍTICAS DA TABELA MEETINGS (mesma lógica)
-- ============================================================================

-- Remover políticas antigas
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.meetings;', ' ')
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'meetings'
    );
END $$;

-- SELECT: Usuários veem apenas suas reuniões
CREATE POLICY "meetings_select_own"
ON public.meetings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Admins veem todas as reuniões
CREATE POLICY "meetings_select_admin_safe"
ON public.meetings
FOR SELECT
TO authenticated
USING (check_user_is_admin_safe(auth.uid()));

-- INSERT: Usuários criam suas reuniões
CREATE POLICY "meetings_insert_own"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Usuários atualizam suas reuniões
CREATE POLICY "meetings_update_own"
ON public.meetings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- UPDATE: Admins atualizam qualquer reunião
CREATE POLICY "meetings_update_admin_safe"
ON public.meetings
FOR UPDATE
TO authenticated
USING (check_user_is_admin_safe(auth.uid()))
WITH CHECK (check_user_is_admin_safe(auth.uid()));

-- DELETE: Admins deletam reuniões
CREATE POLICY "meetings_delete_admin_safe"
ON public.meetings
FOR DELETE
TO authenticated
USING (check_user_is_admin_safe(auth.uid()));

-- ============================================================================
-- 6. CRIAR TRIGGER PARA MANTER CACHE ATUALIZADO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_admin_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar cache quando role mudar
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        INSERT INTO admin_role_cache (user_id, is_admin, cached_at)
        VALUES (NEW.id, (NEW.role = 'admin'), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            is_admin = (NEW.role = 'admin'),
            cached_at = NOW();
    END IF;
    
    -- Remover do cache ao deletar usuário
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM admin_role_cache WHERE user_id = OLD.id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop trigger se existir
DROP TRIGGER IF EXISTS sync_admin_cache_trigger ON public.users;

-- Criar trigger
CREATE TRIGGER sync_admin_cache_trigger
AFTER INSERT OR UPDATE OF role OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_cache();

-- ============================================================================
-- 7. POPULAR CACHE INICIAL COM ADMINS EXISTENTES
-- ============================================================================

INSERT INTO admin_role_cache (user_id, is_admin, cached_at)
SELECT id, (role = 'admin'), NOW()
FROM users
ON CONFLICT (user_id) DO UPDATE SET
    is_admin = EXCLUDED.is_admin,
    cached_at = EXCLUDED.cached_at;

-- ============================================================================
-- 8. ANÁLISE E OTIMIZAÇÃO
-- ============================================================================

-- Recriar índices importantes
CREATE INDEX IF NOT EXISTS idx_users_id_role 
ON public.users(id, role);

CREATE INDEX IF NOT EXISTS idx_users_role_partial 
ON public.users(id) WHERE role = 'admin';

CREATE INDEX IF NOT EXISTS idx_meetings_user_id 
ON public.meetings(user_id);

-- Análise das tabelas
ANALYZE public.users;
ANALYZE public.meetings;
ANALYZE public.admin_role_cache;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Dar permissão para a função ser executada
GRANT EXECUTE ON FUNCTION public.check_user_is_admin_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_admin_cache() TO authenticated;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION public.check_user_is_admin_safe IS 
'Verifica se usuário é admin usando cache para evitar recursão infinita.
SECURITY DEFINER permite bypass RLS na consulta interna.';

COMMENT ON TABLE public.admin_role_cache IS 
'Cache de roles de admin para evitar recursão infinita nas políticas RLS.
Atualizado automaticamente via trigger.';

COMMENT ON POLICY "users_select_own" ON public.users IS 
'Usuários comuns veem apenas seu próprio perfil. Sem recursão.';

COMMENT ON POLICY "admins_select_all_safe" ON public.users IS 
'Admins veem todos os perfis usando função segura com cache.';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

