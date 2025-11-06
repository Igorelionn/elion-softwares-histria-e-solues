'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const FORCE_LOGS = true

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (FORCE_LOGS) console.log('[useAdmin] 🔍 Iniciando verificação de permissões...')
    
    const timeout = setTimeout(() => {
      console.warn('[useAdmin] ⏰ TIMEOUT: Verificação demorou mais de 10s, cancelando...')
      setIsAdmin(false)
      setLoading(false)
    }, 10000) // Aumentado para 10s
    
    checkAdminStatus().finally(() => {
      clearTimeout(timeout)
      if (FORCE_LOGS) console.log('[useAdmin] ✅ Verificação finalizada')
    })
  }, [])

  const checkAdminStatus = async () => {
    try {
      const startTime = Date.now()
      if (FORCE_LOGS) console.log('[useAdmin] 📡 Buscando usuário...')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (FORCE_LOGS) console.log(`[useAdmin] 👤 Usuário obtido em ${Date.now() - startTime}ms:`, user ? 'Autenticado' : 'Não autenticado')
      
      if (userError) {
        console.error('[useAdmin] ❌ Erro ao buscar usuário:', userError)
        setIsAdmin(false)
        setLoading(false)
        return
      }
      
      if (!user) {
        if (FORCE_LOGS) console.log('[useAdmin] ⚠️ Nenhum usuário autenticado')
        setIsAdmin(false)
        setLoading(false)
        return
      }
      
      if (FORCE_LOGS) console.log('[useAdmin] 📡 Buscando role do usuário na tabela users...')
      const queryStartTime = Date.now()
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null; error: any }

      if (FORCE_LOGS) console.log(`[useAdmin] ⏱️ Query levou ${Date.now() - queryStartTime}ms`)

      if (profileError) {
        console.error('[useAdmin] ❌ Erro ao buscar profile:', profileError)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      if (!profile) {
        console.warn('[useAdmin] ⚠️ Profile não encontrado para user:', user.id)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const isAdminUser = profile?.role === 'admin'
      if (FORCE_LOGS) console.log(`[useAdmin] 🔐 Role detectado: "${profile?.role}" | É admin: ${isAdminUser}`)
      
      setIsAdmin(isAdminUser)
      setLoading(false)
      
      if (FORCE_LOGS) console.log(`[useAdmin] ✅ Verificação completa em ${Date.now() - startTime}ms`)
      
    } catch (error: any) {
      console.error('[useAdmin] ❌ Erro inesperado ao verificar admin:', error)
      setIsAdmin(false)
      setLoading(false)
    }
  }

  return { isAdmin, loading }
}

