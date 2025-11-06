'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  company: string | null
  avatar_url: string | null
  role: string
  is_blocked: boolean
  created_at: string
}

const PAGE_SIZE = 50

async function fetchUsers({ pageParam = 0 }) {
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const hasMore = count ? from + PAGE_SIZE < count : false

  return {
    users: data as User[],
    nextCursor: hasMore ? pageParam + 1 : undefined,
    totalCount: count || 0,
  }
}

export function useAdminUsers() {
  return useInfiniteQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30000, // 30s
    gcTime: 300000, // 5min
  })
}

// Hook para bloquear usuário
export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string
      reason: string
    }) => {
      const { error } = await supabase
        .from('users')
        .update({
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// Hook para desbloquear usuário
export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
        })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// Hook para deletar usuário
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

