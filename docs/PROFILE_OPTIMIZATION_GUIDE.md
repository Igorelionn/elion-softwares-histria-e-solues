# 🚀 Guia de Otimização de Perfil - 3 Opções Avançadas

Este guia explica **3 opções avançadas** para sincronizar dados do perfil com o banco de dados de forma eficiente, sem timeouts.

## 📋 Situação Atual

Atualmente, a página de perfil usa **apenas `user_metadata`** do Supabase Auth, que é:
- ⚡ **Instantâneo**: Sem queries ao banco
- 🛡️ **Confiável**: Sem timeouts
- ✅ **Funcional**: Todos os dados essenciais disponíveis

**Limitação**: Dados não são sincronizados com a tabela `users` do banco de dados.

---

## 🎯 Opção 1: Funções RPC Seguras (Recomendado)

### O que é?
Funções RPC (Remote Procedure Call) executadas no servidor com `SECURITY DEFINER`, contornando políticas RLS problemáticas.

### Vantagens
- ✅ **Rápido**: Bypassa RLS, sem recursão
- ✅ **Seguro**: Validação no servidor
- ✅ **Simples**: API limpa e fácil de usar
- ✅ **Sem breaking changes**: Funciona com código existente

### Como Implementar

#### 1. Execute a migração SQL
```bash
# A migração já está criada em:
# supabase/migrations/20251122223000_create_safe_profile_rpc.sql

# Para aplicar (no painel do Supabase ou via CLI):
supabase migration up
```

#### 2. Use as funções no código
```typescript
import { getProfileViaRPC, updateProfileViaRPC } from '@/lib/profile-rpc'

// Buscar perfil
const profile = await getProfileViaRPC()
if (profile) {
  console.log('Nome:', profile.full_name)
  console.log('Empresa:', profile.company)
}

// Atualizar perfil
const updated = await updateProfileViaRPC({
  full_name: 'João Silva',
  company: 'Empresa X'
})
```

#### 3. Exemplo completo na página de perfil
```typescript
// src/app/perfil/page.tsx

const carregarPerfil = async (session: any) => {
  // 1. Mostrar dados básicos imediatamente (user_metadata)
  setFullName(session.user.user_metadata?.full_name || '')
  setCompany(session.user.user_metadata?.company || '')
  setLoading(false)

  // 2. Buscar dados completos do banco em background
  try {
    const profile = await getProfileWithTimeout(3000) // 3 segundos
    if (profile) {
      // Atualizar com dados do banco se disponível
      setFullName(profile.full_name)
      setCompany(profile.company)
      setAvatarUrl(profile.avatar_url)
      setIsAdmin(profile.role === 'admin')
    }
  } catch (err) {
    // Silenciosamente ignorar - já temos dados básicos
    console.warn('Dados completos não disponíveis, usando cache')
  }
}
```

### Funções Disponíveis

```typescript
// Buscar perfil com timeout
getProfileWithTimeout(timeoutMs?: number): Promise<Profile | null>

// Atualizar perfil com timeout
updateProfileWithTimeout(params: ProfileUpdateParams, timeoutMs?: number): Promise<Profile | null>

// Sincronizar user_metadata com banco
syncUserMetadataWithDatabase(session: any): Promise<boolean>

// Verificar se RPCs estão disponíveis
checkRPCAvailability(): Promise<boolean>
```

---

## 🎯 Opção 2: Corrigir Políticas RLS

### O que é?
Substituir políticas RLS problemáticas por versões otimizadas sem recursão infinita.

### Vantagens
- ✅ **Solução permanente**: Corrige a raiz do problema
- ✅ **Queries diretas**: Pode usar queries normais novamente
- ✅ **Flexível**: Total controle sobre permissões

### Desvantagens
- ⚠️ **Requer acesso admin**: Precisa de acesso ao painel do Supabase
- ⚠️ **Pode quebrar código existente**: Se outras partes do sistema dependem das políticas antigas

### Como Implementar

#### 1. Execute a migração SQL
```bash
# A migração já está criada em:
# supabase/migrations/20251122224000_fix_users_rls_policies.sql

# Para aplicar (no painel do Supabase ou via CLI):
supabase migration up
```

#### 2. Teste as novas políticas
```sql
-- No SQL Editor do Supabase, execute:
SELECT * FROM users WHERE id = auth.uid();
-- Deve retornar seu perfil SEM timeout
```

#### 3. Volte a usar queries diretas
```typescript
// Agora isso deve funcionar sem timeout:
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### Políticas Criadas

1. **users_select_own**: Usuários veem apenas próprio perfil
2. **users_insert_on_signup**: Permitir inserção durante registro
3. **users_update_own**: Usuários atualizam apenas próprio perfil
4. **users_delete_own**: Usuários deletam apenas próprio perfil

### Políticas de Admin (Opcional)

Descomente no arquivo SQL para habilitar:
- Admins podem ver todos os usuários
- Admins podem atualizar qualquer usuário
- Admins podem deletar usuários (exceto si mesmos)

---

## 🎯 Opção 3: Server-Side Rendering (SSR)

### O que é?
Buscar dados do perfil no servidor (Server Components do Next.js 13+), onde não há limitações de RLS.

### Vantagens
- ✅ **Sem RLS no cliente**: Queries executadas no servidor
- ✅ **SEO friendly**: Dados renderizados no servidor
- ✅ **Seguro**: Credenciais não expostas no cliente

### Desvantagens
- ⚠️ **Requer refatoração**: Transformar página em Server Component
- ⚠️ **Menos interativo**: Precisa de Client Components para interatividade

### Como Implementar

#### 1. Criar Server Action
```typescript
// src/app/actions/profile.ts
'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getServerProfile() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Query no servidor - sem limitações de RLS
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function updateServerProfile(formData: FormData) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const fullName = formData.get('full_name') as string
  const company = formData.get('company') as string

  const { data, error } = await supabase
    .from('users')
    .update({ full_name: fullName, company })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

#### 2. Usar Server Component
```typescript
// src/app/perfil/page.tsx
import { getServerProfile } from '../actions/profile'

export default async function PerfilPage() {
  const profile = await getServerProfile()

  return (
    <div>
      <h1>Perfil de {profile?.full_name}</h1>
      {/* Client Component para forms interativos */}
      <ProfileForm initialData={profile} />
    </div>
  )
}
```

#### 3. Client Component para interatividade
```typescript
// src/components/ProfileForm.tsx
'use client'

import { updateServerProfile } from '@/app/actions/profile'
import { useFormState, useFormStatus } from 'react-dom'

export function ProfileForm({ initialData }) {
  return (
    <form action={updateServerProfile}>
      <input name="full_name" defaultValue={initialData?.full_name} />
      <input name="company" defaultValue={initialData?.company} />
      <button type="submit">Salvar</button>
    </form>
  )
}
```

---

## 📊 Comparação das Opções

| Aspecto | Opção 1: RPC | Opção 2: RLS Fix | Opção 3: SSR |
|---------|-------------|------------------|--------------|
| **Facilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Velocidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Segurança** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Manutenção** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Breaking Changes** | ✅ Não | ⚠️ Possível | ⚠️ Sim |
| **Requer Refatoração** | ✅ Não | ✅ Não | ❌ Sim |

---

## 🎯 Recomendação

### Para começar agora: **Opção 1 (RPC)**
- Mais fácil e rápida de implementar
- Sem breaking changes
- Funciona imediatamente

### Para solução permanente: **Opção 2 (RLS Fix)**
- Corrige problema na raiz
- Depois da migração, tudo funciona normalmente
- Pode combinar com Opção 1 para redundância

### Para apps grandes: **Opção 3 (SSR)**
- Melhor performance e SEO
- Arquitetura mais robusta
- Requer mais trabalho inicial

---

## 🔧 Como Aplicar as Migrações

### Via Supabase CLI (Recomendado)
```bash
# 1. Instalar Supabase CLI se ainda não tiver
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Link com seu projeto
supabase link --project-ref seu-project-ref

# 4. Aplicar migrações
supabase db push

# 5. Verificar status
supabase db remote changes
```

### Via Painel do Supabase
1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo dos arquivos `.sql`
4. Execute cada migração na ordem:
   - `20251122223000_create_safe_profile_rpc.sql`
   - `20251122224000_fix_users_rls_policies.sql`

---

## 🧪 Testando

### Testar RPC
```typescript
import { checkRPCAvailability, getProfileViaRPC } from '@/lib/profile-rpc'

// Verificar se RPCs estão disponíveis
const available = await checkRPCAvailability()
console.log('RPCs disponíveis:', available)

// Buscar perfil
const profile = await getProfileViaRPC()
console.log('Perfil:', profile)
```

### Testar RLS Fix
```sql
-- No SQL Editor do Supabase
SELECT * FROM users WHERE id = auth.uid();
-- Deve retornar imediatamente sem timeout
```

---

## 📚 Referências

- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## ❓ FAQ

### Preciso aplicar todas as opções?
Não! Escolha a que melhor se adequa ao seu caso. **Opção 1 (RPC)** é a mais simples para começar.

### As migrações vão quebrar algo?
Não, elas são aditivas. As funções RPC são novas e a correção de RLS substitui políticas antigas mantendo comportamento similar.

### Posso voltar atrás?
Sim! O código atual (usando apenas user_metadata) sempre funciona como fallback.

### E se eu não tiver acesso ao Supabase?
Use **Opção 3 (SSR)**, que não requer migrações no banco.

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no console do browser
2. Verifique os logs no SQL Editor do Supabase
3. Teste as funções RPC individualmente
4. Revise as políticas RLS aplicadas

**Dica**: Sempre teste em ambiente de desenvolvimento primeiro! 🧪

