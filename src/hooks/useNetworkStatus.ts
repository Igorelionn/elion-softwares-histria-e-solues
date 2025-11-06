/**
 * useNetworkStatus - Hook para detectar status de conexão
 * 
 * Monitora se o usuário está online ou offline
 * Útil para mostrar badges e adaptar comportamento
 */

'use client'

import { useState, useEffect } from 'react'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('NETWORK_STATUS')

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  
  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      log.info('Conexão restaurada')
      setIsOnline(true)
      setWasOffline(true)
      
      // Limpar flag após 3 segundos
      setTimeout(() => setWasOffline(false), 3000)
    }
    
    const handleOffline = () => {
      log.warn('Conexão perdida')
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline, // Útil para mostrar "Conexão restaurada" temporariamente
  }
}

