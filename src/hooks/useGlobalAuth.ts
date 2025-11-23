'use client'

import { useContext } from 'react'
import { GlobalAuthContext } from '@/contexts/GlobalAuthProvider'

export function useGlobalAuth() {
  const context = useContext(GlobalAuthContext)
  if (context === undefined) {
    throw new Error('useGlobalAuth must be used within GlobalAuthProvider')
  }
  return context
}

export default useGlobalAuth
