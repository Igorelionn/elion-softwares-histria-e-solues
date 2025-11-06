import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserState {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setIsAdmin: (isAdmin: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  checkAdmin: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<{
    full_name: string
    company: string
    avatar_url: string
  }>) => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAdmin: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),

      checkAdmin: async () => {
        const { user } = get()
        if (!user) {
          set({ isAdmin: false })
          return
        }

        try {
          set({ isLoading: true, error: null })
          
          const { data: profile, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

          if (error) throw error

          const isAdmin = profile?.role === 'admin'
          set({ isAdmin, isLoading: false })
        } catch (error: any) {
          console.error('[userStore] Erro ao verificar admin:', error)
          set({ isAdmin: false, isLoading: false, error: error.message })
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({ user: null, isAdmin: false, error: null })
        } catch (error: any) {
          console.error('[userStore] Erro ao fazer logout:', error)
          set({ error: error.message })
        }
      },

      updateProfile: async (data) => {
        const { user } = get()
        if (!user) throw new Error('Usuário não autenticado')

        try {
          set({ isLoading: true, error: null })

          const { error } = await supabase
            .from('users')
            .update(data)
            .eq('id', user.id)

          if (error) throw error

          set({ isLoading: false })
        } catch (error: any) {
          console.error('[userStore] Erro ao atualizar perfil:', error)
          set({ isLoading: false, error: error.message })
          throw error
        }
      },
    }),
    {
      name: 'elion-user-store',
      storage: createJSONStorage(() => localStorage),
      // Apenas persistir user e isAdmin (não loading/error)
      partialize: (state) => ({
        user: state.user,
        isAdmin: state.isAdmin,
      }),
    }
  )
)

