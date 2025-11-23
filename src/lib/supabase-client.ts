/**
 * SINGLETON GLOBAL DO SUPABASE CLIENT
 *
 * Este é o ÚNICO ponto de criação do cliente Supabase.
 * Persiste através de hot-reloads usando globalThis.
 *
 * USO:
 * import { getSupabaseClient } from '@/lib/supabase-client'
 * const supabase = getSupabaseClient()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Declaração global para persistir através de hot-reloads
declare global {
  var __supabase_client__: SupabaseClient<Database> | undefined
}

// Variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Cria uma nova instância do Supabase client (uso interno apenas)
 */
function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce',
      debug: false,
      storageKey: `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`,
    },
    global: {
      headers: {
        'x-client-info': 'elion-softwares-web',
        'Connection': 'keep-alive',
      },
      // Timeout de 10s (otimizado após correções de RLS)
      fetch: async (url, options = {}) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            keepalive: true,
          })
          clearTimeout(timeoutId)
          return response
        } catch (error: any) {
          clearTimeout(timeoutId)
          if (error.name === 'AbortError') {
            console.error('🚫 [SUPABASE] Request timeout após 10s:', url)
            throw new Error('Request timeout - a conexão demorou muito para responder')
          }
          throw error
        }
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

/**
 * Obtém a instância singleton do Supabase client
 *
 * Esta é a ÚNICA forma correta de obter o client.
 * Garante que apenas 1 instância existe em toda a aplicação.
 *
 * @returns {SupabaseClient<Database>} Instância singleton do Supabase
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // Se já existe no global, reutilizar
  if (globalThis.__supabase_client__) {
    return globalThis.__supabase_client__
  }

  // Criar nova instância e armazenar no global
  const client = createSupabaseClient()
  globalThis.__supabase_client__ = client

  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('[SUPABASE_CLIENT] ✅ Singleton criado e armazenado em globalThis')
  }

  return client
}

/**
 * Exporta o singleton diretamente para compatibilidade
 * (mas preferir usar getSupabaseClient() para clareza)
 */
export const supabase = getSupabaseClient()

// Helper types para facilitar uso
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type FAQ = Database['public']['Tables']['faq']['Row']
export type FAQInsert = Database['public']['Tables']['faq']['Insert']
export type FAQUpdate = Database['public']['Tables']['faq']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Testimonial = Database['public']['Tables']['testimonials']['Row']
export type TestimonialInsert = Database['public']['Tables']['testimonials']['Insert']
export type TestimonialUpdate = Database['public']['Tables']['testimonials']['Update']

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type AdminUserInsert = Database['public']['Tables']['admin_users']['Insert']
export type AdminUserUpdate = Database['public']['Tables']['admin_users']['Update']

export type AdminAuditLog = Database['public']['Tables']['admin_audit_logs']['Row']
export type AdminAuditLogInsert = Database['public']['Tables']['admin_audit_logs']['Insert']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

