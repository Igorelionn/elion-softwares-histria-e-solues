-- Migration: Fix RLS Infinite Recursion on Users Table
-- Date: 2025-11-05
-- Description: Remove recursive RLS policies and create is_admin() helper function with SECURITY DEFINER

-- Step 1: Drop recursive policies that cause infinite loop
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Step 2: Create is_admin() helper function with SECURITY DEFINER
-- This function bypasses RLS to check user role, breaking the recursion cycle
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Query direta sem RLS (SECURITY DEFINER bypassa RLS)
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Step 3: Create consolidated policies using is_admin()

-- Política de SELECT: Admin vê tudo, usuário vê só seu perfil
CREATE POLICY "Users and admins can view profiles" ON public.users
  FOR SELECT 
  TO authenticated
  USING (
    is_admin() = true OR (select auth.uid()) = id
  );

-- Política de UPDATE: Admin atualiza tudo, usuário só seu perfil (se não bloqueado)
CREATE POLICY "Users and admins can update profiles" ON public.users
  FOR UPDATE 
  TO authenticated
  USING (
    is_admin() = true OR ((select auth.uid()) = id AND is_blocked = false)
  )
  WITH CHECK (
    is_admin() = true OR ((select auth.uid()) = id AND is_blocked = false)
  );

-- Política de DELETE: Apenas admin
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE 
  TO authenticated
  USING (is_admin() = true);

-- Step 4: Drop old user policies that are now consolidated
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Step 5: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Notes:
-- The is_admin() function uses SECURITY DEFINER which executes with owner privileges,
-- bypassing RLS and preventing infinite recursion when checking user roles.
-- This is safe because it only returns a boolean and doesn't expose sensitive data.

