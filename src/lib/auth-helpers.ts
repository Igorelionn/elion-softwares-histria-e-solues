/**
 * Helper functions para autenticação otimizada
 * ATUALIZADO: Usa o singleton global do Supabase
 */

import { getSupabaseClient } from './supabase-client'
import type { User } from '@supabase/supabase-js'

/**
 * Interface para o resultado da sessão
 */
export interface SessionResult {
  user: User | null
  error: Error | null
}

/**
 * Obtém o userId do localStorage de forma síncrona e rápida
 * Esta é a forma mais rápida de verificar se há um usuário logado
 */
export function getUserIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null

  try {
    // Procurar por todas as chaves de auth do Supabase
    const keys = Object.keys(localStorage).filter(key =>
      key.includes('supabase') && key.includes('auth-token')
    )

    for (const key of keys) {
      const stored = localStorage.getItem(key)
      if (!stored) continue

      const parsed = JSON.parse(stored)

      // Tentar diferentes estruturas que o Supabase pode usar
      return (
        parsed?.currentSession?.user?.id ||
        parsed?.user?.id ||
        null
      )
    }

    return null
  } catch (error) {
    console.error('[AUTH_HELPER] Erro ao ler localStorage:', error)
    return null
  }
}

/**
 * Obtém o usuário completo do localStorage
 */
export function getUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null

  try {
    const keys = Object.keys(localStorage).filter(key =>
      key.includes('supabase') && key.includes('auth-token')
    )

    for (const key of keys) {
      const stored = localStorage.getItem(key)
      if (!stored) continue

      const parsed = JSON.parse(stored)

      return (
        parsed?.currentSession?.user ||
        parsed?.user ||
        null
      )
    }

    return null
  } catch (error) {
    console.error('[AUTH_HELPER] Erro ao ler user do localStorage:', error)
    return null
  }
}

/**
 * Versão otimizada que evita timeouts
 *
 * ESTRATÉGIA:
 * 1. Primeiro tenta localStorage (instantâneo)
 * 2. Se não encontrar, tenta getSession() que é mais confiável que getUser()
 *
 * @param timeoutMs - Timeout em milissegundos (padrão: 5000ms)
 * @returns Promise com o usuário ou null
 */
export async function getSessionOptimized(timeoutMs: number = 5000): Promise<SessionResult> {
  try {
    // PASSO 1: Tentar localStorage primeiro (mais rápido)
    const userFromStorage = getUserFromStorage()
    if (userFromStorage) {
      return { user: userFromStorage, error: null }
    }

    // PASSO 2: Se não encontrou, tentar getSession() com timeout
    const supabase = getSupabaseClient()
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`getSession timeout após ${timeoutMs}ms`)), timeoutMs)
    })

    try {
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise])

      if (error) {
        console.error('[AUTH_HELPER] ❌ Erro no getSession:', error)
        return { user: null, error: error as Error }
      }

      if (data?.session?.user) {
        return { user: data.session.user, error: null }
      }

      return { user: null, error: null }

    } catch (timeoutError) {
      console.error('[AUTH_HELPER] ⏱️ Timeout no getSession:', timeoutError)
      // Se deu timeout, assumir que não há usuário logado
      return { user: null, error: timeoutError as Error }
    }

  } catch (error) {
    console.error('[AUTH_HELPER] ❌ Erro crítico:', error)
    return { user: null, error: error as Error }
  }
}

/**
 * Verifica se o usuário está autenticado (versão rápida)
 * Usa apenas localStorage para resposta instantânea
 */
export function isAuthenticatedSync(): boolean {
  return getUserIdFromStorage() !== null
}

/**
 * Aguarda até que a sessão esteja disponível ou timeout
 * Útil para componentes que precisam garantir que a sessão foi carregada
 */
export async function waitForSession(maxWaitMs: number = 3000): Promise<SessionResult> {
  const startTime = Date.now()

  // Tentar algumas vezes com delay curto
  while (Date.now() - startTime < maxWaitMs) {
    const result = await getSessionOptimized(1000)
    if (result.user || result.error) {
      return result
    }

    // Aguardar 100ms antes de tentar novamente
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Timeout final
  return {
    user: null,
    error: new Error(`Timeout aguardando sessão após ${maxWaitMs}ms`)
  }
}

/**
 * Hook-like function para uso em componentes React
 * Retorna o userId de forma síncrona do localStorage
 */
export function useUserIdSync(): string | null {
  if (typeof window === 'undefined') return null
  return getUserIdFromStorage()
}
