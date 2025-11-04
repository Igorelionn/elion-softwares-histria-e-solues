# 📸 Como Fazer Upload da Logo para o Email

## 🎯 Objetivo
Fazer a logo aparecer no email de redefinição de senha.

---

## 📋 Método 1: Usar Supabase Storage (RECOMENDADO)

### Passo 1: Criar Bucket Público

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **New bucket**
5. Configure:
   - **Name**: `public-assets`
   - **Public bucket**: ✅ Marque esta opção (IMPORTANTE!)
   - Clique em **Create bucket**

### Passo 2: Fazer Upload da Logo

1. Clique no bucket `public-assets` que você criou
2. Clique em **Upload file**
3. Selecione o arquivo `logo-white.png` da pasta `/public` do seu projeto
4. Clique em **Upload**

### Passo 3: Copiar a URL Pública

1. Após o upload, clique no arquivo `logo-white.png`
2. Clique em **Copy URL** ou **Get public URL**
3. A URL será algo como:
   ```
   https://hcsamadtgyhomrbngfpz.supabase.co/storage/v1/object/public/public-assets/logo-white.png
   ```
4. **Copie esta URL!**

### Passo 4: Atualizar o Template de Email

1. Abra o arquivo `supabase/email-templates/reset-password.html`
2. Encontre a linha da logo (linha ~17):
   ```html
   <img src="{{ .SiteURL }}/logo-white.png" alt="Elion Softwares" style="max-width: 150px; height: auto; margin-bottom: 20px;" />
   ```
3. Substitua pela URL copiada:
   ```html
   <img src="https://SEU-PROJETO.supabase.co/storage/v1/object/public/public-assets/logo-white.png" alt="Elion Softwares" style="max-width: 150px; height: auto; margin-bottom: 20px;" />
   ```
4. Salve o arquivo
5. Copie o conteúdo e cole no **Supabase Dashboard** > **Authentication** > **Email Templates** > **Reset Password**

---

## 📋 Método 2: Usar URL do Site em Produção

Se seu site já está no ar:

1. Certifique-se de que `/public/logo-white.png` existe
2. No template, a URL já está configurada:
   ```html
   <img src="{{ .SiteURL }}/logo-white.png" ... />
   ```
3. O `{{ .SiteURL }}` será substituído automaticamente pela URL do seu site
4. Exemplo: `https://seu-dominio.com/logo-white.png`

**Vantagem**: Não precisa fazer upload no Supabase
**Desvantagem**: Só funciona quando o site estiver publicado

---

## 📋 Método 3: Usar Base64 (Embutir Imagem)

Para garantir que a logo sempre apareça, você pode embutir a imagem diretamente no HTML usando Base64:

### Passo 1: Converter Logo para Base64

**Online:**
1. Acesse: https://base64.guru/converter/encode/image
2. Faça upload do `logo-white.png`
3. Clique em **Encode image to Base64**
4. Copie o código Base64

**Ou use este comando no terminal:**
```bash
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("public/logo-white.png"))

# Linux/Mac
base64 public/logo-white.png
```

### Passo 2: Usar no Template

Substitua a linha da logo por:
```html
<img src="data:image/png;base64,SEU_CODIGO_BASE64_AQUI" alt="Elion Softwares" style="max-width: 150px; height: auto; margin-bottom: 20px;" />
```

**Vantagem**: Funciona sempre, não depende de links externos
**Desvantagem**: Aumenta o tamanho do email

---

## 🎨 Preparar a Logo (Se Necessário)

### Criar Logo Branco

Se você só tem a logo preta e precisa de uma versão branca:

1. Abra a logo no Photoshop/GIMP/Figma
2. Inverta as cores ou mude para branco
3. Exporte como PNG com fundo transparente
4. Salve como `logo-white.png` na pasta `/public`

### Otimizar Tamanho

Para emails, a logo deve ser pequena:
- Largura máxima: 300px
- Formato: PNG com transparência
- Tamanho do arquivo: < 50KB

**Ferramenta online para otimizar:**
https://tinypng.com

---

## ✅ Verificar se Funcionou

### Teste 1: Ver no Navegador
Cole a URL da logo diretamente no navegador:
```
https://seu-projeto.supabase.co/storage/v1/object/public/public-assets/logo-white.png
```
Se aparecer a logo, está correto! ✅

### Teste 2: Enviar Email de Teste
1. No Supabase Dashboard
2. **Authentication** > **Users**
3. Clique em um usuário
4. **Send password reset email**
5. Verifique o email recebido

---

## 🐛 Troubleshooting

### Logo não aparece no email?

1. **Verifique se o bucket é público**
   - Storage > Clique no bucket
   - Deve mostrar "Public" ao lado do nome
   - Se não for, delete e crie novamente marcando "Public bucket"

2. **Teste a URL no navegador**
   - Cole a URL da logo no navegador
   - Deve abrir a imagem
   - Se der erro 404, o caminho está errado

3. **Verifique o CORS**
   - Storage > Configurações do bucket
   - CORS deve permitir acesso público

4. **Cache do email**
   - Alguns clientes de email fazem cache
   - Tente abrir em outro email ou modo anônimo

5. **Use Base64 como fallback**
   - Se nada funcionar, use o Método 3 (Base64)
   - Garante que sempre funciona

---

## 📱 Onde Colocar os Arquivos

### No Seu Projeto (Local)
```
seu-projeto/
├── public/
│   ├── logo.png          ← Logo padrão (preta)
│   └── logo-white.png    ← Logo para email (branca)
└── supabase/
    └── email-templates/
        └── reset-password.html
```

### No Supabase Storage
```
Supabase Storage
└── public-assets (bucket público)
    └── logo-white.png
```

---

## 🎯 Resumo Rápido

**Mais fácil e rápido:**
1. ✅ Criar bucket `public-assets` (público)
2. ✅ Upload do `logo-white.png`
3. ✅ Copiar URL pública
4. ✅ Colar URL no template de email
5. ✅ Salvar no Supabase Dashboard

**Pronto!** 🚀

---

## 📞 Precisa de Ajuda?

Se a logo ainda não aparecer:
1. Compartilhe a URL da logo que você está usando
2. Verifique se o bucket está realmente público
3. Teste a URL no navegador
4. Use o método Base64 como última opção

---

**Criado para Elion Softwares**


