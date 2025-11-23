import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Variáveis de ambiente para configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente Supabase tipado com o schema do banco de dados
// Configurado com timeout global, retry logic e pool de conexões otimizado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Timeout de 8s para operações de auth (evita travamento)
    flowType: 'pkce',
    debug: false,
    // Reduzir tempo de detecção de sessão
    storageKey: `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`,
  },
  global: {
    headers: {
      'x-client-info': 'elion-softwares-web',
      // Adicionar keep-alive para evitar stale connections
      'Connection': 'keep-alive',
    },
    // ✅ OTIMIZADO: Timeout aumentado para 10s (reduz falsos timeouts após otimizações RLS)
    fetch: async (url, options = {}) => {
      const controller = new AbortController();
      // Timeout aumentado para 10s - queries otimizadas são rápidas, mas dá margem
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          // Adicionar keep-alive nas requisições
          keepalive: true,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error('🚫 [SUPABASE] Request timeout após 10s:', url);
          throw new Error('Request timeout - a conexão demorou muito para responder');
        }
        throw error;
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
