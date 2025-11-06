/**
 * ErrorBoundary - Componente para capturar erros não tratados
 * 
 * Captura erros em componentes React e exibe UI de fallback
 * Loga erros para debugging e (opcionalmente) envia para serviço externo
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  /**
   * Fallback customizado para exibir quando houver erro
   */
  fallback?: (error: Error, resetError: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary Component
 * 
 * Envolve a aplicação para capturar erros não tratados
 * e prevenir crash completo da aplicação
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }
  
  /**
   * Atualiza o estado quando um erro é capturado
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }
  
  /**
   * Loga informações do erro
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ERROR_BOUNDARY', 'Erro não tratado capturado', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      stack: error.stack,
    })
    
    // Atualizar estado com informações completas
    this.setState({
      error,
      errorInfo,
    })
    
    // Aqui você pode integrar com serviços de erro como:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // Exemplo:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }
  
  /**
   * Reseta o erro e tenta renderizar novamente
   */
  resetError = () => {
    logger.info('ERROR_BOUNDARY', 'Resetando erro, tentando renderizar novamente')
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      // Se foi fornecido um fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }
      
      // Fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ops! Algo deu errado
                </h1>
                <p className="text-gray-600 mt-1">
                  Encontramos um erro inesperado na aplicação
                </p>
              </div>
            </div>
            
            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Detalhes do erro (modo desenvolvimento)
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-red-900 mb-2">
                        Mensagem:
                      </h3>
                      <pre className="bg-white p-3 rounded border border-red-200 text-xs overflow-x-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <h3 className="font-semibold text-sm text-red-900 mb-2">
                          Stack trace:
                        </h3>
                        <pre className="bg-white p-3 rounded border border-red-200 text-xs overflow-x-auto max-h-64">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h3 className="font-semibold text-sm text-red-900 mb-2">
                          Component stack:
                        </h3>
                        <pre className="bg-white p-3 rounded border border-red-200 text-xs overflow-x-auto max-h-64">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
            
            {/* Ações */}
            <div className="flex gap-4">
              <button
                onClick={this.resetError}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tentar novamente
              </button>
              
              <button
                onClick={() => {
                  window.location.href = '/'
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Voltar ao início
              </button>
              
              <button
                onClick={() => {
                  window.location.reload()
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Recarregar página
              </button>
            </div>
            
            {/* Informações adicionais */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Se o problema persistir, por favor:
              </p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Limpe o cache do navegador</li>
                <li>Tente usar uma janela anônima</li>
                <li>Entre em contato com o suporte</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

/**
 * Hook para criar um erro boundary funcional
 * Útil para envolver componentes específicos
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, resetError: () => void) => ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

