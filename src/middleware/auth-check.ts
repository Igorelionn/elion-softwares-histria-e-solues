import { supabase } from '@/lib/supabase'

export interface UserBlockStatus {
  isBlocked: boolean
  blockDetails?: {
    blocked_reason: string | null
    blocked_at: string | null
    blocked_by_email: string | null
    blocked_by_name: string | null
  }
}

/**
 * Verifica se um usuário está bloqueado
 * @param userId - ID do usuário a ser verificado
 * @returns Status de bloqueio do usuário
 */
export async function checkUserBlockStatus(userId: string): Promise<UserBlockStatus> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_block_details', { user_id_param: userId })
    
    if (error) {
      console.error('Erro ao verificar bloqueio:', error)
      return { isBlocked: false }
    }

    if (data && data.length > 0) {
      const blockInfo = data[0]
      
      if (blockInfo.is_blocked) {
        return {
          isBlocked: true,
          blockDetails: {
            blocked_reason: blockInfo.blocked_reason,
            blocked_at: blockInfo.blocked_at,
            blocked_by_email: blockInfo.blocked_by_email,
            blocked_by_name: blockInfo.blocked_by_name
          }
        }
      }
    }
    
    return { isBlocked: false }
  } catch (err) {
    console.error('Erro ao verificar bloqueio:', err)
    return { isBlocked: false }
  }
}

/**
 * Hook para proteger páginas e verificar bloqueio
 * Deve ser usado em páginas protegidas que requerem autenticação
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return {
      authenticated: false,
      blocked: false,
      redirect: '/'
    }
  }

  const blockStatus = await checkUserBlockStatus(session.user.id)
  
  if (blockStatus.isBlocked) {
    // Deslogar usuário bloqueado
    await supabase.auth.signOut()
    
    return {
      authenticated: false,
      blocked: true,
      redirect: '/conta-bloqueada',
      blockDetails: blockStatus.blockDetails
    }
  }

  return {
    authenticated: true,
    blocked: false,
    user: session.user
  }
}

