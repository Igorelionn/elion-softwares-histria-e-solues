'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/lib/translations'
import { supabase } from '@/lib/supabase'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations[Language]
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Carrega do localStorage imediatamente (instantâneo)
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userLanguage')
      return (saved as Language) || 'pt'
    }
    return 'pt'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Sincroniza com o banco de dados em background (não bloqueia renderização)
  useEffect(() => {
    async function syncLanguage() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('language')
            .eq('id', session.user.id)
            .single() as { data: { language: string } | null; error: any }
          
          if (profile?.language && profile.language !== language) {
            const userLang = profile.language as Language
            setLanguageState(userLang)
            localStorage.setItem('userLanguage', userLang)
          }
        }
      } catch (error) {
        console.error('Error syncing language:', error)
      }
    }

    // Executa em background sem bloquear
    syncLanguage()

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('language')
          .eq('id', session.user.id)
          .single() as { data: { language: string } | null; error: any }
        
        if (profile?.language) {
          const userLang = profile.language as Language
          setLanguageState(userLang)
          localStorage.setItem('userLanguage', userLang)
        }
      } else if (event === 'SIGNED_OUT') {
        setLanguageState('pt')
        localStorage.removeItem('userLanguage')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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

