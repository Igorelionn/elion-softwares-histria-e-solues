import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CachedProfile {
  id: string
  full_name: string
  company: string
  avatar_url: string
  role: string
  updated_at: string
  timestamp: number
}

interface CachedAdminData {
  stats: any
  users: any[]
  meetings: any[]
  timestamp: number
}

interface CacheState {
  profileCache: CachedProfile | null
  adminCache: CachedAdminData | null
  lastSync: number
  
  // Actions
  setProfileCache: (profile: CachedProfile | null) => void
  setAdminCache: (data: CachedAdminData | null) => void
  clearProfileCache: () => void
  clearAdminCache: () => void
  clearAllCache: () => void
  invalidateCache: (keys?: string[]) => void
  isProfileCacheValid: () => boolean
  isAdminCacheValid: () => boolean
}

const PROFILE_CACHE_DURATION = 10 * 60 * 1000 // 10 minutos
const ADMIN_CACHE_DURATION = 1 * 60 * 1000 // 1 minuto

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      profileCache: null,
      adminCache: null,
      lastSync: 0,

      setProfileCache: (profile) => 
        set({ 
          profileCache: profile, 
          lastSync: Date.now() 
        }),

      setAdminCache: (data) => 
        set({ 
          adminCache: data, 
          lastSync: Date.now() 
        }),

      clearProfileCache: () => 
        set({ profileCache: null }),

      clearAdminCache: () => 
        set({ adminCache: null }),

      clearAllCache: () => 
        set({ 
          profileCache: null, 
          adminCache: null, 
          lastSync: 0 
        }),

      invalidateCache: (keys) => {
        if (!keys || keys.length === 0) {
          // Limpar tudo
          set({ profileCache: null, adminCache: null })
          return
        }

        const updates: Partial<CacheState> = {}
        
        if (keys.includes('profile')) {
          updates.profileCache = null
        }
        
        if (keys.includes('admin')) {
          updates.adminCache = null
        }

        set(updates)
      },

      isProfileCacheValid: () => {
        const { profileCache } = get()
        if (!profileCache) return false
        
        const age = Date.now() - profileCache.timestamp
        return age < PROFILE_CACHE_DURATION
      },

      isAdminCacheValid: () => {
        const { adminCache } = get()
        if (!adminCache) return false
        
        const age = Date.now() - adminCache.timestamp
        return age < ADMIN_CACHE_DURATION
      },
    }),
    {
      name: 'elion-cache-store',
      storage: createJSONStorage(() => localStorage),
      // Persistir tudo
      partialize: (state) => state,
    }
  )
)

