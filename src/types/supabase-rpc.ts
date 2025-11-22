/**
 * ============================================================================
 * TIPOS CUSTOMIZADOS: Funções RPC do Supabase
 * ============================================================================
 * Este arquivo define tipos TypeScript para as funções RPC personalizadas
 * criadas no banco de dados Supabase.
 * ============================================================================
 */

// Tipo de retorno da função get_my_profile()
export interface GetMyProfileResult {
  id: string
  email: string
  full_name: string
  company: string
  avatar_url: string
  role: 'user' | 'admin'
  language: string
  created_at: string
  updated_at: string
  is_admin: boolean
}

// Parâmetros da função update_my_profile()
export interface UpdateMyProfileParams {
  p_full_name?: string | null
  p_company?: string | null
  p_avatar_url?: string | null
  p_language?: string | null
}

// Tipo de retorno da função update_my_profile()
export interface UpdateMyProfileResult {
  id: string
  email: string
  full_name: string
  company: string
  avatar_url: string
  role: 'user' | 'admin'
  language: string
  updated_at: string
}

// Tipo de retorno da função check_is_admin()
export type CheckIsAdminResult = boolean

// Extensão do tipo Database do Supabase com nossas funções RPC
export interface SupabaseRPCFunctions {
  get_my_profile: {
    Args: Record<string, never> // Sem argumentos
    Returns: GetMyProfileResult[]
  }
  update_my_profile: {
    Args: UpdateMyProfileParams
    Returns: UpdateMyProfileResult[]
  }
  check_is_admin: {
    Args: Record<string, never> // Sem argumentos
    Returns: CheckIsAdminResult
  }
}

