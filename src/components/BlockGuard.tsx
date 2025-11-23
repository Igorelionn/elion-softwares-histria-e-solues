'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Componente que verifica se o usuário está bloqueado
 * em TODAS as mudanças de autenticação e sessão
 */
export function BlockGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)

  const checkBlockStatus = async (userId: string) => {
    try {
      // 1. PRIMEIRO: Verificar se está na blacklist (deletado permanentemente)
      const { data: blacklistData, error: blacklistError } = await (supabase
        // @ts-ignore - is_user_in_blacklist RPC function exists in database
        .rpc('is_user_in_blacklist', { check_user_id: userId }) as unknown as Promise<{ data: { blacklisted: boolean } | null; error: any }>)
      
      if (!blacklistError && blacklistData && blacklistData.blacklisted === true) {
                setIsBlocked(true)
        
        // Deslogar IMEDIATAMENTE
        await supabase.auth.signOut()
        
        // Redirecionar para home
        if (pathname !== '/conta-deletada') {
          router.push('/')
        }
        
        return true
      }

      // 2. Verificar se o usuário ainda existe (não foi deletado)
      const { data: existsData, error: existsError } = await (supabase
        // @ts-ignore - check_user_exists RPC function exists in database
        .rpc('check_user_exists', { user_id_param: userId }) as unknown as Promise<{ data: { deleted: boolean } | null; error: any }>)
      
      if (!existsError && existsData && existsData.deleted === true) {
                setIsBlocked(true)
        
        // Deslogar o usuário deletado
        await supabase.auth.signOut()
        
        // Redirecionar para home com mensagem
        if (pathname !== '/') {
          router.push('/')
        }
        
        return true
      }

      // 3. Verificar se o usuário está bloqueado
      const { data, error } = await (supabase
        // @ts-ignore - check_user_can_login RPC function exists in database
        .rpc('check_user_can_login', { user_id_param: userId }) as unknown as Promise<{ data: { is_blocked: boolean } | null; error: any }>)
      
      if (error) {
        console.error('Erro ao verificar bloqueio:', error)
        return false
      }

      // Se o usuário está bloqueado
      if (data && data.is_blocked === true) {
                setIsBlocked(true)
        
        // Deslogar o usuário
        await supabase.auth.signOut()
        
        // Redirecionar para página de bloqueio (se não estiver nela)
        if (pathname !== '/conta-bloqueada') {
          router.push('/conta-bloqueada')
        }
        
        return true
      }

      setIsBlocked(false)
      return false
    } catch (err) {
      console.error('Erro ao verificar bloqueio:', err)
      return false
    }
  }

  useEffect(() => {
    // Log removido para reduzir sobrecarga - só mostrar quando necessário
    let mounted = true

    const initCheck = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          await checkBlockStatus(session.user.id)
        }
      } catch (err) {
        console.error('Erro na verificação inicial:', err)
      } finally {
        if (mounted) {
          setIsChecking(false)
        }
      }
    }

    initCheck()

    // Listener para TODAS as mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
                
        // Verificar bloqueio em TODOS os eventos de autenticação
        if (session?.user && mounted) {
          // Eventos importantes para verificar bloqueio
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        const blocked = await checkBlockStatus(session.user.id)
            
            // Se bloqueado, impedir que continue
            if (blocked) {
                          }
          }
        }

        if (mounted) {
          setIsChecking(false)
        }
      }
    )

    // Verificar periodicamente (a cada 30 segundos)
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && mounted) {
        await checkBlockStatus(session.user.id)
      }
    }, 30000) // 30 segundos

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [pathname, router])

  // Se está verificando ou bloqueado, não renderizar children
  // (exceto se estiver na página de bloqueio)
  if (isBlocked && pathname !== '/conta-bloqueada') {
    return null
  }

  return <>{children}</>
}

