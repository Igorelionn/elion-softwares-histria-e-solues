'use client'

/**
 * @deprecated Este hook está obsoleto. Use 'useGlobalAuth' do '@/contexts/GlobalAuthContext' em vez disso.
 *
 * MIGRAÇÃO:
 * Antes: const { isAdmin, loading } = useAdmin()
 * Depois: const { isAdmin, loading } = useGlobalAuth()
 *
 * Este arquivo será removido em uma versão futura.
 */

import { useGlobalAuth } from '@/contexts/GlobalAuthContext'

export function useAdmin() {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATED] useAdmin() está obsoleto. ' +
      'Use useGlobalAuth() de "@/contexts/GlobalAuthContext" em vez disso.'
    )
  }

  const { isAdmin, loading, error } = useGlobalAuth()

  return {
    isAdmin,
    loading,
    error,
  }
}
