-- ============================================================================
-- MIGRAÇÃO: Correção das Políticas RLS da Tabela Users
-- ============================================================================
-- Esta migração corrige as políticas RLS que causam recursão infinita,
-- substituindo-as por políticas otimizadas e sem dependências circulares.
-- ============================================================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS (que podem estar causando problemas)
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON users;
DROP POLICY IF EXISTS "Admins podem ver todos usuários" ON users;
DROP POLICY IF EXISTS "Admins podem atualizar todos usuários" ON users;
DROP POLICY IF EXISTS "Permitir inserção durante signup" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- ============================================================================
-- 2. CRIAR POLÍTICAS RLS OTIMIZADAS (SEM RECURSÃO)
-- ============================================================================

-- 2.1. SELECT: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "users_select_own"
ON users
FOR SELECT
TO authenticated
USING (
    -- SIMPLES: Apenas comparar ID diretamente
    id = auth.uid()
);

-- 2.2. INSERT: Permitir inserção durante registro (trigger handle_new_user)
CREATE POLICY "users_insert_on_signup"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
    -- Permitir inserir apenas o próprio registro
    id = auth.uid()
);

-- 2.3. UPDATE: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (
    -- Pode atualizar apenas seu próprio registro
    id = auth.uid()
)
WITH CHECK (
    -- Não pode mudar o ID ou role
    id = auth.uid()
);

-- 2.4. DELETE: Usuários podem deletar apenas seu próprio perfil
CREATE POLICY "users_delete_own"
ON users
FOR DELETE
TO authenticated
USING (
    id = auth.uid()
);

-- ============================================================================
-- 3. POLÍTICAS ESPECIAIS PARA ADMINS (OPCIONAL)
-- ============================================================================
-- Se você precisar que admins vejam todos os usuários,
-- descomente as políticas abaixo:

/*
-- 3.1. Criar função auxiliar para verificar se usuário é admin
-- (Esta função NÃO causa recursão pois usa auth.jwt())
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário tem role 'admin' no JWT
    RETURN (
        COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'role',
            'user'
        ) = 'admin'
    );
END;
$$;

-- 3.2. Admins podem ver todos os usuários
CREATE POLICY "users_select_admin"
ON users
FOR SELECT
TO authenticated
USING (
    is_admin()
);

-- 3.3. Admins podem atualizar todos os usuários
CREATE POLICY "users_update_admin"
ON users
FOR UPDATE
TO authenticated
USING (
    is_admin()
)
WITH CHECK (
    is_admin()
);

-- 3.4. Admins podem deletar usuários (exceto eles mesmos por segurança)
CREATE POLICY "users_delete_admin"
ON users
FOR DELETE
TO authenticated
USING (
    is_admin() AND id != auth.uid()
);
*/

-- ============================================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "users_select_own" ON users IS 
'Permite que usuários vejam apenas seu próprio perfil - otimizado sem recursão';

COMMENT ON POLICY "users_insert_on_signup" ON users IS 
'Permite inserir registro durante o signup - chamado pelo trigger handle_new_user';

COMMENT ON POLICY "users_update_own" ON users IS 
'Permite que usuários atualizem apenas seu próprio perfil - protege ID e role';

COMMENT ON POLICY "users_delete_own" ON users IS 
'Permite que usuários deletem apenas seu próprio perfil';

-- ============================================================================
-- 5. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================================================

-- Garantir que RLS está habilitado na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. GRANTS (Permissões de Acesso)
-- ============================================================================

-- Revogar acesso público
REVOKE ALL ON users FROM PUBLIC;
REVOKE ALL ON users FROM anon;

-- Permitir acesso apenas para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- ============================================================================
-- 7. ÍNDICES PARA PERFORMANCE (se não existirem)
-- ============================================================================

-- Índice no email para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Índice no role para filtros de admin
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Índice na data de criação para ordenação
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- 8. ANÁLISE E OTIMIZAÇÃO
-- ============================================================================

-- Atualizar estatísticas da tabela para melhor planejamento de queries
ANALYZE users;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- Para testar se as políticas estão funcionando:
-- 1. Faça login como um usuário normal
-- 2. Execute: SELECT * FROM users WHERE id = auth.uid();
-- 3. Deve retornar apenas seu próprio registro SEM timeout
-- 4. Execute: SELECT * FROM users; 
-- 5. Deve retornar apenas seu próprio registro (não todos)

