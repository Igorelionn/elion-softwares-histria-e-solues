/**
 * @deprecated Este arquivo está obsoleto. Use '@/lib/supabase-client' em vez disso.
 *
 * MIGRAÇÃO:
 * Antes: import { supabase } from '@/lib/supabase'
 * Depois: import { getSupabaseClient } from '@/lib/supabase-client'
 *
 * Este arquivo será removido em uma versão futura.
 */

import { getSupabaseClient } from './supabase-client'

// Re-exportar o singleton para compatibilidade temporária
export const supabase = getSupabaseClient()

// Re-exportar tipos
export type {
  Lead,
  LeadInsert,
  LeadUpdate,
  FAQ,
  FAQInsert,
  FAQUpdate,
  Project,
  ProjectInsert,
  ProjectUpdate,
  Testimonial,
  TestimonialInsert,
  TestimonialUpdate,
  Contact,
  ContactInsert,
  ContactUpdate,
  AdminUser,
  AdminUserInsert,
  AdminUserUpdate,
  AdminAuditLog,
  AdminAuditLogInsert,
  User,
  UserInsert,
  UserUpdate,
} from './supabase-client'

// Avisar em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] src/lib/supabase.ts está obsoleto. ' +
    'Use "@/lib/supabase-client" com getSupabaseClient() em vez disso.'
  )
}
