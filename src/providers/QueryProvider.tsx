'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados ficam "fresh" por 30 segundos
            staleTime: 30000,
            // Cache mantido por 10 minutos
            gcTime: 600000,
            // Retry com backoff exponencial
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch ao ganhar foco
            refetchOnWindowFocus: true,
            // Refetch ao reconectar
            refetchOnReconnect: true,
            // Refetch automático desabilitado (apenas manual)
            refetchInterval: false,
          },
          mutations: {
            // Retry em mutations apenas 1 vez
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

