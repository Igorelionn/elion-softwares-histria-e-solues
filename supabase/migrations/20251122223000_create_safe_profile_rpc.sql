-- ============================================================================
-- MIGRAÇÃO: Função RPC Segura para Buscar Perfil
-- ============================================================================
-- Esta função RPC é executada com privilégios de SECURITY DEFINER,
-- contornando as políticas RLS problemáticas da tabela users.
-- Ela é segura porque valida que o usuário só pode ver seu próprio perfil.
-- ============================================================================

-- 1. Criar função RPC segura para buscar perfil do usuário autenticado
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    company text,
    avatar_url text,
    role text,
    language text,
    created_at timestamptz,
    updated_at timestamptz
) 
SECURITY DEFINER -- Executa com privilégios do dono (bypassa RLS)
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validação: Usuário deve estar autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Retornar dados do perfil do usuário autenticado
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.company,
        u.avatar_url,
        u.role,
        u.language,
        u.created_at,
        u.updated_at
    FROM users u
    WHERE u.id = auth.uid(); -- Sempre retorna apenas dados do usuário autenticado
END;
$$;

-- 2. Comentário explicativo
COMMENT ON FUNCTION get_my_profile() IS 
'Retorna o perfil do usuário autenticado de forma segura, contornando problemas de RLS';

-- 3. Revogar acesso público e permitir apenas para usuários autenticados
REVOKE ALL ON FUNCTION get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;

-- ============================================================================
-- FUNÇÃO ADICIONAL: Atualizar perfil de forma segura
-- ============================================================================

CREATE OR REPLACE FUNCTION update_my_profile(
    p_full_name text DEFAULT NULL,
    p_company text DEFAULT NULL,
    p_avatar_url text DEFAULT NULL,
    p_language text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    company text,
    avatar_url text,
    role text,
    language text,
    updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validação: Usuário deve estar autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Atualizar apenas os campos fornecidos
    UPDATE users
    SET 
        full_name = COALESCE(p_full_name, users.full_name),
        company = COALESCE(p_company, users.company),
        avatar_url = COALESCE(p_avatar_url, users.avatar_url),
        language = COALESCE(p_language, users.language),
        updated_at = NOW()
    WHERE users.id = auth.uid();

    -- Retornar dados atualizados
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.company,
        u.avatar_url,
        u.role,
        u.language,
        u.updated_at
    FROM users u
    WHERE u.id = auth.uid();
END;
$$;

COMMENT ON FUNCTION update_my_profile(text, text, text, text) IS 
'Atualiza o perfil do usuário autenticado de forma segura, contornando problemas de RLS';

REVOKE ALL ON FUNCTION update_my_profile(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_profile(text, text, text, text) TO authenticated;

-- ============================================================================
-- TESTE (Opcional - executar apenas em desenvolvimento)
-- ============================================================================
-- Para testar a função:
-- SELECT * FROM get_my_profile();
-- SELECT * FROM update_my_profile(p_full_name := 'Novo Nome', p_company := 'Nova Empresa');

