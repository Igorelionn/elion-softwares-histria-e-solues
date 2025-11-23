'use client'

/**
 * @deprecated Este hook está obsoleto. Use 'useGlobalAuth' do '@/contexts/GlobalAuthContext' em vez disso.
 *
 * MIGRAÇÃO:
 * Antes: const { user, loading } = useAuth()
 * Depois: const { user, loading } = useGlobalAuth()
 *
 * Este arquivo será removido em uma versão futura.
 */

import { useGlobalAuth } from '@/contexts/GlobalAuthContext'

export function useAuth() {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATED] useAuth() está obsoleto. ' +
      'Use useGlobalAuth() de "@/contexts/GlobalAuthContext" em vez disso.'
    )
  }

  const { user, loading, error, isAuthenticated } = useGlobalAuth()

  // Retornar interface compatível
  return {
    user,
    loading,
    error,
    isBlocked: false, // BlockGuard agora gerencia isso
    blockDetails: null,
  }
}
