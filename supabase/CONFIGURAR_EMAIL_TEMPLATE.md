# 📧 Configurar Template de Email no Supabase

## 🎯 Objetivo
Personalizar o email de redefinição de senha com logo e design profissional da Elion Softwares.

---

## 📋 Passos para Configuração

### 1. Acessar o Dashboard do Supabase
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **Authentication** > **Email Templates**

### 2. Configurar o Template "Reset Password"
1. No menu lateral, clique em **Reset Password**
2. Você verá o editor de template

### 3. Colar o Template HTML

**Cole o conteúdo do arquivo `supabase/email-templates/reset-password.html` no editor**

Ou use este template simplificado:

```html
<h2>Redefinir Senha</h2>

<p>Olá,</p>

<p>Recebemos uma solicitação para redefinir a senha da sua conta <strong>Elion Softwares</strong>.</p>

<p><a href="{{ .ConfirmationURL }}">Clique aqui para redefinir sua senha</a></p>

<p>Se o link não funcionar, copie e cole este URL no seu navegador:</p>
<p>{{ .ConfirmationURL }}</p>

<p><strong>Este link expira em 1 hora.</strong></p>

<p>Se você não solicitou esta redefinição, ignore este email.</p>

<p>Atenciosamente,<br>Equipe Elion Softwares</p>
```

### 4. Configurar o Subject (Assunto)

Substitua o assunto padrão por:

```
Redefinir Senha - Elion Softwares
```

### 5. Verificar Variáveis Disponíveis

O Supabase fornece estas variáveis automáticas:
- `{{ .ConfirmationURL }}` - Link de redefinição
- `{{ .SiteURL }}` - URL do site
- `{{ .Token }}` - Token (não use diretamente)
- `{{ .TokenHash }}` - Hash do token
- `{{ .CurrentYear }}` - Ano atual

### 6. Salvar

Clique em **Save** no canto superior direito.

---

## 🖼️ Upload do Logo

### Opção 1: Usar Logo Público
Se o logo já está em `/public/logo-white.png`:
- URL será: `https://seu-dominio.com/logo-white.png`
- Substitua `{{ .SiteURL }}/logo-white.png` pelo URL completo

### Opção 2: Upload no Supabase Storage
1. Vá para **Storage**
2. Crie um bucket público chamado `assets`
3. Faça upload do `logo-white.png`
4. Copie a URL pública
5. Substitua no template

---

## ✅ Testar o Email

### Método 1: Via Interface
1. Vá para perfil no seu site
2. Clique em "Redefinir Senha"
3. Clique em "Enviar Link"
4. Verifique o email recebido

### Método 2: Via Dashboard
1. No Supabase Dashboard
2. Vá para **Authentication** > **Users**
3. Clique em um usuário
4. Clique em **Send password reset email**

---

## 🔧 Configurações Adicionais

### Rate Limiting (Opcional)
Para evitar spam, configure rate limiting:
1. **Authentication** > **Rate Limits**
2. Ajuste os limites para password reset

### SMTP Personalizado (Opcional)
Para usar seu próprio servidor SMTP:
1. **Settings** > **Auth**
2. Em "SMTP Settings", configure:
   - Host
   - Port
   - Username
   - Password
   - Sender email

---

## 📱 URLs de Redirecionamento

### Desenvolvimento
```
http://localhost:3000/redefinir-senha
```

### Produção
```
https://seu-dominio.com/redefinir-senha
```

**Configure em:**
1. **Authentication** > **URL Configuration**
2. Adicione URLs permitidas em **Redirect URLs**

---

## 🐛 Troubleshooting

### Email não está chegando?

1. **Verifique spam/lixo eletrônico**

2. **Verifique os logs**:
   - Dashboard > **Logs** > **Auth Logs**
   - Procure por erros de email

3. **Verifique configuração SMTP**:
   - Se usando SMTP customizado, teste credenciais
   - Verifique se o email remetente está verificado

4. **Limites de envio**:
   - Supabase free tier tem limite de emails/hora
   - Upgrade se necessário

5. **URLs permitidas**:
   - Confirme que `https://seu-dominio.com/redefinir-senha` está em Redirect URLs

### Link está expirado?
- Links expiram em 1 hora por padrão
- Configure em **Settings** > **Auth** > **Mailer URL Token Expiry**

---

## 📚 Documentação Oficial

- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Rate Limits](https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting)

---

## ✨ Template Está Pronto!

Após configurar, os emails de redefinição terão:
- ✅ Logo da Elion Softwares
- ✅ Design profissional e responsivo
- ✅ Botão de ação destacado
- ✅ Link alternativo para copiar
- ✅ Aviso de segurança sobre expiração
- ✅ Footer com links úteis

---

**Criado para Elion Softwares**


