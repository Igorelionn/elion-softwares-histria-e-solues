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

async function fetchAdminStats(): Promise<AdminStats> {
  // Buscar estatísticas de usuários
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: blockedUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_blocked', true)

  const activeUsers = (totalUsers || 0) - (blockedUsers || 0)

  // Buscar estatísticas de reuniões
  const { count: totalMeetings } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })

  const { count: pendingMeetings } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: completedMeetings } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  return {
    totalUsers: totalUsers || 0,
    blockedUsers: blockedUsers || 0,
    activeUsers,
    totalMeetings: totalMeetings || 0,
    pendingMeetings: pendingMeetings || 0,
    completedMeetings: completedMeetings || 0,
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

