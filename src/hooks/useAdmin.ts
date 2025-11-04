'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAdmin(false)
      setLoading(false)
    }, 5000)
    
    checkAdminStatus().finally(() => {
      clearTimeout(timeout)
    })
  }, [])

  const checkAdminStatus = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null; error: any }

      if (profileError) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const isAdminUser = profile?.role === 'admin'
      setIsAdmin(isAdminUser)
      setLoading(false)
      
    } catch (error: any) {
      console.error('Erro ao verificar admin:', error)
      setIsAdmin(false)
      setLoading(false)
    }
  }

  return { isAdmin, loading }
}

