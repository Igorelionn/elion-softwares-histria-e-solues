'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface BlockDetails {
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
  blocked_by_email: string | null
  blocked_by_name: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockDetails, setBlockDetails] = useState<BlockDetails | null>(null)
  const router = useRouter()

  // Função para verificar se o usuário está bloqueado ou deletado
  const checkUserBlock = async (userId: string) => {
    try {
      // 1. PRIMEIRO: Verificar se está na blacklist (deletado permanentemente)
      const { data: blacklistData, error: blacklistError } = await (supabase
        // @ts-ignore - is_user_in_blacklist RPC function exists in database
        .rpc('is_user_in_blacklist', { check_user_id: userId }) as unknown as Promise<{ data: { blacklisted: boolean } | null; error: any }>)

      if (!blacklistError && blacklistData && blacklistData.blacklisted === true) {
        ')
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
        ')
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
        console.error('Erro ao verificar bloqueio:', error)
        return false
      }

      // Se o usuário está bloqueado
      if (data && data.is_blocked === true) {
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
      console.error('Erro ao verificar bloqueio:', err)
      return false
    }
  }

  useEffect(() => {
    // Verificar sessão inicial - OTIMIZADO
    const initializeAuth = async () => {
      try {
        // Importar dinamicamente para evitar problemas de SSR
        const { getSessionOptimized } = await import('@/lib/auth-helpers')
        const { user, error: sessionError } = await getSessionOptimized(2000)

        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setError(sessionError.message)
        }

        if (user) {
          // Verificar se o usuário está bloqueado
          const blocked = await checkUserBlock(user.id)
          if (!blocked) {
            setUser(user)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        if (session?.user) {
          // Verificar bloqueio ao trocar de estado
          const blocked = await checkUserBlock(session.user.id)
          if (!blocked) {
            setUser(session.user)
          }
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    )

    // Listener para quando a aba volta ao foco
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Não verificar bloqueio se estiver na página admin
        if (window.location.pathname === '/admin') {
          return
        }

        // OTIMIZADO: Usar função otimizada
        const { getSessionOptimized } = await import('@/lib/auth-helpers')
        const { user } = await getSessionOptimized(2000)

        if (user) {
          const blocked = await checkUserBlock(user.id)
          if (!blocked) {
            setUser(user)
          }
        } else {
          setUser(null)
        }
      }
    }

    // Listener para quando a janela ganha foco
    const handleFocus = async () => {
      // Não verificar bloqueio se estiver na página admin
      if (window.location.pathname === '/admin') {
        return
      }

      // OTIMIZADO: Usar função otimizada
      const { getSessionOptimized } = await import('@/lib/auth-helpers')
      const { user } = await getSessionOptimized(2000)

      if (user) {
        const blocked = await checkUserBlock(user.id)
        if (!blocked) {
          setUser(user)
        }
      } else {
        setUser(null)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return { user, loading, error, isBlocked, blockDetails }
}

