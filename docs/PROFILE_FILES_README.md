# 📁 Arquivos de Otimização de Perfil

## Arquivos Criados

### 1. Migrações SQL (`supabase/migrations/`)

#### `20251122223000_create_safe_profile_rpc.sql`
- **O que faz**: Cria funções RPC seguras para buscar e atualizar perfil
- **Funções criadas**:
  - `get_my_profile()` - Busca perfil do usuário autenticado
  - `update_my_profile()` - Atualiza perfil do usuário autenticado
- **Quando usar**: Opção 1 - Funções RPC (Recomendado)

#### `20251122224000_fix_users_rls_policies.sql`
- **O que faz**: Corrige políticas RLS da tabela users
- **Políticas criadas**:
  - `users_select_own` - Usuários veem apenas próprio perfil
  - `users_insert_on_signup` - Permitir inserção durante registro
  - `users_update_own` - Usuários atualizam apenas próprio perfil
  - `users_delete_own` - Usuários deletam apenas próprio perfil
- **Quando usar**: Opção 2 - Corrigir RLS

### 2. Biblioteca TypeScript (`src/lib/`)

#### `profile-rpc.ts`
- **O que faz**: Funções TypeScript para usar RPCs do Supabase
- **Funções exportadas**:
  - `getProfileViaRPC()` - Busca perfil via RPC
  - `getProfileWithTimeout()` - Busca com timeout configurável
  - `updateProfileViaRPC()` - Atualiza perfil via RPC
  - `updateProfileWithTimeout()` - Atualiza com timeout
  - `syncUserMetadataWithDatabase()` - Sincroniza metadata com banco
  - `checkRPCAvailability()` - Verifica se RPCs estão disponíveis
- **Como usar**: Importar e chamar as funções no código

### 3. Exemplo de Implementação (`src/app/perfil/`)

#### `perfil-with-rpc-example.tsx`
- **O que é**: Exemplo completo de página de perfil usando RPCs
- **Características**:
  - Carregamento instantâneo (user_metadata)
  - Sincronização em background via RPC
  - Fallback automático se RPC indisponível
  - Indicador de status de sincronização
  - Tratamento de erros completo
- **Como usar**: Copiar código ou usar como referência

### 4. Documentação (`docs/`)

#### `PROFILE_OPTIMIZATION_GUIDE.md`
- **O que é**: Guia completo com 3 opções de otimização
- **Conteúdo**:
  - Explicação detalhada de cada opção
  - Comparação entre opções
  - Instruções passo a passo
  - Exemplos de código
  - FAQ e troubleshooting
- **Quando ler**: Antes de implementar qualquer opção

#### `PROFILE_FILES_README.md` (este arquivo)
- **O que é**: Índice rápido dos arquivos criados
- **Quando ler**: Para entender o que cada arquivo faz

---

## 🚀 Quick Start

### Para usar Opção 1 (RPC) - Recomendado

1. **Aplicar migração SQL**:
   ```bash
   # Via Supabase CLI
   supabase db push
   
   # OU via painel do Supabase:
   # Copiar conteúdo de 20251122223000_create_safe_profile_rpc.sql
   # Colar no SQL Editor e executar
   ```

2. **Usar no código**:
   ```typescript
   import { getProfileWithTimeout } from '@/lib/profile-rpc'
   
   const profile = await getProfileWithTimeout(3000)
   console.log(profile)
   ```

3. **Ver exemplo completo**:
   - Abrir `src/app/perfil/perfil-with-rpc-example.tsx`
   - Copiar estratégia híbrida (metadata + RPC)

### Para usar Opção 2 (RLS Fix)

1. **Aplicar migração SQL**:
   ```bash
   # Via Supabase CLI
   supabase db push
   
   # OU via painel do Supabase:
   # Copiar conteúdo de 20251122224000_fix_users_rls_policies.sql
   # Colar no SQL Editor e executar
   ```

2. **Testar no SQL Editor**:
   ```sql
   SELECT * FROM users WHERE id = auth.uid();
   ```

3. **Usar queries diretas novamente**:
   ```typescript
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('id', userId)
     .single()
   ```

### Para usar Opção 3 (SSR)

Ver guia completo em `PROFILE_OPTIMIZATION_GUIDE.md` seção "Opção 3".

---

## 📊 Estrutura de Arquivos

```
.
├── supabase/
│   └── migrations/
│       ├── 20251122223000_create_safe_profile_rpc.sql   ← Funções RPC
│       └── 20251122224000_fix_users_rls_policies.sql    ← Correção RLS
├── src/
│   ├── lib/
│   │   └── profile-rpc.ts                               ← Biblioteca RPC
│   └── app/
│       └── perfil/
│           ├── page.tsx                                 ← Versão atual (user_metadata)
│           └── perfil-with-rpc-example.tsx              ← Exemplo com RPC
└── docs/
    ├── PROFILE_OPTIMIZATION_GUIDE.md                    ← Guia completo
    └── PROFILE_FILES_README.md                          ← Este arquivo
```

---

## 🎯 Qual Opção Escolher?

| Se você quer... | Use |
|----------------|-----|
| **Solução rápida e fácil** | Opção 1 (RPC) |
| **Corrigir problema permanentemente** | Opção 2 (RLS Fix) |
| **Melhor performance e SEO** | Opção 3 (SSR) |
| **Combinar vantagens** | Opção 1 + Opção 2 |

---

## 📚 Leitura Recomendada

1. **Começar aqui**: `PROFILE_OPTIMIZATION_GUIDE.md`
2. **Ver exemplo prático**: `src/app/perfil/perfil-with-rpc-example.tsx`
3. **Entender SQL**: Ler comentários nas migrações SQL
4. **API Reference**: Documentação inline em `src/lib/profile-rpc.ts`

---

## ❓ Precisa de Ajuda?

- **Erros na migração**: Verificar logs no SQL Editor do Supabase
- **RPCs não funcionam**: Executar `checkRPCAvailability()` para debug
- **Timeout ainda ocorre**: Verificar se migração foi aplicada com sucesso
- **Dúvidas sobre implementação**: Ver exemplo em `perfil-with-rpc-example.tsx`

---

## ✅ Checklist de Implementação

### Opção 1 (RPC)
- [ ] Aplicar migração `20251122223000_create_safe_profile_rpc.sql`
- [ ] Testar `SELECT * FROM get_my_profile()` no SQL Editor
- [ ] Importar `profile-rpc.ts` no código
- [ ] Implementar estratégia híbrida (metadata + RPC)
- [ ] Testar carregamento e salvamento

### Opção 2 (RLS Fix)
- [ ] Aplicar migração `20251122224000_fix_users_rls_policies.sql`
- [ ] Testar `SELECT * FROM users WHERE id = auth.uid()`
- [ ] Verificar que não há timeout
- [ ] Voltar a usar queries diretas no código
- [ ] Testar todas as operações (SELECT, UPDATE, DELETE)

### Opção 3 (SSR)
- [ ] Ler seção "Opção 3" em `PROFILE_OPTIMIZATION_GUIDE.md`
- [ ] Criar Server Actions
- [ ] Refatorar página para Server Component
- [ ] Criar Client Components para interatividade
- [ ] Testar renderização no servidor

---

**Última atualização**: 22/11/2024
**Versão**: 1.0.0

