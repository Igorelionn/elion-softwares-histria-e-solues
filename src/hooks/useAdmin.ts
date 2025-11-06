'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const FORCE_LOGS = true

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
      console.warn('[useAdmin] ⏰ TIMEOUT: Verificação demorou mais de 30s, cancelando...')
      if (isMounted) {
        adminCache.isLoading = false
        setIsAdmin(false)
        setLoading(false)
        setError('Timeout na verificação de permissões')
      }
    }, 30000) // Aumentado para 30s para conexões lentas

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
      if (FORCE_LOGS) console.log('[useAdmin] 📡 Buscando sessão do usuário...')

      // Primeiro verificar se há uma sessão válida
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[useAdmin] ❌ Erro ao buscar sessão:', sessionError)
        setIsAdmin(false)
        setLoading(false)
        setError('Erro ao verificar sessão')
        return
      }

      if (!session?.user) {
        if (FORCE_LOGS) console.log('[useAdmin] ⚠️ Nenhuma sessão ativa')
        setIsAdmin(false)
        setLoading(false)
        return
      }

      if (FORCE_LOGS) console.log('[useAdmin] 👤 Sessão encontrada para:', session.user.email)

      // Agora buscar o perfil do usuário
      if (FORCE_LOGS) console.log('[useAdmin] 📡 Buscando role do usuário na tabela users...')
      const queryStartTime = Date.now()

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single() as { data: { role: string } | null; error: any }

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
        console.warn('[useAdmin] ⚠️ Profile não encontrado para user:', session.user.id)
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

