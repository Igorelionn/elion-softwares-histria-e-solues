'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Meeting {
  id: string
  user_id: string
  scheduled_for: string
  meeting_type: string
  status: string
  notes: string | null
  admin_notes: string | null
  created_at: string
  // Join with user
  users?: {
    full_name: string
    email: string
  }
}

const PAGE_SIZE = 50

async function fetchMeetings({ pageParam = 0 }) {
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('meetings')
    .select(`
      *,
      users:user_id (
        full_name,
        email
      )
    `, { count: 'exact' })
    .order('scheduled_for', { ascending: false })
    .range(from, to)

  if (error) throw error

  const hasMore = count ? from + PAGE_SIZE < count : false

  return {
    meetings: data as Meeting[],
    nextCursor: hasMore ? pageParam + 1 : undefined,
    totalCount: count || 0,
  }
}

export function useAdminMeetings() {
  return useInfiniteQuery({
    queryKey: ['admin', 'meetings'],
    queryFn: fetchMeetings,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 30000, // 30s
    gcTime: 300000, // 5min
  })
}

// Hook para atualizar status de reunião
export function useUpdateMeetingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      meetingId,
      status,
      adminNotes,
    }: {
      meetingId: string
      status: string
      adminNotes?: string
    }) => {
      const updateData: any = { status }
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes
      }

      const { error } = await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'meetings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// Hook para deletar reunião
export function useDeleteMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'meetings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

