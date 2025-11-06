/**
 * AuthProvider - Provider Global de Autenticação
 * 
 * Gerencia o listener único de autenticação para toda a aplicação
 * Previne múltiplos listeners e deduplica eventos
 */

'use client'

import { useEffect, useRef } from 'react'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('AUTH_PROVIDER')

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider Component
 * 
 * Este componente deve ser usado APENAS UMA VEZ no root da aplicação (layout.tsx)
 * Ele registra um único listener global de autenticação e gerencia o estado
 * através do authStore do Zustand
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Ref para rastrear o último evento processado (deduplicação)
  const lastEventRef = useRef<{
    type: AuthChangeEvent | ''
    timestamp: number
  }>({ type: '', timestamp: 0 })
  
  // Ref para rastrear se já inicializamos
  const initializedRef = useRef(false)
  
  // Ref para operações em andamento (prevenir concorrência)
  const processingRef = useRef(false)
  
  useEffect(() => {
    log.info('AuthProvider montado - Inicializando autenticação')
    
    // Sincronizar sessão inicial apenas uma vez
    if (!initializedRef.current) {
      initializedRef.current = true
      useAuthStore.getState().syncSession()
    }
    
    // Registrar listener ÚNICO de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        
        // DEDUPLICAÇÃO: Ignorar eventos duplicados em 500ms
        const now = Date.now()
        const timeSinceLastEvent = now - lastEventRef.current.timestamp
        const isSameEvent = lastEventRef.current.type === event
        
        if (isSameEvent && timeSinceLastEvent < 500) {
          log.warn(`Evento duplicado ignorado: ${event} (${timeSinceLastEvent}ms)`)
          return
        }
        
        // Atualizar referência do último evento
        lastEventRef.current = { type: event, timestamp: now }
        
        // FILA: Verificar se devemos processar este evento (através do store)
        if (!useAuthStore.getState()._shouldProcessEvent(event)) {
          log.warn(`Evento filtrado pela fila: ${event}`)
          return
        }
        
        // PROTEÇÃO ANTI-CONCORRÊNCIA: Não processar se já estiver processando
        if (processingRef.current) {
          log.warn(`Evento ignorado (processamento em andamento): ${event}`)
          return
        }
        
        processingRef.current = true
        
        try {
          log.info(`Processando evento de auth: ${event}`, {
            userId: session?.user?.id,
            hasSession: !!session,
          })
          
          // Processar diferentes tipos de eventos
          switch (event) {
            case 'SIGNED_IN':
              log.success('Usuário autenticado', { userId: session?.user?.id })
              useAuthStore.getState().setUser(session?.user || null)
              break
              
            case 'SIGNED_OUT':
              log.info('Usuário deslogado')
              useAuthStore.getState().clearState()
              break
              
            case 'TOKEN_REFRESHED':
              // Token refreshed silenciosamente - apenas atualizar se usuário mudou
              const currentUser = useAuthStore.getState().user
              if (session?.user?.id !== currentUser?.id) {
                log.info('Token refreshed com novo usuário', {
                  oldId: currentUser?.id,
                  newId: session?.user?.id,
                })
                useAuthStore.getState().setUser(session?.user || null)
              } else {
                log.debug('Token refreshed (sem mudança de usuário)')
              }
              break
              
            case 'USER_UPDATED':
              // Usuário atualizado - atualizar dados
              log.info('Dados do usuário atualizados')
              if (session?.user) {
                useAuthStore.getState().setUser(session.user)
              }
              break
              
            case 'PASSWORD_RECOVERY':
              log.info('Recuperação de senha iniciada')
              break
              
            default:
              log.debug(`Evento não tratado: ${event}`)
          }
        } catch (error: any) {
          log.error(`Erro ao processar evento ${event}`, error)
        } finally {
          processingRef.current = false
        }
      }
    )
    
    // Listener para quando a aba volta ao foco
    // Revalida a sessão sem forçar reload
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        log.debug('Aba voltou ao foco, revalidando sessão')
        
        // Não revalidar se já estiver processando algo
        if (processingRef.current) {
          log.debug('Processamento em andamento, ignorando revalidação')
          return
        }
        
        // Sincronizar sessão silenciosamente
        try {
          await useAuthStore.getState().syncSession()
        } catch (error) {
          log.error('Erro ao revalidar sessão no foco', error)
        }
      }
    }
    
    // Listener para quando a janela ganha foco
    const handleWindowFocus = async () => {
      log.debug('Janela ganhou foco')
      
      // Apenas sincronizar se passou tempo suficiente desde a última sync
      const lastSync = useAuthStore.getState().lastSync
      const now = Date.now()
      
      if (lastSync > 0 && now - lastSync < 30000) {
        // Se sincronizou há menos de 30s, não fazer nada
        log.debug('Sync recente, ignorando')
        return
      }
      
      if (!processingRef.current) {
        try {
          await useAuthStore.getState().syncSession()
        } catch (error) {
          log.error('Erro ao sincronizar no foco da janela', error)
        }
      }
    }
    
    // Registrar listeners de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    
    // Cleanup ao desmontar
    return () => {
      log.info('AuthProvider desmontado - Limpando listeners')
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez no mount
  
  return <>{children}</>
}

