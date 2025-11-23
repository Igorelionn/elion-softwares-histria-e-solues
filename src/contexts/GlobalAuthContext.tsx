'use client'

/**
 * GLOBAL AUTH CONTEXT - ÚNICO PROVIDER DE AUTENTICAÇÃO
 *
 * Este contexto centraliza TODA a lógica de autenticação.
 * Substitui: useAuth, authSession, AdminContext
 *
 * CARACTERÍSTICAS:
 * - 1 único listener onAuthStateChange
 * - Cache em memória com TTL de 5 minutos
 * - Lê localStorage primeiro (instantâneo)
 * - Expõe: user, loading, isAdmin, isAuthenticated, refreshUser
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-client'

interface GlobalAuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  error: string | null
  refreshUser: () => Promise<void>
  checkIsAdmin: () => Promise<boolean>
}

const GlobalAuthContext = createContext<GlobalAuthContextType | undefined>(undefined)

// Cache global (persiste entre re-renders)
interface AuthCache {
  user: User | null
  isAdmin: boolean
  timestamp: number
}

let globalCache: AuthCache = {
  user: null,
  isAdmin: false,
  timestamp: 0
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Lê usuário do localStorage de forma síncrona
 */
function getUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const supabase = getSupabaseClient()
    const keys = Object.keys(localStorage).filter(key =>
      key.includes('supabase') && key.includes('auth-token')
    )

    for (const key of keys) {
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed?.user || parsed?.currentSession?.user) {
          return parsed?.user || parsed?.currentSession?.user
        }
      }
    }

    return null
  } catch (error) {
    console.error('[GlobalAuth] Erro ao ler localStorage:', error)
    return null
  }
}

export function GlobalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Inicialização: tentar localStorage primeiro (síncrono)
    const cachedUser = getUserFromStorage()
    if (cachedUser) {
      globalCache.user = cachedUser
      return cachedUser
    }
    return null
  })

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listenerRef = useRef<{ unsubscribe: () => void } | null>(null)
  const isInitializedRef = useRef(false)

  /**
   * Verifica se o usuário é admin usando RPC otimizado
   */
  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()

      // Se não tem usuário, não é admin
      if (!user) {
        setIsAdmin(false)
        globalCache.isAdmin = false
        return false
      }

      // Verificar cache primeiro
      const now = Date.now()
      if (globalCache.timestamp > 0 && (now - globalCache.timestamp) < CACHE_TTL) {
        setIsAdmin(globalCache.isAdmin)
        return globalCache.isAdmin
      }

      // Buscar via RPC otimizado
      const { data, error: rpcError } = await supabase.rpc('check_is_admin')

      if (rpcError) {
        console.error('[GlobalAuth] Erro ao verificar admin:', rpcError)
        setIsAdmin(false)
        globalCache.isAdmin = false
        return false
      }

      const adminStatus = data || false
      setIsAdmin(adminStatus)
      globalCache.isAdmin = adminStatus
      globalCache.timestamp = now

      return adminStatus
    } catch (err) {
      console.error('[GlobalAuth] Erro crítico ao verificar admin:', err)
      setIsAdmin(false)
      globalCache.isAdmin = false
      return false
    }
  }, [user])

  /**
   * Força refresh do usuário e status de admin
   */
  const refreshUser = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('[GlobalAuth] Erro ao refresh user:', userError)
        setUser(null)
        setIsAdmin(false)
        globalCache.user = null
        globalCache.isAdmin = false
        return
      }

      setUser(currentUser)
      globalCache.user = currentUser
      globalCache.timestamp = 0 // Forçar revalidação de admin

      if (currentUser) {
        await checkIsAdmin()
      } else {
        setIsAdmin(false)
        globalCache.isAdmin = false
      }
    } catch (err) {
      console.error('[GlobalAuth] Erro crítico no refresh:', err)
    }
  }, [checkIsAdmin])

  /**
   * Inicialização e listener único
   */
  useEffect(() => {
    // Prevenir inicialização duplicada
    if (isInitializedRef.current) {
      return
    }

    isInitializedRef.current = true
    const supabase = getSupabaseClient()

    console.log('[GlobalAuth] 🚀 Inicializando provider (ÚNICO)')

    // PASSO 1: Tentar localStorage (já feito no useState)
    const storageUser = getUserFromStorage()

    // PASSO 2: Validar com getSession() em background
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[GlobalAuth] Erro ao obter sessão:', sessionError)
          setError(sessionError.message)
        }

        if (session?.user) {
          // Atualizar se mudou
          if (session.user.id !== storageUser?.id) {
            setUser(session.user)
            globalCache.user = session.user
          }

          // Verificar admin
          await checkIsAdmin()
        } else {
          setUser(null)
          setIsAdmin(false)
          globalCache.user = null
          globalCache.isAdmin = false
        }
      } catch (err) {
        console.error('[GlobalAuth] Erro na inicialização:', err)
        setError('Erro ao inicializar autenticação')
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // PASSO 3: Registrar ÚNICO listener
    console.log('[GlobalAuth] 👂 Registrando listener único')

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[GlobalAuth] 🔔 Auth event:', event)

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setIsAdmin(false)
          globalCache.user = null
          globalCache.isAdmin = false
          globalCache.timestamp = 0
          setLoading(false)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user)
          globalCache.user = session.user
          globalCache.timestamp = 0 // Forçar revalidação de admin
          await checkIsAdmin()
          setLoading(false)
        } else if (event === 'USER_UPDATED') {
          setUser(session.user)
          globalCache.user = session.user
          // Não revalidar admin no USER_UPDATED (evita chamadas extras)
        }
      }
    )

    listenerRef.current = subscription

    console.log('[GlobalAuth] ✅ Listener registrado')

    // Cleanup: remover listener ao desmontar
    return () => {
      console.log('[GlobalAuth] 🧹 Limpando listener')
      if (listenerRef.current) {
        listenerRef.current.unsubscribe()
        listenerRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [checkIsAdmin])

  const isAuthenticated = !!user

  const value: GlobalAuthContextType = {
    user,
    loading,
    isAdmin,
    isAuthenticated,
    error,
    refreshUser,
    checkIsAdmin
  }

  return (
    <GlobalAuthContext.Provider value={value}>
      {children}
    </GlobalAuthContext.Provider>
  )
}

/**
 * Hook para acessar o contexto global de autenticação
 *
 * USO:
 * const { user, isAdmin, isAuthenticated, loading } = useGlobalAuth()
 */
export function useGlobalAuth(): GlobalAuthContextType {
  const context = useContext(GlobalAuthContext)

  if (context === undefined) {
    throw new Error('useGlobalAuth deve ser usado dentro de um GlobalAuthProvider')
  }

  return context
}

