-- ================================================================
-- CORREÇÃO FINAL: Acesso Admin + Simplificação de Bloqueio
-- ================================================================
-- Data: 1 de Novembro de 2025
-- Problema: Admin não consegue acessar painel (igorelion8@gmail.com)
-- Causa: RLS policy bloqueando SELECT do próprio perfil
-- ================================================================

-- ================================================================
-- PARTE 1: CORRIGIR RLS PARA ADMINS VEREM PRÓPRIO PERFIL
-- ================================================================

-- Remove policies antigas que estão causando o problema
DROP POLICY IF EXISTS "Non-blocked users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;

-- Policy CORRETA para SELECT
-- Permite que:
-- 1. Qualquer usuário autenticado veja o próprio perfil (MESMO SE BLOQUEADO)
--    → Isso permite que useAdmin e HeroHeader detectem role='admin'
-- 2. Admins vejam todos os perfis
CREATE POLICY "Users and admins can view profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Qualquer um vê o próprio perfil (mesmo se bloqueado)
  auth.uid() = id
  OR
  -- Admins veem todos
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- ================================================================
-- PARTE 2: CORRIGIR RLS PARA ADMINS ATUALIZAREM USUÁRIOS
-- ================================================================

-- Remove policy antiga de UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user profile" ON public.users;
DROP POLICY IF EXISTS "Non-blocked users can update own profile" ON public.users;

-- Policy CORRETA para UPDATE
-- Permite que:
-- 1. Admin atualize qualquer perfil (para poder bloquear/desbloquear)
-- 2. Usuário normal atualize próprio perfil SE não estiver bloqueado
CREATE POLICY "Users and admins can update profiles"
ON public.users
FOR UPDATE
TO authenticated
USING (
  -- Admin pode atualizar qualquer um
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
  OR
  -- Usuário normal só atualiza se não bloqueado
  (auth.uid() = id AND is_blocked = false)
)
WITH CHECK (
  -- Admin pode atualizar qualquer um
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
  OR
  -- Usuário normal só atualiza se não bloqueado
  (auth.uid() = id AND is_blocked = false)
);

-- ================================================================
-- PARTE 3: GARANTIR QUE ADMIN IGORELION8@GMAIL.COM ESTÁ CORRETO
-- ================================================================

-- Verifica e corrige o admin principal
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Busca o ID do admin pelo email
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'igorelion8@gmail.com';
  
  -- Se encontrou, garante que está como admin
  IF admin_id IS NOT NULL THEN
    UPDATE public.users
    SET 
      role = 'admin',
      is_blocked = false
    WHERE id = admin_id;
    
    RAISE NOTICE 'Admin igorelion8@gmail.com configurado corretamente!';
  ELSE
    RAISE NOTICE 'Admin igorelion8@gmail.com não encontrado no auth.users';
  END IF;
END $$;

-- ================================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ================================================================

-- Mostra o status do admin
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT u.id, u.email, u.role, u.is_blocked
  INTO admin_record
  FROM auth.users au
  JOIN public.users u ON u.id = au.id
  WHERE au.email = 'igorelion8@gmail.com';
  
  IF FOUND THEN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'STATUS DO ADMIN:';
    RAISE NOTICE 'Email: %', admin_record.email;
    RAISE NOTICE 'Role: %', admin_record.role;
    RAISE NOTICE 'Bloqueado: %', admin_record.is_blocked;
    RAISE NOTICE '===========================================';
  END IF;
END $$;

-- ================================================================
-- RESUMO
-- ================================================================
-- ✅ RLS SELECT: Permite admin ver próprio perfil
-- ✅ RLS UPDATE: Permite admin atualizar outros usuários
-- ✅ Admin principal: igorelion8@gmail.com configurado
-- ✅ Bloqueio removido (se existia)
-- ================================================================

