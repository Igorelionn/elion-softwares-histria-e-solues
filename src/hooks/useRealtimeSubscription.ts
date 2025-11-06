'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook para subscrever a mudanças em tempo real na tabela users
 * Invalida queries relevantes quando detecta mudanças
 */
export function useRealtimeUsers() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('[Realtime] Mudança detectada na tabela users:', payload)
          
          // Invalidar queries de admin
          queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
          
          // Se for o próprio usuário, invalidar perfil também
          queryClient.invalidateQueries({ queryKey: ['profile'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

/**
 * Hook para subscrever a mudanças em tempo real na tabela meetings
 */
export function useRealtimeMeetings() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
        },
        (payload) => {
          console.log('[Realtime] Mudança detectada na tabela meetings:', payload)
          
          // Invalidar queries de admin
          queryClient.invalidateQueries({ queryKey: ['admin', 'meetings'] })
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

/**
 * Hook para subscrever a mudanças no perfil do próprio usuário
 * Mais específico que useRealtimeUsers
 */
export function useRealtimeProfile(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel: RealtimeChannel = supabase
      .channel(`profile-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Perfil atualizado:', payload)
          
          // Invalidar apenas o perfil
          queryClient.invalidateQueries({ queryKey: ['profile'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}

/**
 * Hook combinado para admin (users + meetings)
 */
export function useRealtimeAdmin() {
  useRealtimeUsers()
  useRealtimeMeetings()
}

