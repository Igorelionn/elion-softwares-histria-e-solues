import { useState, useCallback } from 'react';
import { getSessionOptimized } from '@/lib/auth-helpers';

/**
 * Hook para verificar autenticação antes de navegar
 * Se não estiver logado, retorna false para abrir o popup de login
 * OTIMIZADO: Usa getSessionOptimized para evitar timeouts
 */
export const useAuthCheck = () => {
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Verifica se o usuário está logado
   * @returns Promise<boolean> - true se logado, false se não logado
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);

    try {
      console.log('🔐 [AUTH_CHECK] Verificando autenticação...');

      // Usar função otimizada que tenta localStorage primeiro
      const { user, error } = await getSessionOptimized(2000);

      if (error) {
        console.error('❌ [AUTH_CHECK] Erro ao verificar sessão:', error);
        setIsChecking(false);
        return false;
      }

      const isAuthenticated = !!user;
      console.log(
        isAuthenticated
          ? '✅ [AUTH_CHECK] Usuário autenticado'
          : '❌ [AUTH_CHECK] Usuário NÃO autenticado'
      );

      setIsChecking(false);
      return isAuthenticated;
    } catch (error: any) {
      console.error('❌ [AUTH_CHECK] Erro crítico:', error);
      setIsChecking(false);
      return false;
    }
  }, []);

  return { checkAuth, isChecking };
};

