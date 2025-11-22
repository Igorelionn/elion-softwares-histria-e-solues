-- ============================================================================
-- REVERTER BANCO DE DADOS PARA ESTRUTURA ORIGINAL (ANTES DA REESTRUTURAÇÃO)
-- ============================================================================
-- Data: 2025-11-22
-- Objetivo: Desfazer todas as mudanças da migração de reestruturação
-- ============================================================================

-- ============================================================================
-- 1. REMOVER TABELA DE CACHE
-- ============================================================================

DROP TABLE IF EXISTS public.admin_check_cache CASCADE;

-- ============================================================================
-- 2. REMOVER POLÍTICAS RLS NOVAS DA TABELA USERS
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own_only" ON public.users;
DROP POLICY IF EXISTS "admins_select_all_direct" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "service_insert_users" ON public.users;
DROP POLICY IF EXISTS "users_update_own_simple" ON public.users;
DROP POLICY IF EXISTS "admins_update_any_direct" ON public.users;
DROP POLICY IF EXISTS "admins_delete_direct" ON public.users;

-- ============================================================================
-- 3. RECRIAR POLÍTICAS RLS ORIGINAIS DA TABELA USERS
-- ============================================================================

-- SELECT: Usuários veem apenas seu próprio perfil
CREATE POLICY "users_select_simple"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins veem todos os perfis (usando função check_user_is_admin)
CREATE POLICY "admins_view_all_v2"
ON public.users
FOR SELECT
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- INSERT: Usuários podem criar seu próprio perfil
CREATE POLICY "Allow authenticated insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- INSERT: Service role (para triggers de auth)
CREATE POLICY "Allow service role insert"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- UPDATE: Usuários atualizam seu próprio perfil (COM verificação de bloqueio)
CREATE POLICY "users_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING ((auth.uid() = id) AND (is_blocked = false))
WITH CHECK ((auth.uid() = id) AND (is_blocked = false));

-- UPDATE: Admins atualizam qualquer perfil
CREATE POLICY "admins_update_any_v2"
ON public.users
FOR UPDATE
TO authenticated
USING (check_user_is_admin(auth.uid()))
WITH CHECK (check_user_is_admin(auth.uid()));

-- DELETE: Admins deletam usuários
CREATE POLICY "admins_delete_v2"
ON public.users
FOR DELETE
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- ============================================================================
-- 4. REMOVER POLÍTICAS RLS NOVAS DA TABELA MEETINGS
-- ============================================================================

DROP POLICY IF EXISTS "meetings_select_own_only" ON public.meetings;
DROP POLICY IF EXISTS "meetings_select_admin_direct" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_admin_direct" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete_admin_direct" ON public.meetings;

-- ============================================================================
-- 5. RECRIAR POLÍTICAS RLS ORIGINAIS DA TABELA MEETINGS
-- ============================================================================

-- SELECT: Usuários veem apenas suas reuniões
CREATE POLICY "users_can_view_own_meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- SELECT: Admins veem todas
CREATE POLICY "admins_can_view_all_meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- INSERT: Usuários criam suas reuniões
CREATE POLICY "users_can_insert_own_meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários atualizam suas reuniões
CREATE POLICY "users_can_update_own_meetings_simple"
ON public.meetings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins atualizam qualquer reunião
CREATE POLICY "admins_can_update_meetings_v2"
ON public.meetings
FOR UPDATE
TO authenticated
USING (check_user_is_admin(auth.uid()))
WITH CHECK (check_user_is_admin(auth.uid()));

-- DELETE: Admins deletam reuniões
CREATE POLICY "admins_can_delete_meetings_v2"
ON public.meetings
FOR DELETE
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- ============================================================================
-- 6. REMOVER ÍNDICE NOVO
-- ============================================================================

DROP INDEX IF EXISTS public.idx_users_admin_check_optimized;

-- ============================================================================
-- 7. RECRIAR ÍNDICES ORIGINAIS (se não existirem)
-- ============================================================================

-- Índice para id e role
CREATE INDEX IF NOT EXISTS idx_users_id_role
ON public.users (id, role);

-- Índice parcial para admins
CREATE INDEX IF NOT EXISTS idx_users_id_role_admin
ON public.users (id, role)
WHERE role = 'admin';

-- ============================================================================
-- 8. ANÁLISE E ESTATÍSTICAS DAS TABELAS
-- ============================================================================

ANALYZE public.users;
ANALYZE public.meetings;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "users_select_simple" ON public.users IS 
'Usuários comuns veem apenas seu próprio perfil.';

COMMENT ON POLICY "admins_view_all_v2" ON public.users IS 
'Admins veem todos os perfis usando função check_user_is_admin.';

COMMENT ON POLICY "users_can_view_own_meetings" ON public.meetings IS 
'Usuários veem apenas suas reuniões.';

COMMENT ON POLICY "admins_can_view_all_meetings" ON public.meetings IS 
'Admins veem todas as reuniões usando função check_user_is_admin.';

-- ============================================================================
-- FIM DA REVERSÃO
-- ============================================================================

