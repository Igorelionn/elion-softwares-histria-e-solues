/**
 * AuthStore - Store Global de Autenticação com Zustand
 * 
 * Store centralizado para gerenciar autenticação com:
 * - Persistência automática via localStorage
 * - Controles anti-loop
 * - Deduplicação de eventos
 * - Sincronização com Supabase
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/lib/logger'
import { withTimeout } from '@/lib/timeout'
import { withRetry, retryChecks } from '@/lib/retry'

const log = createModuleLogger('AUTH_STORE')

interface AuthState {
  // Estado
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  lastSync: number
  error: string | null
  
  // Controles anti-loop
  syncInProgress: boolean
  lastEventTimestamp: number
  eventQueue: string[]
  
  // Ações
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  syncSession: () => Promise<void>
  signOut: () => Promise<void>
  clearState: () => void
  
  // Helpers internos
  _setSyncInProgress: (inProgress: boolean) => void
  _updateLastEventTimestamp: () => void
  _shouldProcessEvent: (eventType: string) => boolean
}

// Timeout padrão para operações de autenticação
const AUTH_TIMEOUT_MS = 15000

/**
 * Store de autenticação com Zustand
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isLoading: true,
      isInitialized: false,
      lastSync: 0,
      error: null,
      
      // Controles anti-loop
      syncInProgress: false,
      lastEventTimestamp: 0,
      eventQueue: [],
      
      /**
       * Define o usuário atual
       */
      setUser: (user) => {
        log.debug('setUser', { userId: user?.id })
        set({ user, error: null })
      },
      
      /**
       * Define estado de carregamento
       */
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
      
      /**
       * Define erro
       */
      setError: (error) => {
        log.error('Erro de autenticação', error)
        set({ error, isLoading: false })
      },
      
      /**
       * Sincroniza sessão com Supabase
       * Inclui proteção anti-loop e timeout
       */
      syncSession: async () => {
        const state = get()
        
        // Proteção anti-loop: não permitir sync simultâneos
        if (state.syncInProgress) {
          log.warn('Sync já em andamento, ignorando')
          return
        }
        
        // Debounce: ignorar chamadas muito próximas (< 500ms)
        const now = Date.now()
        if (state.lastSync > 0 && now - state.lastSync < 500) {
          log.warn('Sync muito recente, ignorando (debounce)')
          return
        }
        
        set({ syncInProgress: true, isLoading: true })
        log.info('Iniciando sincronização de sessão')
        
        try {
          // Sincronizar com timeout e retry
          const { data: { session }, error } = await withRetry(
            () => withTimeout(
              supabase.auth.getSession(),
              {
                timeoutMs: AUTH_TIMEOUT_MS,
                errorMessage: 'Timeout ao buscar sessão',
                moduleName: 'AUTH_STORE',
              }
            ),
            {
              maxAttempts: 2,
              initialDelay: 1000,
              moduleName: 'AUTH_STORE',
              shouldRetry: retryChecks.timeoutOnly,
            }
          )
          
          if (error) {
            log.error('Erro ao sincronizar sessão', error)
            set({
              error: error.message,
              user: null,
              isLoading: false,
              isInitialized: true,
              lastSync: now,
            })
            return
          }
          
          log.success('Sessão sincronizada', { userId: session?.user?.id })
          
          set({
            user: session?.user || null,
            isLoading: false,
            isInitialized: true,
            lastSync: now,
            error: null,
          })
        } catch (error: any) {
          log.error('Falha crítica ao sincronizar sessão', error)
          set({
            error: error?.message || 'Erro desconhecido ao sincronizar',
            user: null,
            isLoading: false,
            isInitialized: true,
            lastSync: now,
          })
        } finally {
          set({ syncInProgress: false })
        }
      },
      
      /**
       * Faz logout do usuário
       */
      signOut: async () => {
        log.info('Fazendo logout')
        set({ isLoading: true })
        
        try {
          await supabase.auth.signOut()
          
          // Limpar estado completamente
          get().clearState()
          
          log.success('Logout realizado com sucesso')
        } catch (error: any) {
          log.error('Erro ao fazer logout', error)
          
          // Mesmo com erro, limpar estado local
          get().clearState()
        }
      },
      
      /**
       * Limpa todo o estado (usado no logout)
       */
      clearState: () => {
        log.info('Limpando estado de autenticação')
        set({
          user: null,
          isLoading: false,
          isInitialized: true,
          lastSync: 0,
          error: null,
          syncInProgress: false,
          lastEventTimestamp: 0,
          eventQueue: [],
        })
      },
      
      /**
       * Marca sync como em progresso
       */
      _setSyncInProgress: (inProgress) => {
        set({ syncInProgress: inProgress })
      },
      
      /**
       * Atualiza timestamp do último evento processado
       */
      _updateLastEventTimestamp: () => {
        set({ lastEventTimestamp: Date.now() })
      },
      
      /**
       * Verifica se um evento deve ser processado
       * Implementa deduplicação e fila
       */
      _shouldProcessEvent: (eventType: string) => {
        const state = get()
        const now = Date.now()
        
        // Deduplica eventos duplicados em 500ms
        if (state.lastEventTimestamp > 0 && now - state.lastEventTimestamp < 500) {
          // Verificar se é o mesmo tipo de evento
          const lastEvent = state.eventQueue[state.eventQueue.length - 1]
          if (lastEvent === eventType) {
            log.warn(`Evento duplicado ignorado: ${eventType}`)
            return false
          }
        }
        
        // Adicionar à fila
        const newQueue = [...state.eventQueue, eventType]
        
        // Manter apenas os últimos 10 eventos na fila
        if (newQueue.length > 10) {
          newQueue.shift()
        }
        
        set({ eventQueue: newQueue, lastEventTimestamp: now })
        
        return true
      },
    }),
    {
      name: 'auth-storage',
      // Persistir apenas dados essenciais
      partialize: (state) => ({
        user: state.user,
        lastSync: state.lastSync,
        isInitialized: state.isInitialized,
      }),
    }
  )
)

/**
 * Hook helper para inicializar o auth store
 * Deve ser chamado apenas uma vez no AuthProvider
 */
export function useInitializeAuth() {
  const syncSession = useAuthStore((state) => state.syncSession)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  
  return { syncSession, isInitialized }
}

/**
 * Hook helper para obter apenas os dados do usuário
 * Evita re-renders desnecessários
 */
export function useUser() {
  return useAuthStore((state) => state.user)
}

/**
 * Hook helper para obter status de carregamento
 */
export function useAuthLoading() {
  return useAuthStore((state) => state.isLoading)
}

/**
 * Hook helper para obter erro de autenticação
 */
export function useAuthError() {
  return useAuthStore((state) => state.error)
}

/**
 * Selector otimizado para componentes que precisam de múltiplos campos
 */
export function useAuthState() {
  return useAuthStore((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
  }))
}

