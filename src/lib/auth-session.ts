'use client'

/**
 * @deprecated
 * Este arquivo está DEPRECATED e será removido em versões futuras.
 * 
 * Use o novo sistema de gerenciamento de estado:
 * - `import { useAuthState } from '@/stores/authStore'` para consumir estado de auth
 * - O AuthProvider em layout.tsx gerencia o listener único
 * 
 * Este arquivo é mantido apenas para compatibilidade temporária.
 */

import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

console.warn('[DEPRECATED] auth-session.ts está deprecated. Use authStore em vez disso.')

// Global variable to persist across Fast Refresh
declare global {
  var _authSessionInstance: AuthSessionManager | undefined
}

// Singleton para gerenciar a sessão globalmente
class AuthSessionManager {
  private currentUser: User | null = null
  private listeners: Set<(user: User | null) => void> = new Set()
  private initialized = false
  private initializing = false

  constructor() {
    this.initialize()
  }

  static getInstance(): AuthSessionManager {
    if (!global._authSessionInstance) {
      global._authSessionInstance = new AuthSessionManager()
    }
    return global._authSessionInstance
  }

  private async initialize() {
    if (this.initialized || this.initializing) {
      return
    }
    
    this.initializing = true

    try {
      // Tenta ler sessão do localStorage primeiro (SÍNCRONO)
      const storedSession = this.getSessionFromStorage()
      
      if (storedSession) {
        this.currentUser = storedSession.user
        this.initialized = true
        this.notifyListeners()
      }
      
      // Depois valida com o Supabase em background (assíncrono)
      const { data: { session } } = await supabase.auth.getSession()
      
      // Atualiza se mudou
      if (session?.user?.id !== this.currentUser?.id) {
        this.currentUser = session?.user ?? null
        this.notifyListeners()
      }
      
      this.initialized = true

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user ?? null
        this.notifyListeners()
      })
    } catch (error) {
      console.error('[AuthSession] Error initializing:', error)
      if (!this.initialized) {
        this.currentUser = null
        this.initialized = true
      }
    } finally {
      this.initializing = false
    }
  }

  private getSessionFromStorage(): { user: User } | null {
    try {
      if (typeof window === 'undefined') return null
      
      // Supabase armazena a sessão como "sb-<project-id>-auth-token"
      const keys = Object.keys(localStorage).filter(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
      
      for (const key of keys) {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          if (parsed?.user) {
            return parsed
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  getUser(): User | null {
    return this.currentUser
  }

  isInitialized(): boolean {
    return this.initialized
  }

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback)
    
    // Chama imediatamente com o estado atual (mesmo se ainda inicializando)
    // Isso garante que o componente sempre recebe um valor inicial
    callback(this.currentUser)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser))
  }
}

export const authSession = AuthSessionManager.getInstance()

