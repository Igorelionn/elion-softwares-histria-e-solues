/**
 * ProfileStore - Store Global de Perfil com Zustand
 * 
 * Gerencia dados do perfil do usuário com:
 * - Persistência automática via localStorage
 * - Controles anti-timeout
 * - Retry automático
 * - Cache inteligente com background refresh
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/lib/logger'
import { withTimeout } from '@/lib/timeout'
import { withRetry, retryChecks } from '@/lib/retry'

const log = createModuleLogger('PROFILE_STORE')

export interface Profile {
  id: string
  full_name: string
  company: string
  avatar_url: string
  role: string
  version?: number // Para optimistic locking
  updated_at?: string
}

interface ProfileState {
  // Estado
  profile: Profile | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastUpdate: number
  
  // Controles anti-loop
  loadInProgress: boolean
  saveInProgress: boolean
  
  // Ações
  loadProfile: (userId: string, forceRefresh?: boolean) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  setProfile: (profile: Profile | null) => void
  clearProfile: () => void
  setError: (error: string | null) => void
  
  // Background refresh
  _updateProfileInBackground: (userId: string) => Promise<void>
}

// Configurações
const PROFILE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const LOAD_TIMEOUT_MS = 15000 // 15 segundos
const SAVE_TIMEOUT_MS = 15000 // 15 segundos

/**
 * Store de perfil com Zustand
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      profile: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lastUpdate: 0,
      
      // Controles
      loadInProgress: false,
      saveInProgress: false,
      
      /**
       * Carrega perfil do usuário
       * Com cache inteligente e background refresh
       */
      loadProfile: async (userId: string, forceRefresh = false) => {
        const state = get()
        
        // Proteção anti-loop
        if (state.loadInProgress) {
          log.warn('Load já em andamento, ignorando')
          return
        }
        
        // Verificar cache
        const now = Date.now()
        const cacheIsValid = 
          state.profile &&
          state.profile.id === userId &&
          state.lastUpdate > 0 &&
          now - state.lastUpdate < PROFILE_CACHE_DURATION
        
        if (cacheIsValid && !forceRefresh) {
          log.info('Usando perfil do cache', { userId })
          
          // Cache válido, mas atualizar em background
          get()._updateProfileInBackground(userId)
          return
        }
        
        // Carregar do servidor
        set({ loadInProgress: true, isLoading: true, error: null })
        log.info('Carregando perfil do servidor', { userId })
        
        try {
          const { data, error } = await withRetry(
            () => withTimeout(
              supabase
                .from('users')
                .select('id, full_name, company, avatar_url, role, version, updated_at')
                .eq('id', userId)
                .single(),
              {
                timeoutMs: LOAD_TIMEOUT_MS,
                errorMessage: 'Timeout ao carregar perfil',
                moduleName: 'PROFILE_STORE',
              }
            ),
            {
              maxAttempts: 3,
              initialDelay: 1000,
              maxDelay: 5000,
              moduleName: 'PROFILE_STORE',
              shouldRetry: retryChecks.serverErrorsAndTimeouts,
            }
          )
          
          if (error) {
            log.error('Erro ao carregar perfil', error)
            set({
              error: error.message || 'Erro ao carregar perfil',
              isLoading: false,
              loadInProgress: false,
            })
            return
          }
          
          if (!data) {
            log.warn('Perfil não encontrado', { userId })
            set({
              error: 'Perfil não encontrado',
              isLoading: false,
              loadInProgress: false,
            })
            return
          }
          
          log.success('Perfil carregado com sucesso', { userId })
          
          set({
            profile: data as Profile,
            isLoading: false,
            loadInProgress: false,
            lastUpdate: now,
            error: null,
          })
        } catch (error: any) {
          log.error('Falha crítica ao carregar perfil', error)
          set({
            error: error?.message || 'Erro desconhecido ao carregar perfil',
            isLoading: false,
            loadInProgress: false,
          })
        }
      },
      
      /**
       * Atualiza perfil em background sem bloquear UI
       */
      _updateProfileInBackground: async (userId: string) => {
        log.debug('Atualizando perfil em background', { userId })
        
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('users')
              .select('id, full_name, company, avatar_url, role, version, updated_at')
              .eq('id', userId)
              .single(),
            {
              timeoutMs: LOAD_TIMEOUT_MS,
              errorMessage: 'Timeout no background refresh',
              moduleName: 'PROFILE_STORE',
              enableLogging: false, // Não logar timeout em background
            }
          )
          
          if (error || !data) {
            log.debug('Background refresh falhou, mantendo cache')
            return
          }
          
          const state = get()
          
          // Apenas atualizar se os dados mudaram
          const hasChanged = 
            !state.profile ||
            JSON.stringify(state.profile) !== JSON.stringify(data)
          
          if (hasChanged) {
            log.info('Perfil atualizado em background')
            set({
              profile: data as Profile,
              lastUpdate: Date.now(),
            })
          }
        } catch (error) {
          // Silenciosamente falhar no background refresh
          log.debug('Background refresh silenciosamente falhou')
        }
      },
      
      /**
       * Atualiza perfil do usuário
       * Com timeout, retry e proteção contra salvamentos simultâneos
       */
      updateProfile: async (data: Partial<Profile>) => {
        const state = get()
        
        if (!state.profile) {
          log.error('Tentativa de atualizar perfil sem perfil carregado')
          set({ error: 'Perfil não carregado' })
          return
        }
        
        // Proteção anti-loop
        if (state.saveInProgress) {
          log.warn('Save já em andamento, ignorando')
          return
        }
        
        set({ saveInProgress: true, isSaving: true, error: null })
        log.info('Salvando perfil', { userId: state.profile.id })
        
      try {
        // Tentar usar RPC safe_update_profile primeiro (se disponível)
        // @ts-ignore - RPC function may not be in generated types
        const { data: rpcData, error: rpcError } = await withRetry(
          () => withTimeout(
            (supabase as any).rpc('safe_update_profile', {
              p_user_id: state.profile!.id,
              p_full_name: data.full_name ?? state.profile.full_name,
              p_company: data.company ?? state.profile.company,
              p_avatar_url: data.avatar_url ?? state.profile.avatar_url,
              p_expected_version: state.profile.version || null,
            }),
            {
              timeoutMs: SAVE_TIMEOUT_MS,
              errorMessage: 'Timeout ao salvar perfil',
              moduleName: 'PROFILE_STORE',
            }
          ),
          {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            moduleName: 'PROFILE_STORE',
            shouldRetry: retryChecks.serverErrorsAndTimeouts,
            onRetry: (attempt, error) => {
              log.warn(`Retry ${attempt} ao salvar perfil`, error)
            },
          }
        )
        
        // Se RPC funcionou
        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData[0]?.success) {
          log.success('Perfil salvo via RPC com sucesso')
          
          // Atualizar cache local com nova versão
          const updatedProfile = {
            ...state.profile,
            full_name: data.full_name ?? state.profile.full_name,
            company: data.company ?? state.profile.company,
            avatar_url: data.avatar_url ?? state.profile.avatar_url,
            version: rpcData[0].new_version,
            updated_at: new Date().toISOString(),
          } as Profile
          
          set({
            profile: updatedProfile,
            isSaving: false,
            saveInProgress: false,
            lastUpdate: Date.now(),
            error: null,
          })
          return
        }
        
        // Fallback para update direto (se RPC não disponível)
        log.debug('RPC não disponível, usando update direto')
        
        const updateData = {
          full_name: data.full_name ?? state.profile.full_name,
          company: data.company ?? state.profile.company,
          avatar_url: data.avatar_url ?? state.profile.avatar_url,
          updated_at: new Date().toISOString(),
        }
        
        const { data: updatedData, error } = await withRetry(
          () => withTimeout(
            supabase
              .from('users')
              .update(updateData)
              .eq('id', state.profile!.id)
              .select()
              .single(),
            {
              timeoutMs: SAVE_TIMEOUT_MS,
              errorMessage: 'Timeout ao salvar perfil',
              moduleName: 'PROFILE_STORE',
            }
          ),
          {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 5000,
            moduleName: 'PROFILE_STORE',
            shouldRetry: retryChecks.serverErrorsAndTimeouts,
            onRetry: (attempt, error) => {
              log.warn(`Retry ${attempt} ao salvar perfil`, error)
            },
          }
        )
        
        if (error) {
          log.error('Erro ao salvar perfil', error)
          set({
            error: error.message || 'Erro ao salvar perfil',
            isSaving: false,
            saveInProgress: false,
          })
          return
        }
        
        log.success('Perfil salvo com sucesso')
        
        // Atualizar cache local
        set({
          profile: updatedData as Profile,
          isSaving: false,
          saveInProgress: false,
          lastUpdate: Date.now(),
          error: null,
        })
        } catch (error: any) {
          log.error('Falha crítica ao salvar perfil', error)
          set({
            error: error?.message || 'Erro desconhecido ao salvar perfil',
            isSaving: false,
            saveInProgress: false,
          })
        }
      },
      
      /**
       * Define perfil manualmente
       */
      setProfile: (profile) => {
        log.debug('setProfile', { userId: profile?.id })
        set({ 
          profile, 
          lastUpdate: profile ? Date.now() : 0,
          error: null,
        })
      },
      
      /**
       * Limpa perfil (usado no logout)
       */
      clearProfile: () => {
        log.info('Limpando perfil')
        set({
          profile: null,
          isLoading: false,
          isSaving: false,
          error: null,
          lastUpdate: 0,
          loadInProgress: false,
          saveInProgress: false,
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
      name: 'profile-storage',
      // Persistir apenas dados essenciais
      partialize: (state) => ({
        profile: state.profile,
        lastUpdate: state.lastUpdate,
      }),
    }
  )
)

/**
 * Hook helper para obter apenas o perfil
 */
export function useProfile() {
  return useProfileStore((state) => state.profile)
}

/**
 * Hook helper para obter status de carregamento
 */
export function useProfileLoading() {
  return useProfileStore((state) => ({
    isLoading: state.isLoading,
    isSaving: state.isSaving,
  }))
}

/**
 * Hook helper para obter erro
 */
export function useProfileError() {
  return useProfileStore((state) => state.error)
}

/**
 * Selector otimizado para componentes que precisam de múltiplos campos
 */
export function useProfileState() {
  return useProfileStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
  }))
}

