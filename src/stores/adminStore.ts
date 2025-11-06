/**
 * AdminStore - Store Global do Painel Admin com Zustand
 * 
 * Gerencia dados do painel administrativo com:
 * - Cache temporário (5 minutos)
 * - Carregamento paralelo de dados
 * - Proteção anti-loop
 * - Timeout e retry automático
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/lib/logger'
import { withTimeout } from '@/lib/timeout'
import { withRetry, retryChecks } from '@/lib/retry'

const log = createModuleLogger('ADMIN_STORE')

export interface AdminStats {
  totalUsers: number
  totalMeetings: number
  pendingMeetings: number
  completedMeetings: number
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  company: string
  role: string
  is_blocked: boolean
  created_at: string
}

export interface AdminMeeting {
  id: string
  user_id: string
  name: string
  email: string
  company: string
  meeting_type: string
  status: string
  preferred_date: string
  created_at: string
}

interface AdminState {
  // Estado
  stats: AdminStats | null
  users: AdminUser[]
  meetings: AdminMeeting[]
  
  // Loading states
  isLoading: boolean
  isLoadingStats: boolean
  isLoadingUsers: boolean
  isLoadingMeetings: boolean
  
  // Controles
  error: string | null
  lastUpdate: number
  loadInProgress: boolean
  
  // Ações
  loadAllData: () => Promise<void>
  loadStats: () => Promise<void>
  loadUsers: () => Promise<void>
  loadMeetings: () => Promise<void>
  clearData: () => void
  setError: (error: string | null) => void
  
  // Operações admin
  blockUser: (userId: string, reason: string) => Promise<boolean>
  unblockUser: (userId: string) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  updateMeetingStatus: (meetingId: string, status: string) => Promise<boolean>
}

// Configurações
const ADMIN_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const LOAD_TIMEOUT_MS = 20000 // 20 segundos
const OPERATION_TIMEOUT_MS = 15000 // 15 segundos

/**
 * Store do painel admin com Zustand
 */
export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      stats: null,
      users: [],
      meetings: [],
      
      isLoading: false,
      isLoadingStats: false,
      isLoadingUsers: false,
      isLoadingMeetings: false,
      
      error: null,
      lastUpdate: 0,
      loadInProgress: false,
      
      /**
       * Carrega todos os dados do admin em paralelo
       */
      loadAllData: async () => {
        const state = get()
        
        // Proteção anti-loop
        if (state.loadInProgress) {
          log.warn('Load já em andamento, ignorando')
          return
        }
        
        // Verificar cache
        const now = Date.now()
        const cacheIsValid = 
          state.stats &&
          state.users.length > 0 &&
          state.lastUpdate > 0 &&
          now - state.lastUpdate < ADMIN_CACHE_DURATION
        
        if (cacheIsValid) {
          log.info('Usando dados do cache')
          return
        }
        
        set({ loadInProgress: true, isLoading: true, error: null })
        log.info('Carregando dados do admin')
        
        try {
          // Carregar tudo em paralelo
          await Promise.all([
            get().loadStats(),
            get().loadUsers(),
            get().loadMeetings(),
          ])
          
          log.success('Dados do admin carregados com sucesso')
          
          set({
            isLoading: false,
            loadInProgress: false,
            lastUpdate: now,
            error: null,
          })
        } catch (error: any) {
          log.error('Falha ao carregar dados do admin', error)
          set({
            error: error?.message || 'Erro ao carregar dados',
            isLoading: false,
            loadInProgress: false,
          })
        }
      },
      
      /**
       * Carrega estatísticas
       */
      loadStats: async () => {
        set({ isLoadingStats: true })
        log.debug('Carregando estatísticas')
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { data, error } = await withRetry(
            () => withTimeout(
              (supabase as any).rpc('get_admin_stats'),
              {
                timeoutMs: LOAD_TIMEOUT_MS,
                errorMessage: 'Timeout ao carregar estatísticas',
                moduleName: 'ADMIN_STORE',
              }
            ),
            {
              maxAttempts: 2,
              initialDelay: 1000,
              moduleName: 'ADMIN_STORE',
              shouldRetry: retryChecks.serverErrorsAndTimeouts,
            }
          )
          
          if (error) {
            log.error('Erro ao carregar estatísticas', error)
            set({ isLoadingStats: false })
            return
          }
          
          log.success('Estatísticas carregadas')
          set({ 
            stats: data as AdminStats,
            isLoadingStats: false,
          })
        } catch (error: any) {
          log.error('Falha crítica ao carregar estatísticas', error)
          set({ isLoadingStats: false })
        }
      },
      
      /**
       * Carrega usuários
       */
      loadUsers: async () => {
        set({ isLoadingUsers: true })
        log.debug('Carregando usuários')
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { data, error } = await withRetry(
            () => withTimeout(
              (supabase as any).rpc('get_all_users'),
              {
                timeoutMs: LOAD_TIMEOUT_MS,
                errorMessage: 'Timeout ao carregar usuários',
                moduleName: 'ADMIN_STORE',
              }
            ),
            {
              maxAttempts: 2,
              initialDelay: 1000,
              moduleName: 'ADMIN_STORE',
              shouldRetry: retryChecks.serverErrorsAndTimeouts,
            }
          )
          
          if (error) {
            log.error('Erro ao carregar usuários', error)
            set({ isLoadingUsers: false })
            return
          }
          
          log.success(`${(data as any[])?.length || 0} usuários carregados`)
          set({ 
            users: (data || []) as AdminUser[],
            isLoadingUsers: false,
          })
        } catch (error: any) {
          log.error('Falha crítica ao carregar usuários', error)
          set({ isLoadingUsers: false })
        }
      },
      
      /**
       * Carrega reuniões
       */
      loadMeetings: async () => {
        set({ isLoadingMeetings: true })
        log.debug('Carregando reuniões')
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { data, error } = await withRetry(
            () => withTimeout(
              (supabase as any).rpc('get_all_meetings'),
              {
                timeoutMs: LOAD_TIMEOUT_MS,
                errorMessage: 'Timeout ao carregar reuniões',
                moduleName: 'ADMIN_STORE',
              }
            ),
            {
              maxAttempts: 2,
              initialDelay: 1000,
              moduleName: 'ADMIN_STORE',
              shouldRetry: retryChecks.serverErrorsAndTimeouts,
            }
          )
          
          if (error) {
            log.error('Erro ao carregar reuniões', error)
            set({ isLoadingMeetings: false })
            return
          }
          
          log.success(`${(data as any[])?.length || 0} reuniões carregadas`)
          set({ 
            meetings: (data || []) as AdminMeeting[],
            isLoadingMeetings: false,
          })
        } catch (error: any) {
          log.error('Falha crítica ao carregar reuniões', error)
          set({ isLoadingMeetings: false })
        }
      },
      
      /**
       * Bloqueia usuário
       */
      blockUser: async (userId: string, reason: string) => {
        log.info('Bloqueando usuário', { userId, reason })
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { error } = await withTimeout(
            (supabase as any).rpc('admin_block_user', {
              p_user_id: userId,
              p_reason: reason,
            }),
            {
              timeoutMs: OPERATION_TIMEOUT_MS,
              errorMessage: 'Timeout ao bloquear usuário',
              moduleName: 'ADMIN_STORE',
            }
          )
          
          if (error) {
            log.error('Erro ao bloquear usuário', error)
            return false
          }
          
          log.success('Usuário bloqueado com sucesso')
          
          // Atualizar lista local
          const updatedUsers = get().users.map(u => 
            u.id === userId ? { ...u, is_blocked: true } : u
          )
          set({ users: updatedUsers })
          
          return true
        } catch (error: any) {
          log.error('Falha ao bloquear usuário', error)
          return false
        }
      },
      
      /**
       * Desbloqueia usuário
       */
      unblockUser: async (userId: string) => {
        log.info('Desbloqueando usuário', { userId })
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { error } = await withTimeout(
            (supabase as any).rpc('admin_unblock_user', {
              p_user_id: userId,
            }),
            {
              timeoutMs: OPERATION_TIMEOUT_MS,
              errorMessage: 'Timeout ao desbloquear usuário',
              moduleName: 'ADMIN_STORE',
            }
          )
          
          if (error) {
            log.error('Erro ao desbloquear usuário', error)
            return false
          }
          
          log.success('Usuário desbloqueado com sucesso')
          
          // Atualizar lista local
          const updatedUsers = get().users.map(u => 
            u.id === userId ? { ...u, is_blocked: false } : u
          )
          set({ users: updatedUsers })
          
          return true
        } catch (error: any) {
          log.error('Falha ao desbloquear usuário', error)
          return false
        }
      },
      
      /**
       * Deleta usuário
       */
      deleteUser: async (userId: string) => {
        log.info('Deletando usuário', { userId })
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { error } = await withTimeout(
            (supabase as any).rpc('delete_user_account', {
              user_id: userId,
            }),
            {
              timeoutMs: OPERATION_TIMEOUT_MS,
              errorMessage: 'Timeout ao deletar usuário',
              moduleName: 'ADMIN_STORE',
            }
          )
          
          if (error) {
            log.error('Erro ao deletar usuário', error)
            return false
          }
          
          log.success('Usuário deletado com sucesso')
          
          // Remover da lista local
          const updatedUsers = get().users.filter(u => u.id !== userId)
          set({ users: updatedUsers })
          
          return true
        } catch (error: any) {
          log.error('Falha ao deletar usuário', error)
          return false
        }
      },
      
      /**
       * Atualiza status de reunião
       */
      updateMeetingStatus: async (meetingId: string, status: string) => {
        log.info('Atualizando status de reunião', { meetingId, status })
        
        try {
          // @ts-ignore - RPC function may not be in generated types
          const { error } = await withTimeout(
            (supabase as any).rpc('admin_update_meeting_status', {
              p_meeting_id: meetingId,
              p_new_status: status,
            }),
            {
              timeoutMs: OPERATION_TIMEOUT_MS,
              errorMessage: 'Timeout ao atualizar reunião',
              moduleName: 'ADMIN_STORE',
            }
          )
          
          if (error) {
            log.error('Erro ao atualizar reunião', error)
            return false
          }
          
          log.success('Reunião atualizada com sucesso')
          
          // Atualizar lista local
          const updatedMeetings = get().meetings.map(m => 
            m.id === meetingId ? { ...m, status } : m
          )
          set({ meetings: updatedMeetings })
          
          return true
        } catch (error: any) {
          log.error('Falha ao atualizar reunião', error)
          return false
        }
      },
      
      /**
       * Limpa dados (usado no logout ou quando deixar de ser admin)
       */
      clearData: () => {
        log.info('Limpando dados do admin')
        set({
          stats: null,
          users: [],
          meetings: [],
          isLoading: false,
          isLoadingStats: false,
          isLoadingUsers: false,
          isLoadingMeetings: false,
          error: null,
          lastUpdate: 0,
          loadInProgress: false,
        })
      },
      
      /**
       * Define erro
       */
      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: 'admin-storage',
      // Persistir apenas dados essenciais por pouco tempo
      partialize: (state) => ({
        stats: state.stats,
        users: state.users,
        meetings: state.meetings,
        lastUpdate: state.lastUpdate,
      }),
    }
  )
)

/**
 * Hook helper para obter dados do admin
 */
export function useAdminData() {
  return useAdminStore((state) => ({
    stats: state.stats,
    users: state.users,
    meetings: state.meetings,
  }))
}

/**
 * Hook helper para obter status de carregamento
 */
export function useAdminLoading() {
  return useAdminStore((state) => ({
    isLoading: state.isLoading,
    isLoadingStats: state.isLoadingStats,
    isLoadingUsers: state.isLoadingUsers,
    isLoadingMeetings: state.isLoadingMeetings,
  }))
}

/**
 * Hook helper para obter erro
 */
export function useAdminError() {
  return useAdminStore((state) => state.error)
}

