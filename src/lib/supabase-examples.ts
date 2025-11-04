/**
 * EXEMPLOS DE USO DO SUPABASE - ELION SOFTWARES
 * 
 * Este arquivo contém exemplos práticos de como usar o banco de dados
 * em diferentes cenários do projeto.
 */

import { supabase } from './supabase'
import type {
  Lead,
  LeadInsert,
  FAQ,
  Project,
  Testimonial,
  Contact,
  ContactInsert
} from './supabase'

// ============================================
// LEADS (Formulário de Solicitação de Reunião)
// ============================================

/**
 * Criar um novo lead a partir do formulário
 */
export async function createLead(leadData: LeadInsert) {
  const { data, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar lead:', error)
    throw error
  }

  return data
}

/**
 * Buscar leads com filtros (ADMIN)
 */
export async function searchLeads(filters?: {
  status?: string
  dateFrom?: string
  dateTo?: string
  searchText?: string
}) {
  const { data, error } = await (supabase
    // @ts-ignore - search_leads RPC function exists in database
    .rpc('search_leads', {
      p_status: filters?.status || null,
      p_date_from: filters?.dateFrom || null,
      p_date_to: filters?.dateTo || null,
      p_search_text: filters?.searchText || null
    }) as unknown as any)

  if (error) {
    console.error('Erro ao buscar leads:', error)
    return []
  }

  return data
}

/**
 * Obter estatísticas de leads (ADMIN)
 */
export async function getLeadsStatistics() {
  const { data, error } = await (supabase
    // @ts-ignore - get_leads_statistics RPC function exists in database
    .rpc('get_leads_statistics') as unknown as any)

  if (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return null
  }

  return data as {
    total: number
    pending: number
    contacted: number
    in_progress: number
    converted: number
    cancelled: number
    this_month: number
    this_week: number
  }
}

/**
 * Atualizar status de um lead (ADMIN)
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: 'pending' | 'contacted' | 'in_progress' | 'converted' | 'cancelled' | 'archived'
) {
  const { data, error } = await supabase
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar lead:', error)
    throw error
  }

  return data
}

// ============================================
// FAQ (Perguntas Frequentes)
// ============================================

/**
 * Buscar todas as FAQs ativas (PÚBLICO)
 */
export async function getFAQs(category?: string) {
  const { data, error } = await (supabase
    // @ts-ignore - get_faqs_by_category RPC function exists in database
    .rpc('get_faqs_by_category', {
      p_category: category || null
    }) as unknown as any)

  if (error) {
    console.error('Erro ao buscar FAQs:', error)
    return []
  }

  return data as Array<{
    id: string
    question: string
    answer: string
    category: string
    display_order: number
  }>
}

/**
 * Incrementar contador de visualizações de FAQ
 */
export async function incrementFAQView(faqId: string) {
  const { error } = await (supabase
    // @ts-ignore - increment_faq_view RPC function exists in database
    .rpc('increment_faq_view', { faq_id: faqId }) as unknown as any)

  if (error) {
    console.error('Erro ao incrementar visualização:', error)
  }
}

// ============================================
// PROJETOS (Portfólio)
// ============================================

/**
 * Buscar projetos em destaque (PÚBLICO)
 */
export async function getFeaturedProjects(limit = 6) {
  const { data, error } = await (supabase
    // @ts-ignore - get_featured_projects RPC function exists in database
    .rpc('get_featured_projects', { p_limit: limit }) as unknown as any)

  if (error) {
    console.error('Erro ao buscar projetos:', error)
    return []
  }

  return data as Array<{
    id: string
    title: string
    slug: string
    short_description: string
    thumbnail_url: string
    category: string
    technologies: string[]
    views_count: number
  }>
}

/**
 * Buscar projeto por slug (PÚBLICO)
 */
export async function getProjectBySlug(slug: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error('Erro ao buscar projeto:', error)
    return null
  }

  return data as Project
}

/**
 * Buscar projetos relacionados (PÚBLICO)
 */
export async function getRelatedProjects(projectId: string, limit = 3) {
  const { data, error } = await (supabase
    // @ts-ignore - get_related_projects RPC function exists in database
    .rpc('get_related_projects', {
      p_project_id: projectId,
      p_limit: limit
    }) as unknown as any)

  if (error) {
    console.error('Erro ao buscar projetos relacionados:', error)
    return []
  }

  return data as Array<{
    id: string
    title: string
    slug: string
    short_description: string
    thumbnail_url: string
    category: string
  }>
}

/**
 * Incrementar contador de visualizações de projeto
 */
export async function incrementProjectView(projectId: string) {
  const { error } = await (supabase
    // @ts-ignore - increment_project_view RPC function exists in database
    .rpc('increment_project_view', { project_id: projectId }) as unknown as any)

  if (error) {
    console.error('Erro ao incrementar visualização:', error)
  }
}

/**
 * Buscar todos os projetos publicados (PÚBLICO)
 */
export async function getAllPublishedProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar projetos:', error)
    return []
  }

  return data as Project[]
}

// ============================================
// DEPOIMENTOS (Testimonials)
// ============================================

/**
 * Buscar depoimentos em destaque (PÚBLICO)
 */
export async function getFeaturedTestimonials(limit = 6) {
  const { data, error } = await (supabase
    // @ts-ignore - get_featured_testimonials RPC function exists in database
    .rpc('get_featured_testimonials', { p_limit: limit }) as unknown as any)

  if (error) {
    console.error('Erro ao buscar depoimentos:', error)
    return []
  }

  return data as Array<{
    id: string
    client_name: string
    client_role: string
    client_company: string
    client_avatar_url: string
    testimonial_text: string
    rating: number
  }>
}

/**
 * Buscar todos os depoimentos publicados (PÚBLICO)
 */
export async function getAllPublishedTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar depoimentos:', error)
    return []
  }

  return data as Testimonial[]
}

// ============================================
// CONTATOS (Mensagens)
// ============================================

/**
 * Enviar mensagem de contato (PÚBLICO)
 */
export async function sendContact(contactData: ContactInsert) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...contactData,
      source: 'website_form'
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao enviar contato:', error)
    throw error
  }

  return data
}

/**
 * Obter quantidade de contatos não lidos (ADMIN)
 */
export async function getUnreadContactsCount() {
  const { data, error } = await (supabase
    // @ts-ignore - get_unread_contacts_count RPC function exists in database
    .rpc('get_unread_contacts_count') as unknown as any)

  if (error) {
    console.error('Erro ao buscar contatos não lidos:', error)
    return 0
  }

  return data as number
}

/**
 * Marcar contato como lido (ADMIN)
 */
export async function markContactAsRead(contactId: string) {
  const { data, error } = await (supabase
    // @ts-ignore - mark_contact_as_read RPC function exists in database
    .rpc('mark_contact_as_read', { p_contact_id: contactId }) as unknown as any)

  if (error) {
    console.error('Erro ao marcar contato como lido:', error)
    return false
  }

  return data as boolean
}

/**
 * Buscar todos os contatos (ADMIN)
 */
export async function getAllContacts(status?: string) {
  let query = supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar contatos:', error)
    return []
  }

  return data as Contact[]
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Gerar slug URL-friendly
 */
export async function generateSlug(text: string) {
  const { data, error } = await (supabase
    // @ts-ignore - generate_slug RPC function exists in database
    .rpc('generate_slug', { text_input: text }) as unknown as any)

  if (error) {
    console.error('Erro ao gerar slug:', error)
    return text.toLowerCase().replace(/\s+/g, '-')
  }

  return data as string
}

/**
 * Arquivar leads antigos (ADMIN - pode ser usado em cron job)
 */
export async function archiveOldLeads() {
  const { data, error } = await (supabase
    // @ts-ignore - archive_old_leads RPC function exists in database
    .rpc('archive_old_leads') as unknown as any)

  if (error) {
    console.error('Erro ao arquivar leads:', error)
    return 0
  }

  return data as number
}

