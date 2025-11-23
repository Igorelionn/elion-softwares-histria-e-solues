'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface AdminStats {
  totalUsers: number
  blockedUsers: number
  activeUsers: number
  totalMeetings: number
  pendingMeetings: number
  completedMeetings: number
}

// ✅ OTIMIZADO: Usa RPC única ao invés de 6 queries separadas
async function fetchAdminStats(): Promise<AdminStats> {
  // Usar função RPC get_admin_stats (1 query ao invés de 6)
  const { data, error } = await supabase.rpc('get_admin_stats')

  if (error) {
    console.error('[useAdminStats] Erro ao buscar stats via RPC:', error)
    throw error
  }

  // Converter formato do RPC para interface esperada
  return {
    totalUsers: data?.total_users || 0,
    blockedUsers: data?.blocked_users || 0,
    activeUsers: (data?.total_users || 0) - (data?.blocked_users || 0),
    totalMeetings: data?.total_meetings || 0,
    pendingMeetings: data?.pending_meetings || 0,
    completedMeetings: data?.completed_meetings || 0,
  }
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

