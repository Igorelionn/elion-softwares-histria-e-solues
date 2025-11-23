/**
 * Helper functions para autenticação otimizada
 * Resolve o problema de timeout do getSession() do Supabase
 */

import { supabase } from './supabase'
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
    // Construir a chave correta do localStorage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
    const storageKey = `sb-${projectRef}-auth-token`

    const stored = localStorage.getItem(storageKey)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Tentar diferentes estruturas que o Supabase pode usar
    return (
      parsed?.currentSession?.user?.id ||
      parsed?.user?.id ||
      parsed?.access_token ? parsed.user?.id : null
    )
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
    const storageKey = `sb-${projectRef}-auth-token`

    const stored = localStorage.getItem(storageKey)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    return (
      parsed?.currentSession?.user ||
      parsed?.user ||
      null
    )
  } catch (error) {
    console.error('[AUTH_HELPER] Erro ao ler user do localStorage:', error)
    return null
  }
}

/**
 * Versão otimizada de getSession() que evita timeouts
 *
 * ESTRATÉGIA:
 * 1. Primeiro tenta localStorage (instantâneo)
 * 2. Se não encontrar, tenta getUser() com timeout curto (mais leve que getSession)
 * 3. Nunca usa getSession() diretamente pois trava em conexões stale
 *
 * @param timeoutMs - Timeout em milissegundos (padrão: 2000ms)
 * @returns Promise com o usuário ou null
 */
export async function getSessionOptimized(timeoutMs: number = 2000): Promise<SessionResult> {
  try {
    // PASSO 1: Tentar localStorage primeiro (mais rápido)
    const userFromStorage = getUserFromStorage()
    if (userFromStorage) {
      console.log('[AUTH_HELPER] ✅ Usuário encontrado no localStorage')
      return { user: userFromStorage, error: null }
    }

    // PASSO 2: Se não encontrou, tentar getUser() com timeout
    console.log('[AUTH_HELPER] 🔍 localStorage vazio, tentando getUser()...')

    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`getUser timeout após ${timeoutMs}ms`)), timeoutMs)
    })

    try {
      const { data, error } = await Promise.race([userPromise, timeoutPromise])

      if (error) {
        console.error('[AUTH_HELPER] ❌ Erro no getUser:', error)
        return { user: null, error: error as Error }
      }

      if (data?.user) {
        console.log('[AUTH_HELPER] ✅ Usuário encontrado via getUser()')
        return { user: data.user, error: null }
      }

      console.log('[AUTH_HELPER] ℹ️ Nenhum usuário logado')
      return { user: null, error: null }

    } catch (timeoutError) {
      console.error('[AUTH_HELPER] ⏱️ Timeout no getUser:', timeoutError)
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

