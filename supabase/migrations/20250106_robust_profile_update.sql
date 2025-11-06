-- Migration: Função segura de update de perfil com optimistic locking
-- Data: 2025-01-06

-- Adicionar coluna version se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Criar índices otimizados para queries frequentes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked) WHERE is_blocked = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);

-- Função para update seguro de perfil com lock otimista
CREATE OR REPLACE FUNCTION safe_update_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_company TEXT,
  p_avatar_url TEXT,
  p_expected_version BIGINT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_version BIGINT,
  error_message TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version BIGINT;
  v_new_version BIGINT;
BEGIN
  -- Obter versão atual com lock pessimista (previne updates concorrentes)
  SELECT version INTO v_current_version
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Verificar conflito de versão (optimistic lock)
  IF p_expected_version IS NOT NULL AND 
     v_current_version != p_expected_version THEN
    RETURN QUERY SELECT 
      FALSE, 
      v_current_version, 
      'Dados foram modificados por outra operação'::TEXT;
    RETURN;
  END IF;
  
  -- Incrementar versão
  v_new_version := COALESCE(v_current_version, 0) + 1;
  
  -- Atualizar dados
  UPDATE users
  SET
    full_name = p_full_name,
    company = p_company,
    avatar_url = p_avatar_url,
    version = v_new_version,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Verificar se update foi bem-sucedido
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      0::BIGINT, 
      'Usuário não encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Retornar sucesso
  RETURN QUERY SELECT 
    TRUE, 
    v_new_version, 
    NULL::TEXT;
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION safe_update_profile IS 'Atualiza perfil de usuário com lock otimista para prevenir conflitos de concorrência';
COMMENT ON COLUMN users.version IS 'Versão do registro para controle de concorrência otimista';

