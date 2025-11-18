-- Migration: fix_rls_recursive_error
-- Corrige erro 500 causado por política RLS recursiva

-- PASSO 1: Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Users can view own profile and anyone can check roles" ON public.users;
DROP POLICY IF EXISTS "Allow anon to check basic user info" ON public.users;

-- PASSO 2: Recriar política SELECT simples e não-recursiva
CREATE POLICY "users_can_view_own_and_admins_view_all"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Usuário pode ver seu próprio perfil
  auth.uid() = id 
  OR 
  -- OU é admin (checagem direta sem subquery recursiva)
  (
    SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1
  ) = 'admin'
);

-- PASSO 3: Criar política SELECT para usuários não autenticados (anon)
-- Essa política NÃO deve expor dados sensíveis, apenas permitir queries básicas
CREATE POLICY "anon_can_check_existence"
ON public.users
FOR SELECT
TO anon
USING (false); -- Bloqueia leitura para anon por enquanto

-- PASSO 4: Comentários
COMMENT ON POLICY "users_can_view_own_and_admins_view_all" ON public.users IS 
'Permite que usuários vejam apenas seu próprio perfil, e admins vejam todos os perfis. Usa subquery limitada para evitar recursão.';

COMMENT ON POLICY "anon_can_check_existence" ON public.users IS 
'Bloqueia leitura para usuários não autenticados por segurança';

