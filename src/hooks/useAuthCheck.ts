import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para verificar autenticação antes de navegar
 * Se não estiver logado, retorna false para abrir o popup de login
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
      
      // Timeout de 3 segundos para a verificação
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      );

      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]);

      if (error) {
        console.error('❌ [AUTH_CHECK] Erro ao verificar sessão:', error);
        setIsChecking(false);
        return false;
      }

      const isAuthenticated = !!session?.user;
      console.log(
        isAuthenticated 
          ? '✅ [AUTH_CHECK] Usuário autenticado' 
          : '❌ [AUTH_CHECK] Usuário NÃO autenticado'
      );
      
      setIsChecking(false);
      return isAuthenticated;
    } catch (error: any) {
      console.error('❌ [AUTH_CHECK] Erro crítico:', error);
      
      // Se timeout, tentar fallback com getUser
      if (error?.message?.includes('timeout')) {
        console.log('⚠️ [AUTH_CHECK] Timeout - tentando fallback...');
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const isAuthenticated = !!user;
          console.log(
            isAuthenticated 
              ? '✅ [AUTH_CHECK] Fallback: Usuário autenticado' 
              : '❌ [AUTH_CHECK] Fallback: Usuário NÃO autenticado'
          );
          setIsChecking(false);
          return isAuthenticated;
        } catch (fallbackError) {
          console.error('❌ [AUTH_CHECK] Fallback falhou:', fallbackError);
        }
      }
      
      setIsChecking(false);
      return false;
    }
  }, []);

  return { checkAuth, isChecking };
};

