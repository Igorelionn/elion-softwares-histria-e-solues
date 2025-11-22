<!-- aff92a28-7ebd-4c44-a349-991cfad1723d ef7517fd-fbf3-4f86-991c-b29c72e64fb1 -->
# Remover Completamente getSession() que Causa Timeout

## Problema Final Identificado

O timeout de 15s é causado por `await supabase.auth.getSession()` na função `checkUser()` (linha 228). Esta chamada:

1. Trava na segunda visita (F5) por stale connection
2. Demora 15+ segundos para timeout
3. Bloqueia toda a verificação inicial

## Solução: Usar Apenas Auth Listener

O Supabase já tem um listener `onAuthStateChange` que fornece a sessão automaticamente. Não precisamos chamar `getSession()` manualmente.

## Mudanças

### 1. Simplificar `checkUser()` - Remover getSession()

**Arquivo:** `src/app/solicitar-reuniao/page.tsx`

**Linha:** ~226-249

**Remover:**

```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

**Substituir por:**

```typescript
// Obter sessão do listener (já está disponível)
const { data: { user } } = await supabase.auth.getUser();
```

OU melhor ainda:

**Usar abordagem síncrona com auth state:**

```typescript
const checkUser = () => {
  // Não fazer await de nada assíncrono aqui
  // Deixar o listener onAuthStateChange cuidar disso
  setIsCheckingMeeting(false);
};
```

### 2. Mover Lógica para o useEffect Inicial

**Estratégia:**

1. No `useEffect` inicial, verificar se há sessão no localStorage
2. Se houver userId, chamar `checkExistingMeeting` diretamente
3. Se não houver, permitir acesso ao formulário
4. O listener `onAuthStateChange` cuida de mudanças de auth

### 3. Implementação Específica

```typescript
useEffect(() => {
  let isMounted = true;
  
  const safetyTimeout = setTimeout(() => {
    if (isMounted) {
      console.warn('⚠️ TIMEOUT: Forçando fim após 15s');
      setIsCheckingMeeting(false);
    }
  }, 15000);

  const init = async () => {
    try {
      // Tentar obter user de forma síncrona do cache
      const localSession = localStorage.getItem('sb-hcsamadtgyhomrbngfpz-auth-token');
      
      if (localSession) {
        const parsed = JSON.parse(localSession);
        const userId = parsed?.user?.id;
        
        if (userId) {
          setUserId(userId);
          await checkExistingMeeting(userId);
        } else {
          setIsCheckingMeeting(false);
        }
      } else {
        // Sem sessão local = usuário não logado
        setIsCheckingMeeting(false);
      }
    } catch (error) {
      console.error('Erro na inicialização:', error);
      setIsCheckingMeeting(false);
    } finally {
      clearTimeout(safetyTimeout);
    }
  };

  init();

  return () => {
    isMounted = false;
    clearTimeout(safetyTimeout);
  };
}, []);
```

## Alternativa Mais Simples

Se localStorage parsing for complexo:

```typescript
useEffect(() => {
  // Simplesmente desabilitar verificação inicial
  // Deixar o onAuthStateChange cuidar de tudo
  setIsCheckingMeeting(false);
}, []);
```

E no listener:

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await checkExistingMeeting(session.user.id);
      } else {
        setUserId(null);
        setIsCheckingMeeting(false);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

## Resultado Esperado

- ✅ Sem chamadas `getSession()` = Sem timeout
- ✅ Verificação acontece via listener
- ✅ Carregamento instantâneo
- ✅ RPC `check_user_is_admin` continua otimizado

## Arquivos Afetados

- `src/app/solicitar-reuniao/page.tsx` (função checkUser e useEffect inicial)

### To-dos

- [x] Corrigir política RLS que causava recursão em meetings.insert
- [x] Adicionar logs detalhados com console.error e timestamps
- [x] Corrigir TODAS políticas RLS que consultam tabela users
- [x] Remover políticas duplicadas e conflitantes
- [x] Fazer commit e deploy das correções finais
- [x] Testar formulário de reunião no ambiente de produção
- [x] Adicionar Promise.race com timeout de 3s na query supabase.from('users')
- [x] Criar contador de tentativas global (MAX_LOAD_ATTEMPTS = 2)
- [x] Modificar timeout de segurança para verificar contador e desistir após 2 tentativas
- [x] Resetar loadAttempts = 0 no finally quando carga completa
- [x] Adicionar tratamento de erro específico para timeout com mensagem ao usuário
- [x] Testar F5 múltiplas vezes para garantir que sempre carrega ou mostra erro claro
- [x] Adicionar Promise.race com timeout de 3s na query supabase.from('users')
- [x] Criar contador de tentativas global (MAX_LOAD_ATTEMPTS = 2)
- [x] Modificar timeout de segurança para verificar contador e desistir após 2 tentativas
- [x] Resetar loadAttempts = 0 no finally quando carga completa
- [x] Adicionar tratamento de erro específico para timeout com mensagem ao usuário
- [x] Testar F5 múltiplas vezes para garantir que sempre carrega ou mostra erro claro