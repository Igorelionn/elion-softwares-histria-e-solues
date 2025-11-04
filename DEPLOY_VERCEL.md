# 🚀 Deploy no Vercel - Passo a Passo

## 📋 Pré-requisitos

- ✅ Conta no GitHub (github.com)
- ✅ Conta no Vercel (vercel.com)
- ✅ Projeto Next.js pronto

---

## 🎯 Passo a Passo Completo

### 1. Preparar o Projeto

#### Verificar se tem `logo-white.png` na pasta `/public`

```
seu-projeto/
├── public/
│   ├── logo.png          ✅
│   └── logo-white.png    ✅ Necessário!
```

Se não tiver, adicione agora!

---

### 2. Criar Repositório no GitHub

#### Opção A: Via GitHub Desktop
1. Abra GitHub Desktop
2. File > Add Local Repository
3. Selecione a pasta do projeto
4. Publish repository
5. Marque **Private** (recomendado)
6. Publish

#### Opção B: Via Terminal
```bash
# Na pasta do projeto
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/nome-do-repo.git
git push -u origin main
```

---

### 3. Deploy no Vercel

#### Passo 1: Acessar Vercel
1. Acesse: https://vercel.com
2. Faça login com GitHub

#### Passo 2: Importar Projeto
1. Clique em **Add New** > **Project**
2. Selecione o repositório do GitHub
3. Clique em **Import**

#### Passo 3: Configurar Projeto
1. **Framework Preset**: Next.js (detecta automaticamente)
2. **Root Directory**: `./` (deixe padrão)
3. **Build Command**: `npm run build` (padrão)
4. **Output Directory**: `.next` (padrão)

#### Passo 4: Configurar Variáveis de Ambiente

Clique em **Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://hcsamadtgyhomrbngfpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
```

**Onde encontrar essas chaves:**
1. Supabase Dashboard > Settings > API
2. Project URL = `NEXT_PUBLIC_SUPABASE_URL`
3. Project API keys > anon public = `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Passo 5: Deploy!
1. Clique em **Deploy**
2. Aguarde 2-3 minutos
3. ✅ Deploy concluído!

---

### 4. Obter URL do Projeto

Após o deploy, você receberá uma URL tipo:
```
https://seu-projeto.vercel.app
```

Ou domínio personalizado:
```
https://elionsoftwares.com
```

---

### 5. Configurar URL no Supabase

#### Passo 1: Adicionar Redirect URLs
1. Supabase Dashboard > Authentication > URL Configuration
2. Em **Redirect URLs**, adicione:
   ```
   https://seu-projeto.vercel.app/redefinir-senha
   https://seu-projeto.vercel.app/*
   ```
3. Save

#### Passo 2: Configurar Site URL
1. Na mesma página, em **Site URL**:
   ```
   https://seu-projeto.vercel.app
   ```
2. Save

---

### 6. Atualizar Template de Email (AUTOMÁTICO!)

✅ **Já está configurado!**

O template usa `{{ .SiteURL }}` que o Supabase substitui automaticamente pela URL configurada:

```html
<img src="{{ .SiteURL }}/logo-white.png" ... />
```

Vai se tornar:
```html
<img src="https://seu-projeto.vercel.app/logo-white.png" ... />
```

**Sem flags de spam!** ✅ Domínio Vercel é confiável.

---

### 7. Testar

1. Cole o template atualizado no Supabase Dashboard
2. **Authentication** > **Email Templates** > **Reset Password**
3. Save
4. Envie um email de teste
5. Verifique se a logo aparece!

---

## 🎨 Estrutura do Projeto no Vercel

```
https://seu-projeto.vercel.app/
├── /                           → Página inicial
├── /perfil                     → Perfil do usuário
├── /redefinir-senha            → Redefinir senha
├── /logo-white.png             → Logo para email ✅
├── /logo.png                   → Logo padrão
└── ... outras páginas
```

---

## 🔄 Deploy Automático

### Configurar CI/CD

Após o primeiro deploy, **todo push no GitHub faz deploy automático**:

```bash
# Fazer mudanças
git add .
git commit -m "Atualizar logo"
git push

# Deploy automático no Vercel! 🚀
```

**Preview deployments:**
- Branches = Preview URLs
- Main/master = Produção

---

## 🌐 Domínio Personalizado (Opcional)

### Adicionar Domínio Próprio

1. Vercel Dashboard > Settings > Domains
2. Adicione seu domínio: `elionsoftwares.com`
3. Configure DNS (Vercel mostra instruções)
4. Aguarde propagação (até 48h)

**Depois:**
```
https://elionsoftwares.com/logo-white.png
```

---

## ✅ Checklist Final

Antes de testar o email, confirme:

- [ ] ✅ Projeto no GitHub
- [ ] ✅ Deploy no Vercel concluído
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ `/logo-white.png` existe em `/public`
- [ ] ✅ URL adicionada nas Redirect URLs do Supabase
- [ ] ✅ Site URL configurado no Supabase
- [ ] ✅ Template de email atualizado e salvo

---

## 🐛 Troubleshooting

### Logo não aparece no email?

1. **Teste a URL no navegador:**
   ```
   https://seu-projeto.vercel.app/logo-white.png
   ```
   Deve mostrar a imagem!

2. **Verifique se o arquivo existe:**
   - Pasta `/public/logo-white.png` no repositório
   - Commit e push feitos
   - Deploy concluído

3. **Cache do Vercel:**
   - Vercel Dashboard > Deployments
   - Latest deployment > Redeploy

4. **Formato da imagem:**
   - Deve ser PNG com fundo transparente
   - Tamanho recomendado: 300x300px
   - Peso: < 50KB

### Build falhou?

```bash
# Testar build localmente
npm run build

# Se passar localmente, verificar:
# - Variáveis de ambiente no Vercel
# - Node version no package.json
# - Dependencies no package.json
```

---

## 📊 Monitoramento

### Analytics do Vercel
- Dashboard > Analytics
- Monitore visitas, performance, erros

### Logs
- Dashboard > Logs
- Ver erros em tempo real

---

## 💡 Dicas

1. **Sempre teste localmente antes:**
   ```bash
   npm run dev
   npm run build
   ```

2. **Use Preview Deployments:**
   - Crie branch para testar
   - Vercel gera URL de preview
   - Merge na main quando ok

3. **Configure Custom Domain:**
   - Mais profissional
   - Melhor para SEO
   - Sem flags de spam

4. **Otimize imagens:**
   - Vercel otimiza automaticamente
   - Use Next.js Image component

---

## 🎯 Resumo Ultra-Rápido

```bash
1. git push → GitHub
2. Vercel.com → Import → Deploy
3. Adicionar variáveis de ambiente
4. Copiar URL do projeto
5. Configurar no Supabase
6. Template já usa {{ .SiteURL }}
7. Testar email
8. ✅ Pronto!
```

**Tempo total: ~10 minutos** ⏱️

---

## 📞 Recursos

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deploy**: https://nextjs.org/docs/deployment
- **Supabase Auth**: https://supabase.com/docs/guides/auth

---

**Criado para Elion Softwares** 🚀

