'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthState } from '@/stores/authStore'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('USE_AUTH')

interface BlockDetails {
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
  blocked_by_email: string | null
  blocked_by_name: string | null
}

/**
 * Hook de autenticação refatorado
 * Agora consome o authStore centralizado
 * Mantém apenas a lógica de verificação de bloqueio
 */
export function useAuth() {
  // Consumir estado do authStore
  const { user, isLoading: loading, error: authError } = useAuthState()
  
  // Estado local apenas para bloqueio (específico deste hook)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockDetails, setBlockDetails] = useState<BlockDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  
  // Sincronizar erro do authStore
  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  /**
   * Função para verificar se o usuário está bloqueado ou deletado
   * Esta é a única lógica que permanece neste hook
   */
  const checkUserBlock = async (userId: string): Promise<boolean> => {
    try {
      log.debug('Verificando bloqueio', { userId })
      
      // 1. PRIMEIRO: Verificar se está na blacklist (deletado permanentemente)
      const { data: blacklistData, error: blacklistError } = await (supabase
        // @ts-ignore - is_user_in_blacklist RPC function exists in database
        .rpc('is_user_in_blacklist', { check_user_id: userId }) as unknown as Promise<{ data: { blacklisted: boolean } | null; error: any }>)
      
      if (!blacklistError && blacklistData && blacklistData.blacklisted === true) {
        log.warn('Usuário na blacklist, deslogando')
        setIsBlocked(true)
        
        // Deslogar IMEDIATAMENTE
        await supabase.auth.signOut()
        
        // Redirecionar para home
        router.push('/')
        return true
      }

      // 2. Verificar se o usuário ainda existe (não foi deletado)
      const { data: existsData, error: existsError } = await (supabase
        // @ts-ignore - check_user_exists RPC function exists in database
        .rpc('check_user_exists', { user_id_param: userId }) as unknown as Promise<{ data: { deleted: boolean } | null; error: any }>)
      
      if (!existsError && existsData && existsData.deleted === true) {
        log.warn('Usuário deletado, deslogando')
        setIsBlocked(true)
        
        // Deslogar usuário deletado IMEDIATAMENTE
        await supabase.auth.signOut()
        
        // Redirecionar para home
        router.push('/')
        return true
      }

      // 3. Verificar se o usuário está bloqueado
      const { data, error } = await (supabase
        // @ts-ignore - check_user_can_login RPC function exists in database
        .rpc('check_user_can_login', { user_id_param: userId }) as unknown as Promise<{ 
          data: { 
            is_blocked: boolean
            blocked_reason?: string
            blocked_at?: string
          } | null
          error: any 
        }>)
      
      if (error) {
        log.error('Erro ao verificar bloqueio', error)
        return false
      }

      // Se o usuário está bloqueado
      if (data && data.is_blocked === true) {
        log.warn('Usuário bloqueado, redirecionando')
        setIsBlocked(true)
        setBlockDetails({
          is_blocked: true,
          blocked_reason: data.blocked_reason || null,
          blocked_at: data.blocked_at || null,
          blocked_by_email: null,
          blocked_by_name: null
        })
        
        // Deslogar usuário bloqueado IMEDIATAMENTE
        await supabase.auth.signOut()
        
        // Redirecionar para página de bloqueio
        router.push('/conta-bloqueada')
        return true
      }
      
      setIsBlocked(false)
      return false
    } catch (err) {
      log.error('Erro ao verificar bloqueio', err)
      return false
    }
  }

  // Verificar bloqueio quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      log.debug('Usuário mudou, verificando bloqueio')
      checkUserBlock(user.id)
    }
  }, [user?.id])

  return { user, loading, error, isBlocked, blockDetails }
}

