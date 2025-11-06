'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import { useCacheStore } from '@/stores/cacheStore'

interface ProfileData {
  id: string
  full_name: string
  company: string
  avatar_url: string
  role: string
  created_at: string
  updated_at: string
  language?: string
  is_blocked?: boolean
}

// Função para buscar perfil do usuário
async function fetchProfile(): Promise<ProfileData> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    throw new Error('Usuário não autenticado')
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, company, avatar_url, role, created_at, updated_at, language, is_blocked')
    .eq('id', session.user.id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Perfil não encontrado')

  return data as ProfileData
}

// Hook para buscar perfil
export function useProfile() {
  const setIsAdmin = useUserStore((state) => state.setIsAdmin)
  const setProfileCache = useCacheStore((state) => state.setProfileCache)

  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 30000, // 30s
    gcTime: 600000, // 10min
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: (data) => {
      // Atualizar isAdmin no userStore
      setIsAdmin(data.role === 'admin')
      
      // Atualizar cache no cacheStore
      setProfileCache({
        id: data.id,
        full_name: data.full_name,
        company: data.company,
        avatar_url: data.avatar_url,
        role: data.role,
        updated_at: data.updated_at,
        timestamp: Date.now(),
      })
      
      return data
    },
  })
}

// Hook para atualizar perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        throw new Error('Usuário não autenticado')
      }

      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', session.user.id)

      if (error) throw error
    },
    // Optimistic update
    onMutate: async (newData) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['profile'] })

      // Pegar dados anteriores
      const previousProfile = queryClient.getQueryData<ProfileData>(['profile'])

      // Atualizar cache otimisticamente
      if (previousProfile) {
        queryClient.setQueryData<ProfileData>(['profile'], {
          ...previousProfile,
          ...newData,
        })
      }

      return { previousProfile }
    },
    // Se erro, reverter
    onError: (err, newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile)
      }
    },
    // Sempre refetch após sucesso
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// Hook para atualizar avatar
export function useUpdateAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      // Upload da imagem
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar perfil com nova URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      return publicUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

