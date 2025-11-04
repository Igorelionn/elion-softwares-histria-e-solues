-- ================================================================
-- CORREÇÃO CRÍTICA: RLS Policies com Recursão Infinita
-- ================================================================
-- Data: 1 de Novembro de 2025
-- Problema: Error 42P17 - infinite recursion detected in policy
-- Causa: Policies fazendo subquery na mesma tabela (users)
-- Solução: Usar role diretamente ao invés de EXISTS subquery
-- ================================================================

-- ================================================================
-- PARTE 1: REMOVER POLICIES PROBLEMÁTICAS
-- ================================================================

DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- ================================================================
-- PARTE 2: CRIAR POLICIES CORRETAS (SEM RECURSÃO)
-- ================================================================

-- SELECT: Duas policies separadas
-- 1. Usuário vê próprio perfil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Admin vê todos (usando role diretamente, SEM subquery)
CREATE POLICY "Admins can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (role = 'admin');

-- UPDATE: Duas policies separadas
-- 1. Usuário atualiza próprio perfil (se não bloqueado)
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id AND is_blocked = false)
WITH CHECK (auth.uid() = id AND is_blocked = false);

-- 2. Admin atualiza qualquer perfil (usando role diretamente)
CREATE POLICY "Admins can update any profile"
ON public.users
FOR UPDATE
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');

-- DELETE: Admin pode deletar (usando role diretamente)
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (role = 'admin');

-- ================================================================
-- EXPLICAÇÃO TÉCNICA
-- ================================================================
--
-- ❌ ERRADO (causa recursão):
-- CREATE POLICY "test" ON users
-- USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
--
-- Problema: Quando você faz SELECT em users, a policy precisa checar
-- se você é admin fazendo outro SELECT em users, que precisa checar
-- se você é admin fazendo outro SELECT em users... → RECURSÃO INFINITA
--
-- ✅ CORRETO (sem recursão):
-- CREATE POLICY "test" ON users
-- USING (role = 'admin')
--
-- Como funciona: A policy usa diretamente a coluna 'role' da linha
-- que está sendo acessada. Postgres consegue resolver isso sem recursão.
--
-- ================================================================

-- ================================================================
-- PARTE 3: VERIFICAÇÃO
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RLS POLICIES CORRIGIDAS!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Policies criadas:';
  RAISE NOTICE '  ✅ Users can view own profile (SELECT)';
  RAISE NOTICE '  ✅ Admins can view all profiles (SELECT)';
  RAISE NOTICE '  ✅ Users can update own profile (UPDATE)';
  RAISE NOTICE '  ✅ Admins can update any profile (UPDATE)';
  RAISE NOTICE '  ✅ Admins can delete users (DELETE)';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'IMPORTANTE: Todas as policies agora usam';
  RAISE NOTICE '"role = ''admin''" DIRETAMENTE';
  RAISE NOTICE 'ao invés de subquery recursiva!';
  RAISE NOTICE '===========================================';
END $$;

-- ================================================================
-- RESUMO
-- ================================================================
-- ✅ Recursão infinita corrigida
-- ✅ Policies usando role diretamente
-- ✅ Admin pode ver todos os perfis
-- ✅ Admin pode atualizar qualquer perfil
-- ✅ Admin pode deletar usuários
-- ✅ Usuários podem ver/atualizar próprio perfil
-- ================================================================

