'use client'

import { useContext } from 'react'
import { GlobalAuthContext } from '@/contexts/GlobalAuthProvider'

export function useGlobalAuth() {
  const context = useContext(GlobalAuthContext)
  
  if (!context) {
    if (typeof window === 'undefined') {
      return {
        user: null,
        session: null,
        isAdmin: false,
        isLoading: true,
        refreshSession: async () => {}
      }
    }
    
    throw new Error('useGlobalAuth must be used within GlobalAuthProvider')
  }
  
  return context
}
