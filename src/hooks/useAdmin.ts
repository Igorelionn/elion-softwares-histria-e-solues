'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const FORCE_LOGS = process.env.NODE_ENV !== 'production' // ✅ Logs apenas em desenvolvimento

// Cache global para evitar verificações repetidas
let adminCache = {
  isAdmin: false,
  lastCheck: 0,
  isLoading: false
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(adminCache.isAdmin)
  const [loading, setLoading] = useState(adminCache.isLoading || true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Se já temos um cache recente (menos de 5 minutos), usar ele
    const now = Date.now()
    if (adminCache.lastCheck > 0 && (now - adminCache.lastCheck) < 300000) {
      if (FORCE_LOGS) console.log('[useAdmin] ✅ Usando cache recente de admin')
      setIsAdmin(adminCache.isAdmin)
      setLoading(false)
      return
    }

    if (FORCE_LOGS) console.log('[useAdmin] 🔍 Iniciando verificação de permissões...')

    let isMounted = true
    let timeoutId: NodeJS.Timeout

    // Marcar como carregando globalmente
    adminCache.isLoading = true
    setLoading(true)

    const timeout = setTimeout(() => {
      console.warn('[useAdmin] ⏰ TIMEOUT: Verificação demorou mais de 10s, cancelando...')
      if (isMounted) {
        adminCache.isLoading = false
        setIsAdmin(false)
        setLoading(false)
        setError('Timeout na verificação de permissões')
      }
    }, 10000) // Reduzido para 10s (queries agora têm timeout de 3s)

    timeoutId = timeout

    checkAdminStatus().finally(() => {
      if (isMounted) {
        adminCache.isLoading = false
        clearTimeout(timeout)
        if (FORCE_LOGS) console.log('[useAdmin] ✅ Verificação finalizada')
      }
    })

    // Cleanup
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  const checkAdminStatus = async () => {
    try {
      const startTime = Date.now()
      if (FORCE_LOGS) console.log('[useAdmin] 📡 Buscando usuário...')

      // OTIMIZADO: getUser com timeout de 3s (mais rápido que getSession)
      const userPromise = supabase.auth.getUser()
      const userTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getUser timeout após 3s')), 3000)
      )

      const { data: { user }, error: userError } = await Promise.race([
        userPromise,
        userTimeoutPromise
      ])

      if (userError) {
        console.error('[useAdmin] ❌ Erro ao buscar usuário:', userError)
        setIsAdmin(false)
        setLoading(false)
        setError('Erro ao verificar usuário')
        return
      }

      if (!user) {
        if (FORCE_LOGS) console.log('[useAdmin] ⚠️ Nenhum usuário autenticado')
        setIsAdmin(false)
        setLoading(false)
        return
      }

      if (FORCE_LOGS) console.log('[useAdmin] 👤 Usuário encontrado:', user.email)

      // OTIMIZADO: Buscar role com timeout de 3s
      if (FORCE_LOGS) console.log('[useAdmin] 📡 Buscando role do usuário na tabela users...')
      const queryStartTime = Date.now()

      const queryPromise = supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as Promise<{ data: { role: string } | null; error: any }>

      const queryTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query role timeout após 3s')), 3000)
      )

      const { data: profile, error: profileError } = await Promise.race([
        queryPromise,
        queryTimeoutPromise
      ])

      const queryTime = Date.now() - queryStartTime
      if (FORCE_LOGS) console.log(`[useAdmin] ⏱️ Query levou ${queryTime}ms`)

      if (profileError) {
        console.error('[useAdmin] ❌ Erro ao buscar profile:', profileError)
        setIsAdmin(false)
        setLoading(false)
        setError(`Erro ao buscar perfil: ${profileError.message}`)
        return
      }

      if (!profile) {
        console.warn('[useAdmin] ⚠️ Profile não encontrado para user:', user.id)
        setIsAdmin(false)
        setLoading(false)
        setError('Perfil não encontrado')
        return
      }

      const isAdminUser = profile?.role === 'admin'
      if (FORCE_LOGS) console.log(`[useAdmin] 🔐 Role detectado: "${profile?.role}" | É admin: ${isAdminUser}`)

      // Atualizar cache global
      adminCache.isAdmin = isAdminUser
      adminCache.lastCheck = Date.now()

      setIsAdmin(isAdminUser)
      setLoading(false)
      setError(null)

      if (FORCE_LOGS) console.log(`[useAdmin] ✅ Verificação completa em ${Date.now() - startTime}ms`)

    } catch (error: any) {
      console.error('[useAdmin] ❌ Erro inesperado ao verificar admin:', error)

      // Mesmo em erro, atualizar cache para evitar verificações repetidas
      adminCache.isAdmin = false
      adminCache.lastCheck = Date.now()

      setIsAdmin(false)
      setLoading(false)
      setError(`Erro inesperado: ${error.message}`)
    }
  }

  return { isAdmin, loading, error }
}

