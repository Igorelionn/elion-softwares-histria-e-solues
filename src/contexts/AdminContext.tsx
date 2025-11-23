'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminContextType {
  isAdmin: boolean
  loading: boolean
  error: string | null
  refreshAdminStatus: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// Cache global para evitar verificações repetidas
let globalAdminCache = {
  isAdmin: false,
  lastCheck: 0,
  isLoading: false
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(globalAdminCache.isAdmin)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAdminStatus = async () => {
    try {
      // Verificar cache primeiro
      const now = Date.now()
      if (globalAdminCache.lastCheck > 0 && (now - globalAdminCache.lastCheck) < CACHE_DURATION) {
        setIsAdmin(globalAdminCache.isAdmin)
        setLoading(false)
        return
      }

      // Marcar como carregando
      globalAdminCache.isLoading = true
      setLoading(true)

      // Buscar usuário
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setIsAdmin(false)
        setLoading(false)
        globalAdminCache.isAdmin = false
        globalAdminCache.lastCheck = now
        return
      }

      // ✅ OTIMIZADO: Usar RPC check_is_admin ao invés de query na tabela
      const { data: isAdminResult, error: rpcError } = await supabase.rpc('check_is_admin')

      if (rpcError) {
        console.error('[AdminContext] Erro ao verificar admin via RPC:', rpcError)
        setError(rpcError.message)
        setIsAdmin(false)
      } else {
        const adminStatus = isAdminResult || false
        setIsAdmin(adminStatus)
        globalAdminCache.isAdmin = adminStatus
        globalAdminCache.lastCheck = now
        setError(null)
      }

      setLoading(false)
      globalAdminCache.isLoading = false

    } catch (err: any) {
      console.error('[AdminContext] Erro inesperado:', err)
      setError(err.message)
      setIsAdmin(false)
      setLoading(false)
      globalAdminCache.isAdmin = false
      globalAdminCache.lastCheck = Date.now()
      globalAdminCache.isLoading = false
    }
  }

  const refreshAdminStatus = async () => {
    globalAdminCache.lastCheck = 0 // Forçar revalidação
    await checkAdminStatus()
  }

  useEffect(() => {
    checkAdminStatus()
  }, [])

  return (
    <AdminContext.Provider value={{ isAdmin, loading, error, refreshAdminStatus }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminContext() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider')
  }
  return context
}

