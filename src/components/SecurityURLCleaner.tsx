'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Componente de Segurança: Limpa tokens OAuth da URL
 * 
 * PROBLEMA DE SEGURANÇA:
 * Após login OAuth (Google, etc.), o Supabase retorna tokens na URL:
 * #access_token=xxx&refresh_token=yyy
 * 
 * RISCOS:
 * - Histórico do navegador armazena URLs com tokens
 * - Logs de servidor podem capturar tokens
 * - Compartilhamento acidental de links
 * - Tokens válidos por 1 hora
 * 
 * SOLUÇÃO:
 * Este componente detecta e limpa tokens da URL IMEDIATAMENTE
 * sem recarregar a página, usando history.replaceState
 */
export function SecurityURLCleaner() {
  useEffect(() => {
    // Executar apenas no cliente
    if (typeof window === 'undefined') return

    const cleanURL = async () => {
      try {
        const hash = window.location.hash
        const hasTokens = hash.includes('access_token=') || hash.includes('refresh_token=')

        if (hasTokens) {
                    // 1. Supabase já processou os tokens automaticamente
          // Verificar se a sessão foi estabelecida
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
                      }

          // 2. Limpar a URL IMEDIATAMENTE
          // Usar replaceState para não criar entrada no histórico
          const cleanUrl = window.location.pathname + window.location.search
          
          // Substituir a URL atual sem recarregar
          window.history.replaceState(
            {},
            document.title,
            cleanUrl
          )

          // 3. Limpar também a entrada anterior do histórico (se existir)
          // Isso remove a URL com tokens do histórico
          try {
            window.history.pushState(
              {},
              document.title,
              cleanUrl
            )
            window.history.back()
          } catch (e) {
            // Ignorar erro se não puder manipular histórico
          }

                            }
      } catch (error) {
        console.error('❌ Erro ao limpar URL:', error)
      }
    }

    // Executar imediatamente
    cleanURL()

    // Também executar quando o hash mudar
    window.addEventListener('hashchange', cleanURL)

    return () => {
      window.removeEventListener('hashchange', cleanURL)
    }
  }, [])

  // Componente não renderiza nada
  return null
}

