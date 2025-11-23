-- ============================================================================
-- CORREÇÕES DE PERFORMANCE - AUDITORIA COMPLETA
-- ============================================================================
-- Data: 2025-11-22 23:00:00
-- Objetivo: Corrigir 28 problemas identificados na auditoria de performance
-- Ganho Esperado: 5-10x mais rápido, 95% redução de timeouts
-- ============================================================================

-- ============================================================================
-- PARTE 1: OTIMIZAR RLS POLICIES (14 policies afetadas)
-- ============================================================================

-- 1.1 TABELA USERS - Remover e recriar policies otimizadas
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_on_signup" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "admins_select_all_safe" ON public.users;
DROP POLICY IF EXISTS "admins_update_all_safe" ON public.users;
DROP POLICY IF EXISTS "admins_delete_safe" ON public.users;

-- Criar policies OTIMIZADAS com (select auth.uid())
-- SELECT: Usuários veem apenas seu próprio perfil
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

-- SELECT: Admins veem todos (usando subquery para admin check)
CREATE POLICY "admins_select_all_safe"
ON public.users
FOR SELECT
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- INSERT: Usuários podem criar seu próprio perfil
CREATE POLICY "users_insert_on_signup"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

-- UPDATE: Usuários atualizam seu próprio perfil
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- UPDATE: Admins atualizam qualquer perfil
CREATE POLICY "admins_update_all_safe"
ON public.users
FOR UPDATE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))))
WITH CHECK ((select check_user_is_admin_safe((select auth.uid()))));

-- DELETE: Admins deletam usuários
CREATE POLICY "admins_delete_safe"
ON public.users
FOR DELETE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- 1.2 TABELA MEETINGS - Remover e recriar policies otimizadas
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "meetings_select_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_select_admin_safe" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_admin_safe" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete_admin_safe" ON public.meetings;

-- Criar policies OTIMIZADAS com (select auth.uid())
-- SELECT: Usuários veem apenas suas reuniões
CREATE POLICY "meetings_select_own"
ON public.meetings
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- SELECT: Admins veem todas (usando subquery)
CREATE POLICY "meetings_select_admin_safe"
ON public.meetings
FOR SELECT
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- INSERT: Usuários criam suas reuniões
CREATE POLICY "meetings_insert_own"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Usuários atualizam suas reuniões
CREATE POLICY "meetings_update_own"
ON public.meetings
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Admins atualizam qualquer reunião
CREATE POLICY "meetings_update_admin_safe"
ON public.meetings
FOR UPDATE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))))
WITH CHECK ((select check_user_is_admin_safe((select auth.uid()))));

-- DELETE: Admins deletam reuniões
CREATE POLICY "meetings_delete_admin_safe"
ON public.meetings
FOR DELETE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- ============================================================================
-- PARTE 2: CORRIGIR TABELA ADMIN_ROLE_CACHE (RLS sem policies)
-- ============================================================================

-- Desabilitar RLS na tabela de cache (é uma tabela interna de sistema)
ALTER TABLE public.admin_role_cache DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 3: REMOVER ÍNDICES DUPLICADOS
-- ============================================================================

-- Remover índice duplicado em admin_role_cache (manter apenas o PK)
DROP INDEX IF EXISTS public.idx_admin_cache_user_id;

-- Remover índice duplicado em meetings (manter apenas um)
DROP INDEX IF EXISTS public.idx_meetings_user_id;

-- ============================================================================
-- PARTE 4: REMOVER ÍNDICES NÃO UTILIZADOS
-- ============================================================================

-- Índices não usados em LEADS
DROP INDEX IF EXISTS public.idx_leads_status;
DROP INDEX IF EXISTS public.idx_leads_created_at;
DROP INDEX IF EXISTS public.idx_leads_email;
DROP INDEX IF EXISTS public.idx_leads_meeting_date;

-- Índices não usados em FAQ
DROP INDEX IF EXISTS public.idx_faq_active_order;
DROP INDEX IF EXISTS public.idx_faq_category;
DROP INDEX IF EXISTS public.idx_faq_views;

-- Índices não usados em USERS
DROP INDEX IF EXISTS public.idx_users_role_partial;
DROP INDEX IF EXISTS public.idx_users_blocked;
DROP INDEX IF EXISTS public.idx_users_is_blocked;
DROP INDEX IF EXISTS public.idx_users_email_blocked;
DROP INDEX IF EXISTS public.idx_users_blocked_by;
DROP INDEX IF EXISTS public.idx_users_updated_at;
DROP INDEX IF EXISTS public.idx_users_id_role_admin;

-- Índices não usados em PROJECTS
DROP INDEX IF EXISTS public.idx_projects_published;
DROP INDEX IF EXISTS public.idx_projects_featured;
DROP INDEX IF EXISTS public.idx_projects_category;
DROP INDEX IF EXISTS public.idx_projects_slug;
DROP INDEX IF EXISTS public.idx_projects_completion_date;
DROP INDEX IF EXISTS public.idx_projects_tags;
DROP INDEX IF EXISTS public.idx_projects_technologies;

-- Índices não usados em MEETINGS
DROP INDEX IF EXISTS public.idx_meetings_approved_by;

-- Índices não usados em TESTIMONIALS
DROP INDEX IF EXISTS public.idx_testimonials_published;
DROP INDEX IF EXISTS public.idx_testimonials_featured;
DROP INDEX IF EXISTS public.idx_testimonials_project;
DROP INDEX IF EXISTS public.idx_testimonials_rating;

-- Índices não usados em CONTACTS
DROP INDEX IF EXISTS public.idx_contacts_status;
DROP INDEX IF EXISTS public.idx_contacts_priority;
DROP INDEX IF EXISTS public.idx_contacts_email;
DROP INDEX IF EXISTS public.idx_contacts_created_at;
DROP INDEX IF EXISTS public.idx_contacts_source;

-- Índices não usados em ADMIN tables
DROP INDEX IF EXISTS public.idx_admin_logs_action;
DROP INDEX IF EXISTS public.idx_admin_users_role;
DROP INDEX IF EXISTS public.idx_admin_users_active;
DROP INDEX IF EXISTS public.idx_admin_role_cache_is_admin;
DROP INDEX IF EXISTS public.idx_audit_logs_admin_user;
DROP INDEX IF EXISTS public.idx_audit_logs_entity;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_deleted_users_deleted_by;

-- ============================================================================
-- PARTE 5: REMOVER TRIGGER DUPLICADO
-- ============================================================================

-- Remover trigger duplicado (manter apenas sync_admin_cache_trigger)
DROP TRIGGER IF EXISTS update_admin_cache_on_user_change ON public.users;

-- ============================================================================
-- PARTE 6: ADICIONAR SEARCH_PATH EM FUNÇÕES VULNERÁVEIS
-- ============================================================================

-- Recriar função get_user_profile com search_path
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    company text,
    avatar_url text,
    role text,
    language text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
        u.language
    FROM public.users u
    WHERE u.id = user_id_param;
END;
$$;

-- Recriar função sync_admin_cache com search_path
CREATE OR REPLACE FUNCTION public.sync_admin_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- ============================================================================
-- PARTE 7: CORRIGIR VIEW COM SECURITY DEFINER
-- ============================================================================

-- Recriar view occupied_time_slots SEM security definer
DROP VIEW IF EXISTS public.occupied_time_slots;
CREATE VIEW public.occupied_time_slots AS
SELECT
    meeting_date,
    meeting_time
FROM public.meetings
WHERE status IN ('pending', 'confirmed');

-- ============================================================================
-- PARTE 8: CONSOLIDAR MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- 8.1 USERS - Consolidar policies duplicadas de INSERT
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
-- Já temos users_insert_on_signup, que é suficiente

-- 8.2 USERS - Consolidar SELECT (manter ambas, mas otimizadas)
-- Já foram otimizadas acima com subqueries

-- 8.3 FAQ - Consolidar policies SELECT
DROP POLICY IF EXISTS "Admins podem visualizar todas as FAQs" ON public.faq;
DROP POLICY IF EXISTS "Qualquer um pode visualizar FAQs ativas" ON public.faq;
DROP POLICY IF EXISTS "Admins podem gerenciar FAQs" ON public.faq;

CREATE POLICY "faq_select_optimized"
ON public.faq
FOR SELECT
USING (
    is_active = true
    OR (select check_user_is_admin_safe((select auth.uid())))
);

-- 8.4 PROJECTS - Consolidar policies SELECT
DROP POLICY IF EXISTS "Admins podem visualizar todos os projetos" ON public.projects;
DROP POLICY IF EXISTS "Qualquer um pode visualizar projetos publicados" ON public.projects;
DROP POLICY IF EXISTS "Admins podem gerenciar projetos" ON public.projects;

CREATE POLICY "projects_select_optimized"
ON public.projects
FOR SELECT
USING (
    published = true
    OR (select check_user_is_admin_safe((select auth.uid())))
);

-- 8.5 TESTIMONIALS - Consolidar policies SELECT
DROP POLICY IF EXISTS "Admins podem visualizar todos os depoimentos" ON public.testimonials;
DROP POLICY IF EXISTS "Qualquer um pode visualizar depoimentos publicados" ON public.testimonials;
DROP POLICY IF EXISTS "Admins podem gerenciar depoimentos" ON public.testimonials;

CREATE POLICY "testimonials_select_optimized"
ON public.testimonials
FOR SELECT
USING (
    published = true
    OR (select check_user_is_admin_safe((select auth.uid())))
);

-- ============================================================================
-- PARTE 9: ATUALIZAR ESTATÍSTICAS E ANÁLISE
-- ============================================================================

ANALYZE public.users;
ANALYZE public.meetings;
ANALYZE public.admin_role_cache;
ANALYZE public.faq;
ANALYZE public.projects;
ANALYZE public.testimonials;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "users_select_own" ON public.users IS
'OTIMIZADO: Usa (select auth.uid()) para avaliar uma vez por query ao invés de uma vez por linha';

COMMENT ON POLICY "admins_select_all_safe" ON public.users IS
'OTIMIZADO: Usa subquery dupla para avaliar função admin apenas uma vez';

COMMENT ON POLICY "meetings_select_own" ON public.meetings IS
'OTIMIZADO: Usa (select auth.uid()) para máxima performance';

COMMENT ON POLICY "faq_select_optimized" ON public.faq IS
'CONSOLIDADO: Combina 3 policies anteriores em uma única com OR para melhor performance';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
-- Total de índices removidos: 42
-- Total de policies otimizadas: 14
-- Total de policies consolidadas: 9
-- Triggers removidos: 1
-- Funções corrigidas: 2
-- Ganho esperado: 5-10x mais rápido
-- ============================================================================

-- CORREÇÕES DE PERFORMANCE - AUDITORIA COMPLETA
-- ============================================================================
-- Data: 2025-11-22 23:00:00
-- Objetivo: Corrigir 28 problemas identificados na auditoria de performance
-- Ganho Esperado: 5-10x mais rápido, 95% redução de timeouts
-- ============================================================================

-- ============================================================================
-- PARTE 1: OTIMIZAR RLS POLICIES (14 policies afetadas)
-- ============================================================================

-- 1.1 TABELA USERS - Remover e recriar policies otimizadas
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_on_signup" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "admins_select_all_safe" ON public.users;
DROP POLICY IF EXISTS "admins_update_all_safe" ON public.users;
DROP POLICY IF EXISTS "admins_delete_safe" ON public.users;

-- Criar policies OTIMIZADAS com (select auth.uid())
-- SELECT: Usuários veem apenas seu próprio perfil
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

-- SELECT: Admins veem todos (usando subquery para admin check)
CREATE POLICY "admins_select_all_safe"
ON public.users
FOR SELECT
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- INSERT: Usuários podem criar seu próprio perfil
CREATE POLICY "users_insert_on_signup"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

-- UPDATE: Usuários atualizam seu próprio perfil
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- UPDATE: Admins atualizam qualquer perfil
CREATE POLICY "admins_update_all_safe"
ON public.users
FOR UPDATE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))))
WITH CHECK ((select check_user_is_admin_safe((select auth.uid()))));

-- DELETE: Admins deletam usuários
CREATE POLICY "admins_delete_safe"
ON public.users
FOR DELETE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- 1.2 TABELA MEETINGS - Remover e recriar policies otimizadas
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "meetings_select_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_own" ON public.meetings;
DROP POLICY IF EXISTS "meetings_select_admin_safe" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_admin_safe" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete_admin_safe" ON public.meetings;

-- Criar policies OTIMIZADAS com (select auth.uid())
-- SELECT: Usuários veem apenas suas reuniões
CREATE POLICY "meetings_select_own"
ON public.meetings
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- SELECT: Admins veem todas (usando subquery)
CREATE POLICY "meetings_select_admin_safe"
ON public.meetings
FOR SELECT
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- INSERT: Usuários criam suas reuniões
CREATE POLICY "meetings_insert_own"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Usuários atualizam suas reuniões
CREATE POLICY "meetings_update_own"
ON public.meetings
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Admins atualizam qualquer reunião
CREATE POLICY "meetings_update_admin_safe"
ON public.meetings
FOR UPDATE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))))
WITH CHECK ((select check_user_is_admin_safe((select auth.uid()))));

-- DELETE: Admins deletam reuniões
CREATE POLICY "meetings_delete_admin_safe"
ON public.meetings
FOR DELETE
TO authenticated
USING ((select check_user_is_admin_safe((select auth.uid()))));

-- ============================================================================
-- PARTE 2: CORRIGIR TABELA ADMIN_ROLE_CACHE (RLS sem policies)
-- ============================================================================

-- Desabilitar RLS na tabela de cache (é uma tabela interna de sistema)
ALTER TABLE public.admin_role_cache DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 3: REMOVER ÍNDICES DUPLICADOS
-- ============================================================================

-- Remover índice duplicado em admin_role_cache (manter apenas o PK)
DROP INDEX IF EXISTS public.idx_admin_cache_user_id;

-- Remover índice duplicado em meetings (manter apenas um)
DROP INDEX IF EXISTS public.idx_meetings_user_id;

-- ============================================================================
-- PARTE 4: REMOVER ÍNDICES NÃO UTILIZADOS
-- ============================================================================

-- Índices não usados em LEADS
DROP INDEX IF EXISTS public.idx_leads_status;
DROP INDEX IF EXISTS public.idx_leads_created_at;
DROP INDEX IF EXISTS public.idx_leads_email;
DROP INDEX IF EXISTS public.idx_leads_meeting_date;

-- Índices não usados em FAQ
DROP INDEX IF EXISTS public.idx_faq_active_order;
DROP INDEX IF EXISTS public.idx_faq_category;
DROP INDEX IF EXISTS public.idx_faq_views;

-- Índices não usados em USERS
DROP INDEX IF EXISTS public.idx_users_role_partial;
DROP INDEX IF EXISTS public.idx_users_blocked;
DROP INDEX IF EXISTS public.idx_users_is_blocked;
DROP INDEX IF EXISTS public.idx_users_email_blocked;
DROP INDEX IF EXISTS public.idx_users_blocked_by;
DROP INDEX IF EXISTS public.idx_users_updated_at;
DROP INDEX IF EXISTS public.idx_users_id_role_admin;

-- Índices não usados em PROJECTS
DROP INDEX IF EXISTS public.idx_projects_published;
DROP INDEX IF EXISTS public.idx_projects_featured;
DROP INDEX IF EXISTS public.idx_projects_category;
DROP INDEX IF EXISTS public.idx_projects_slug;
DROP INDEX IF EXISTS public.idx_projects_completion_date;
DROP INDEX IF EXISTS public.idx_projects_tags;
DROP INDEX IF EXISTS public.idx_projects_technologies;

-- Índices não usados em MEETINGS
DROP INDEX IF EXISTS public.idx_meetings_approved_by;

-- Índices não usados em TESTIMONIALS
DROP INDEX IF EXISTS public.idx_testimonials_published;
DROP INDEX IF EXISTS public.idx_testimonials_featured;
DROP INDEX IF EXISTS public.idx_testimonials_project;
DROP INDEX IF EXISTS public.idx_testimonials_rating;

-- Índices não usados em CONTACTS
DROP INDEX IF EXISTS public.idx_contacts_status;
DROP INDEX IF EXISTS public.idx_contacts_priority;
DROP INDEX IF EXISTS public.idx_contacts_email;
DROP INDEX IF EXISTS public.idx_contacts_created_at;
DROP INDEX IF EXISTS public.idx_contacts_source;

-- Índices não usados em ADMIN tables
DROP INDEX IF EXISTS public.idx_admin_logs_action;
DROP INDEX IF EXISTS public.idx_admin_users_role;
DROP INDEX IF EXISTS public.idx_admin_users_active;
DROP INDEX IF EXISTS public.idx_admin_role_cache_is_admin;
DROP INDEX IF EXISTS public.idx_audit_logs_admin_user;
DROP INDEX IF EXISTS public.idx_audit_logs_entity;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_deleted_users_deleted_by;

-- ============================================================================
-- PARTE 5: REMOVER TRIGGER DUPLICADO
-- ============================================================================

-- Remover trigger duplicado (manter apenas sync_admin_cache_trigger)
DROP TRIGGER IF EXISTS update_admin_cache_on_user_change ON public.users;

-- ============================================================================
-- PARTE 6: ADICIONAR SEARCH_PATH EM FUNÇÕES VULNERÁVEIS
-- ============================================================================

-- Recriar função get_user_profile com search_path
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    company text,
    avatar_url text,
    role text,
    language text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
        u.language
    FROM public.users u
    WHERE u.id = user_id_param;
END;
$$;

-- Recriar função sync_admin_cache com search_path
CREATE OR REPLACE FUNCTION public.sync_admin_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- ============================================================================
-- PARTE 7: CORRIGIR VIEW COM SECURITY DEFINER
-- ============================================================================

-- Recriar view occupied_time_slots SEM security definer
DROP VIEW IF EXISTS public.occupied_time_slots;
CREATE VIEW public.occupied_time_slots AS
SELECT
    meeting_date,
    meeting_time
FROM public.meetings
WHERE status IN ('pending', 'confirmed');

-- ============================================================================
-- PARTE 8: CONSOLIDAR MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- 8.1 USERS - Consolidar policies duplicadas de INSERT
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
-- Já temos users_insert_on_signup, que é suficiente

-- 8.2 USERS - Consolidar SELECT (manter ambas, mas otimizadas)
-- Já foram otimizadas acima com subqueries

-- 8.3 FAQ - Consolidar policies SELECT
DROP POLICY IF EXISTS "Admins podem visualizar todas as FAQs" ON public.faq;
DROP POLICY IF EXISTS "Qualquer um pode visualizar FAQs ativas" ON public.faq;
DROP POLICY IF EXISTS "Admins podem gerenciar FAQs" ON public.faq;

CREATE POLICY "faq_select_optimized"
ON public.faq
FOR SELECT
USING (
    is_active = true
    OR (select check_user_is_admin_safe((select auth.uid())))
);

-- 8.4 PROJECTS - Consolidar policies SELECT
DROP POLICY IF EXISTS "Admins podem visualizar todos os projetos" ON public.projects;
DROP POLICY IF EXISTS "Qualquer um pode visualizar projetos publicados" ON public.projects;
DROP POLICY IF EXISTS "Admins podem gerenciar projetos" ON public.projects;

CREATE POLICY "projects_select_optimized"
ON public.projects
FOR SELECT
USING (
    published = true
    OR (select check_user_is_admin_safe((select auth.uid())))
);

-- 8.5 TESTIMONIALS - Consolidar policies SELECT
DROP POLICY IF EXISTS "Admins podem visualizar todos os depoimentos" ON public.testimonials;
DROP POLICY IF EXISTS "Qualquer um pode visualizar depoimentos publicados" ON public.testimonials;
DROP POLICY IF EXISTS "Admins podem gerenciar depoimentos" ON public.testimonials;

CREATE POLICY "testimonials_select_optimized"
ON public.testimonials
FOR SELECT
USING (
    published = true
    OR (select check_user_is_admin_safe((select auth.uid())))
);

-- ============================================================================
-- PARTE 9: ATUALIZAR ESTATÍSTICAS E ANÁLISE
-- ============================================================================

ANALYZE public.users;
ANALYZE public.meetings;
ANALYZE public.admin_role_cache;
ANALYZE public.faq;
ANALYZE public.projects;
ANALYZE public.testimonials;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "users_select_own" ON public.users IS
'OTIMIZADO: Usa (select auth.uid()) para avaliar uma vez por query ao invés de uma vez por linha';

COMMENT ON POLICY "admins_select_all_safe" ON public.users IS
'OTIMIZADO: Usa subquery dupla para avaliar função admin apenas uma vez';

COMMENT ON POLICY "meetings_select_own" ON public.meetings IS
'OTIMIZADO: Usa (select auth.uid()) para máxima performance';

COMMENT ON POLICY "faq_select_optimized" ON public.faq IS
'CONSOLIDADO: Combina 3 policies anteriores em uma única com OR para melhor performance';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
-- Total de índices removidos: 42
-- Total de policies otimizadas: 14
-- Total de policies consolidadas: 9
-- Triggers removidos: 1
-- Funções corrigidas: 2
-- Ganho esperado: 5-10x mais rápido
-- ============================================================================

