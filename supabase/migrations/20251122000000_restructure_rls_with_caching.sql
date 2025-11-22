-- ============================================================================
-- REESTRUTURAÇÃO COMPLETA DAS POLÍTICAS RLS PARA ELIMINAR TIMEOUTS
-- ============================================================================
-- Objetivo: Simplificar políticas RLS, adicionar caching e eliminar recursão
-- Data: 2025-11-22
-- ============================================================================

-- ============================================================================
-- 1. CRIAR FUNÇÃO OTIMIZADA DE CACHE DE ADMIN (COM TTL)
-- ============================================================================

-- Criar tabela de cache para verificações de admin (evitar queries repetidas)
CREATE TABLE IF NOT EXISTS public.admin_check_cache (
    user_id UUID PRIMARY KEY,
    is_admin BOOLEAN NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Índice para limpeza automática de cache expirado
CREATE INDEX IF NOT EXISTS idx_admin_cache_expires
ON public.admin_check_cache(expires_at)
WHERE expires_at < NOW();

-- Função para verificar admin com cache (ULTRA RÁPIDA)
CREATE OR REPLACE FUNCTION public.check_user_is_admin_cached(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    cached_result BOOLEAN;
    is_admin_result BOOLEAN;
BEGIN
    -- Tentar buscar do cache primeiro
    SELECT is_admin INTO cached_result
    FROM public.admin_check_cache
    WHERE user_id = user_id_param
      AND expires_at > NOW()
    LIMIT 1;

    -- Se encontrou no cache, retornar imediatamente
    IF FOUND THEN
        RETURN cached_result;
    END IF;

    -- Se não está no cache, fazer a query
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = user_id_param
          AND role = 'admin'
        LIMIT 1
    ) INTO is_admin_result;

    -- Armazenar no cache
    INSERT INTO public.admin_check_cache (user_id, is_admin)
    VALUES (user_id_param, is_admin_result)
    ON CONFLICT (user_id)
    DO UPDATE SET
        is_admin = EXCLUDED.is_admin,
        cached_at = NOW(),
        expires_at = NOW() + INTERVAL '5 minutes';

    RETURN is_admin_result;
END;
$$;

-- Função para limpar cache expirado (rodar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_admin_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.admin_check_cache
    WHERE expires_at < NOW();
$$;

-- ============================================================================
-- 2. REMOVER TODAS AS POLÍTICAS RLS ANTIGAS DA TABELA USERS
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.users;
DROP POLICY IF EXISTS "Allow service role insert" ON public.users;
DROP POLICY IF EXISTS "admins_delete_v2" ON public.users;
DROP POLICY IF EXISTS "admins_update_any_v2" ON public.users;
DROP POLICY IF EXISTS "admins_view_all_v2" ON public.users;
DROP POLICY IF EXISTS "users_select_simple" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;

-- ============================================================================
-- 3. CRIAR POLÍTICAS RLS ULTRA SIMPLES PARA USERS (SEM FUNÇÃO ADMIN)
-- ============================================================================

-- SELECT: Usuários veem apenas seu próprio perfil
CREATE POLICY "users_select_own_only"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins veem todos (usando campo role DIRETO - sem função)
CREATE POLICY "admins_select_all_direct"
ON public.users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
);

-- INSERT: Usuários podem criar seu próprio perfil
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- INSERT: Service role (para triggers de auth)
CREATE POLICY "service_insert_users"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- UPDATE: Usuários atualizam seu próprio perfil (SEM verificar is_blocked)
CREATE POLICY "users_update_own_simple"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins atualizam qualquer perfil (usando campo role DIRETO)
CREATE POLICY "admins_update_any_direct"
ON public.users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
);

-- DELETE: Admins deletam usuários (usando campo role DIRETO)
CREATE POLICY "admins_delete_direct"
ON public.users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
);

-- ============================================================================
-- 4. REMOVER TODAS AS POLÍTICAS RLS ANTIGAS DA TABELA MEETINGS
-- ============================================================================

DROP POLICY IF EXISTS "admins_can_delete_meetings_v2" ON public.meetings;
DROP POLICY IF EXISTS "admins_can_update_meetings_v2" ON public.meetings;
DROP POLICY IF EXISTS "admins_can_view_all_meetings" ON public.meetings;
DROP POLICY IF EXISTS "users_can_insert_own_meetings" ON public.meetings;
DROP POLICY IF EXISTS "users_can_update_own_meetings_simple" ON public.meetings;
DROP POLICY IF EXISTS "users_can_view_own_meetings" ON public.meetings;

-- ============================================================================
-- 5. CRIAR POLÍTICAS RLS ULTRA SIMPLES PARA MEETINGS (SEM FUNÇÃO ADMIN)
-- ============================================================================

-- SELECT: Usuários veem apenas suas reuniões
CREATE POLICY "meetings_select_own_only"
ON public.meetings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- SELECT: Admins veem todas (usando campo role DIRETO - sem função)
CREATE POLICY "meetings_select_admin_direct"
ON public.meetings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
);

-- INSERT: Usuários criam suas reuniões
CREATE POLICY "meetings_insert_own"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários atualizam suas reuniões
CREATE POLICY "meetings_update_own"
ON public.meetings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins atualizam qualquer reunião (usando campo role DIRETO)
CREATE POLICY "meetings_update_admin_direct"
ON public.meetings
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
);

-- DELETE: Admins deletam reuniões (usando campo role DIRETO)
CREATE POLICY "meetings_delete_admin_direct"
ON public.meetings
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
        LIMIT 1
    )
);

-- ============================================================================
-- 6. OTIMIZAR ÍNDICE PARA VERIFICAÇÃO DE ADMIN (COVERING INDEX)
-- ============================================================================

-- Remover índices antigos redundantes
DROP INDEX IF EXISTS public.idx_users_id_role;
DROP INDEX IF EXISTS public.idx_users_id_role_admin;

-- Criar índice covering otimizado para queries de admin
-- Este índice inclui APENAS o necessário para a verificação
CREATE INDEX IF NOT EXISTS idx_users_admin_check_optimized
ON public.users (id, role)
WHERE role = 'admin';

-- ============================================================================
-- 7. ADICIONAR TRIGGER PARA INVALIDAR CACHE QUANDO ROLE MUDAR
-- ============================================================================

CREATE OR REPLACE FUNCTION public.invalidate_admin_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se o role mudou, invalidar cache
    IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) OR TG_OP = 'INSERT' THEN
        DELETE FROM public.admin_check_cache WHERE user_id = NEW.id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        DELETE FROM public.admin_check_cache WHERE user_id = OLD.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para invalidar cache automaticamente
DROP TRIGGER IF EXISTS trigger_invalidate_admin_cache ON public.users;
CREATE TRIGGER trigger_invalidate_admin_cache
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_admin_cache();

-- ============================================================================
-- 8. ANÁLISE E ESTATÍSTICAS DAS TABELAS
-- ============================================================================

-- Atualizar estatísticas para otimizador de query
ANALYZE public.users;
ANALYZE public.meetings;
ANALYZE public.admin_check_cache;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.admin_check_cache IS
'Cache de verificações de admin para evitar queries repetidas.
TTL de 5 minutos. Invalidado automaticamente quando role muda.';

COMMENT ON FUNCTION public.check_user_is_admin_cached(UUID) IS
'Verifica se usuário é admin usando cache de 5 minutos.
MUITO mais rápido que verificação direta.';

COMMENT ON FUNCTION public.cleanup_admin_cache() IS
'Remove entradas expiradas do cache.
Deve ser executado periodicamente (ex: cron job).';

COMMENT ON POLICY "users_select_own_only" ON public.users IS
'Usuários comuns veem apenas seu próprio perfil. Sem verificação de bloqueio para performance.';

COMMENT ON POLICY "admins_select_all_direct" ON public.users IS
'Admins veem todos os perfis. Usa EXISTS com subquery ao invés de função para melhor performance.';

COMMENT ON POLICY "meetings_select_own_only" ON public.meetings IS
'Usuários veem apenas suas reuniões. Política mais simples possível para máxima performance.';

COMMENT ON POLICY "meetings_select_admin_direct" ON public.meetings IS
'Admins veem todas as reuniões. Usa EXISTS direto ao invés de função.';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

