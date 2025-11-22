/**
 * ============================================================================
 * MÓDULO: Profile RPC - Acesso Seguro ao Perfil via RPC
 * ============================================================================
 * Este módulo fornece funções para acessar e atualizar o perfil do usuário
 * usando RPC (Remote Procedure Call) do Supabase, evitando problemas de RLS.
 * 
 * VANTAGENS:
 * - ⚡ Rápido: Bypassa políticas RLS problemáticas
 * - 🔒 Seguro: Validação no servidor (SECURITY DEFINER)
 * - 🎯 Confiável: Sem timeouts ou recursão infinita
 * - 💪 Simples: API limpa e fácil de usar
 * ============================================================================
 */

import { supabase } from './supabase'

// ============================================================================
// TIPOS
// ============================================================================

export interface Profile {
  id: string
  email: string
  full_name: string
  company: string
  avatar_url: string
  role: 'user' | 'admin'
  language: string
  created_at: string
  updated_at: string
  is_admin: boolean // ✨ NOVO: Campo otimizado do banco
}

export interface ProfileUpdateParams {
  full_name?: string
  company?: string
  avatar_url?: string
  language?: string
}

// ============================================================================
// FUNÇÃO: Buscar Perfil via RPC
// ============================================================================

/**
 * Busca o perfil do usuário autenticado usando RPC seguro.
 * 
 * @returns Profile ou null se não encontrado
 * @throws Error se ocorrer erro na chamada RPC
 * 
 * @example
 * ```typescript
 * const profile = await getProfileViaRPC()
 * if (profile) {
 *   console.log('Nome:', profile.full_name)
 * }
 * ```
 */
export async function getProfileViaRPC(): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_my_profile')
      .single()

    if (error) {
      console.error('[PROFILE-RPC] Erro ao buscar perfil:', error)
      throw new Error(`Erro ao buscar perfil: ${error.message}`)
    }

    if (!data) {
      console.warn('[PROFILE-RPC] Nenhum perfil encontrado')
      return null
    }

    return data as Profile
  } catch (err: any) {
    console.error('[PROFILE-RPC] Exceção ao buscar perfil:', err)
    throw err
  }
}

/**
 * Busca o perfil do usuário com timeout configurável.
 * 
 * @param timeoutMs - Timeout em milissegundos (padrão: 5000ms)
 * @returns Profile ou null se timeout/não encontrado
 * 
 * @example
 * ```typescript
 * const profile = await getProfileWithTimeout(3000) // 3 segundos
 * ```
 */
export async function getProfileWithTimeout(
  timeoutMs: number = 5000
): Promise<Profile | null> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
  )

  try {
    const result = await Promise.race([
      getProfileViaRPC(),
      timeoutPromise
    ])
    return result
  } catch (err: any) {
    if (err.message?.includes('Timeout')) {
      console.warn('[PROFILE-RPC] Timeout ao buscar perfil')
      return null
    }
    throw err
  }
}

// ============================================================================
// FUNÇÃO: Atualizar Perfil via RPC
// ============================================================================

/**
 * Atualiza o perfil do usuário autenticado usando RPC seguro.
 * 
 * @param params - Campos a atualizar (apenas os fornecidos serão atualizados)
 * @returns Profile atualizado ou null se erro
 * 
 * @example
 * ```typescript
 * const updated = await updateProfileViaRPC({
 *   full_name: 'João Silva',
 *   company: 'Empresa X'
 * })
 * ```
 */
export async function updateProfileViaRPC(
  params: ProfileUpdateParams
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .rpc('update_my_profile', {
        p_full_name: params.full_name ?? null,
        p_company: params.company ?? null,
        p_avatar_url: params.avatar_url ?? null,
        p_language: params.language ?? null
      })
      .single()

    if (error) {
      console.error('[PROFILE-RPC] Erro ao atualizar perfil:', error)
      throw new Error(`Erro ao atualizar perfil: ${error.message}`)
    }

    if (!data) {
      console.warn('[PROFILE-RPC] Nenhum perfil retornado após atualização')
      return null
    }

    return data as Profile
  } catch (err: any) {
    console.error('[PROFILE-RPC] Exceção ao atualizar perfil:', err)
    throw err
  }
}

/**
 * Atualiza o perfil com timeout configurável.
 * 
 * @param params - Campos a atualizar
 * @param timeoutMs - Timeout em milissegundos (padrão: 5000ms)
 * @returns Profile atualizado ou null se timeout/erro
 * 
 * @example
 * ```typescript
 * const updated = await updateProfileWithTimeout({
 *   full_name: 'João Silva'
 * }, 3000)
 * ```
 */
export async function updateProfileWithTimeout(
  params: ProfileUpdateParams,
  timeoutMs: number = 5000
): Promise<Profile | null> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
  )

  try {
    const result = await Promise.race([
      updateProfileViaRPC(params),
      timeoutPromise
    ])
    return result
  } catch (err: any) {
    if (err.message?.includes('Timeout')) {
      console.warn('[PROFILE-RPC] Timeout ao atualizar perfil')
      return null
    }
    throw err
  }
}

// ============================================================================
// FUNÇÃO: Sincronizar user_metadata com banco de dados
// ============================================================================

/**
 * Sincroniza dados do user_metadata com a tabela users usando RPC.
 * Útil para garantir consistência após login.
 * 
 * @param session - Sessão do Supabase Auth
 * @returns true se sincronizado com sucesso, false caso contrário
 * 
 * @example
 * ```typescript
 * const { data: { session } } = await supabase.auth.getSession()
 * if (session) {
 *   await syncUserMetadataWithDatabase(session)
 * }
 * ```
 */
export async function syncUserMetadataWithDatabase(
  session: any
): Promise<boolean> {
  if (!session?.user) return false

  try {
    const metadata = session.user.user_metadata || {}
    
    // Atualizar apenas se houver dados no metadata
    if (!metadata.full_name && !metadata.company && !metadata.avatar_url) {
      console.log('[PROFILE-RPC] Nenhum dado no user_metadata para sincronizar')
      return true // Não é erro, apenas não há nada para sincronizar
    }

    const result = await updateProfileViaRPC({
      full_name: metadata.full_name,
      company: metadata.company,
      avatar_url: metadata.avatar_url,
      language: metadata.language
    })

    return result !== null
  } catch (err) {
    console.error('[PROFILE-RPC] Erro ao sincronizar user_metadata:', err)
    return false
  }
}

// ============================================================================
// FUNÇÃO AUXILIAR: Verificar se RPC está disponível
// ============================================================================

/**
 * Verifica se as funções RPC estão disponíveis no banco de dados.
 * Útil para debug e verificação de migração.
 * 
 * @returns true se RPCs estão disponíveis, false caso contrário
 */
export async function checkRPCAvailability(): Promise<boolean> {
  try {
    await supabase.rpc('get_my_profile')
    console.log('[PROFILE-RPC] ✅ Funções RPC disponíveis')
    return true
  } catch (err: any) {
    if (err.message?.includes('not found') || err.message?.includes('does not exist')) {
      console.error('[PROFILE-RPC] ❌ Funções RPC não encontradas. Execute a migração SQL primeiro.')
      return false
    }
    // Outro erro pode significar que a função existe mas falhou por outro motivo
    console.warn('[PROFILE-RPC] ⚠️ Erro ao verificar RPCs (mas podem estar disponíveis):', err)
    return true
  }
}

// ============================================================================
// FUNÇÃO: Verificar se é Admin (ULTRA-RÁPIDO)
// ============================================================================

/**
 * Verifica rapidamente se o usuário autenticado é admin.
 * Usa cache otimizado no banco de dados para máxima performance.
 * 
 * @returns true se é admin, false caso contrário
 * 
 * @example
 * ```typescript
 * const isAdmin = await checkIsAdminFast()
 * if (isAdmin) {
 *   console.log('Usuário é administrador')
 * }
 * ```
 */
export async function checkIsAdminFast(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_is_admin')

    if (error) {
      console.error('[PROFILE-RPC] Erro ao verificar admin:', error)
      return false
    }

    return data === true
  } catch (err: any) {
    console.error('[PROFILE-RPC] Exceção ao verificar admin:', err)
    return false
  }
}

/**
 * Verifica se é admin com timeout configurável.
 * 
 * @param timeoutMs - Timeout em milissegundos (padrão: 2000ms)
 * @returns true se é admin, false caso contrário ou timeout
 * 
 * @example
 * ```typescript
 * const isAdmin = await checkIsAdminWithTimeout(1000) // 1 segundo
 * ```
 */
export async function checkIsAdminWithTimeout(
  timeoutMs: number = 2000
): Promise<boolean> {
  const timeoutPromise = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), timeoutMs)
  )

  try {
    const result = await Promise.race([
      checkIsAdminFast(),
      timeoutPromise
    ])
    return result
  } catch (err: any) {
    console.warn('[PROFILE-RPC] Timeout ao verificar admin')
    return false
  }
}

