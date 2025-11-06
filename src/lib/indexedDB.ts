import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Schema do banco de dados IndexedDB
interface ElionDB extends DBSchema {
  profiles: {
    key: string // user_id
    value: {
      id: string
      full_name: string
      company: string
      avatar_url: string
      role: string
      updated_at: string
      cached_at: number
    }
    indexes: { 'by-cached': number }
  }
  adminData: {
    key: string // 'stats' | 'users' | 'meetings'
    value: {
      type: string
      data: any
      cached_at: number
    }
    indexes: { 'by-cached': number }
  }
  images: {
    key: string // URL da imagem
    value: {
      url: string
      blob: Blob
      cached_at: number
    }
    indexes: { 'by-cached': number }
  }
}

const DB_NAME = 'elion-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ElionDB>> | null = null

// Inicializar banco de dados
async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ElionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store para perfis de usuários
        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', { keyPath: 'id' })
          profileStore.createIndex('by-cached', 'cached_at')
        }

        // Store para dados de admin
        if (!db.objectStoreNames.contains('adminData')) {
          const adminStore = db.createObjectStore('adminData', { keyPath: 'type' })
          adminStore.createIndex('by-cached', 'cached_at')
        }

        // Store para imagens
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'url' })
          imageStore.createIndex('by-cached', 'cached_at')
        }
      },
    })
  }
  return dbPromise
}

// ============================================
// PROFILES
// ============================================

export async function getProfile(userId: string) {
  try {
    const db = await getDB()
    return await db.get('profiles', userId)
  } catch (error) {
    console.error('[IndexedDB] Error getting profile:', error)
    return null
  }
}

export async function setProfile(profile: ElionDB['profiles']['value']) {
  try {
    const db = await getDB()
    await db.put('profiles', profile)
  } catch (error) {
    console.error('[IndexedDB] Error setting profile:', error)
  }
}

export async function deleteProfile(userId: string) {
  try {
    const db = await getDB()
    await db.delete('profiles', userId)
  } catch (error) {
    console.error('[IndexedDB] Error deleting profile:', error)
  }
}

// ============================================
// ADMIN DATA
// ============================================

export async function getAdminData(type: 'stats' | 'users' | 'meetings') {
  try {
    const db = await getDB()
    const result = await db.get('adminData', type)
    return result?.data
  } catch (error) {
    console.error('[IndexedDB] Error getting admin data:', error)
    return null
  }
}

export async function setAdminData(
  type: 'stats' | 'users' | 'meetings',
  data: any
) {
  try {
    const db = await getDB()
    await db.put('adminData', {
      type,
      data,
      cached_at: Date.now(),
    })
  } catch (error) {
    console.error('[IndexedDB] Error setting admin data:', error)
  }
}

export async function deleteAdminData(type: 'stats' | 'users' | 'meetings') {
  try {
    const db = await getDB()
    await db.delete('adminData', type)
  } catch (error) {
    console.error('[IndexedDB] Error deleting admin data:', error)
  }
}

// ============================================
// IMAGES
// ============================================

export async function getImage(url: string) {
  try {
    const db = await getDB()
    const result = await db.get('images', url)
    return result?.blob
  } catch (error) {
    console.error('[IndexedDB] Error getting image:', error)
    return null
  }
}

export async function setImage(url: string, blob: Blob) {
  try {
    const db = await getDB()
    await db.put('images', {
      url,
      blob,
      cached_at: Date.now(),
    })
  } catch (error) {
    console.error('[IndexedDB] Error setting image:', error)
  }
}

export async function deleteImage(url: string) {
  try {
    const db = await getDB()
    await db.delete('images', url)
  } catch (error) {
    console.error('[IndexedDB] Error deleting image:', error)
  }
}

// ============================================
// CACHE CLEANUP
// ============================================

export async function cleanOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  try {
    const db = await getDB()
    const now = Date.now()
    const cutoff = now - maxAge

    // Limpar perfis antigos
    const profiles = await db.getAllFromIndex('profiles', 'by-cached')
    for (const profile of profiles) {
      if (profile.cached_at < cutoff) {
        await db.delete('profiles', profile.id)
      }
    }

    // Limpar dados de admin antigos
    const adminData = await db.getAllFromIndex('adminData', 'by-cached')
    for (const data of adminData) {
      if (data.cached_at < cutoff) {
        await db.delete('adminData', data.type)
      }
    }

    // Limpar imagens antigas
    const images = await db.getAllFromIndex('images', 'by-cached')
    for (const image of images) {
      if (image.cached_at < cutoff) {
        await db.delete('images', image.url)
      }
    }

    console.log('[IndexedDB] Old cache cleaned')
  } catch (error) {
    console.error('[IndexedDB] Error cleaning old cache:', error)
  }
}

// ============================================
// CLEAR ALL
// ============================================

export async function clearAllCache() {
  try {
    const db = await getDB()
    await db.clear('profiles')
    await db.clear('adminData')
    await db.clear('images')
    console.log('[IndexedDB] All cache cleared')
  } catch (error) {
    console.error('[IndexedDB] Error clearing cache:', error)
  }
}

// ============================================
// FALLBACK PARA LOCALSTORAGE
// ============================================

// Se IndexedDB não estiver disponível, usar localStorage como fallback
const idbSupported = typeof window !== 'undefined' && 'indexedDB' in window

export const dbWrapper = {
  getProfile: idbSupported ? getProfile : async (userId: string) => {
    try {
      const data = localStorage.getItem(`profile_${userId}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  setProfile: idbSupported ? setProfile : async (profile: any) => {
    try {
      localStorage.setItem(`profile_${profile.id}`, JSON.stringify(profile))
    } catch (error) {
      console.error('[localStorage] Error setting profile:', error)
    }
  },

  getAdminData: idbSupported ? getAdminData : async (type: string) => {
    try {
      const data = localStorage.getItem(`admin_${type}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  setAdminData: idbSupported ? setAdminData : async (type: string, data: any) => {
    try {
      localStorage.setItem(`admin_${type}`, JSON.stringify(data))
    } catch (error) {
      console.error('[localStorage] Error setting admin data:', error)
    }
  },

  clearAllCache: idbSupported ? clearAllCache : async () => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('profile_') || key.startsWith('admin_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('[localStorage] Error clearing cache:', error)
    }
  },
}

// Limpar cache antigo ao inicializar (uma vez por sessão)
if (typeof window !== 'undefined') {
  cleanOldCache().catch(() => {})
}

