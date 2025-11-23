'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/lib/translations'
import { useGlobalAuth } from '@/contexts/GlobalAuthContext'
import { getSupabaseClient } from '@/lib/supabase-client'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations[Language]
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useGlobalAuth()

  // Carrega do localStorage imediatamente (instantâneo)
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userLanguage')
      return (saved as Language) || 'pt'
    }
    return 'pt'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Sincroniza com o banco de dados quando o usuário mudar
  useEffect(() => {
    async function syncLanguage() {
      try {
        setIsLoading(true)

        if (user) {
          const supabase = getSupabaseClient()
          // @ts-ignore - language column may not be in generated types
          const { data: profile, error } = await (supabase as any)
            .from('users')
            .select('language')
            .eq('id', user.id)
            .single()

          // Se a coluna não existir (erro 406), ignorar silenciosamente
          if (error && error.code === '406') {
            console.log('[LanguageContext] Column language not found in users table, using localStorage only')
            setIsLoading(false)
            return
          }

          if (profile?.language && profile.language !== language) {
            const userLang = profile.language as Language
            setLanguageState(userLang)
            localStorage.setItem('userLanguage', userLang)
          }
        } else {
          // Se deslogou, resetar para pt
          setLanguageState('pt')
          localStorage.removeItem('userLanguage')
        }
      } catch (error: any) {
        // Ignorar erros 406 silenciosamente
        if (error?.code !== '406') {
          console.error('Error syncing language:', error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Executa quando user mudar (via GlobalAuthContext)
    syncLanguage()
  }, [user, language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('userLanguage', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
