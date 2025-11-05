# 🔧 Configurar Rate Limit no Supabase

## 📋 Problema Identificado

O rate limit do Supabase está sendo aplicado **globalmente** ou **por IP**, afetando todas as contas quando você testa múltiplas vezes.

---

## 🎯 Solução: Ajustar Configurações no Supabase

### **1️⃣ Acessar Configurações de Autenticação**

1. Acesse o Dashboard do Supabase
2. Navegue manualmente:
   - Dashboard → Seu Projeto
   - Authentication → Configuration
   - Rate Limits

---

### **2️⃣ Ajustar Rate Limits de Email**

**Valores Recomendados:**

#### **Para Desenvolvimento/Teste:**
- **Email rate limit:** 10-20 por hora por email
- **Global rate limit:** Desabilitar ou aumentar significativamente

#### **Para Produção:**
- **Email rate limit:** 3-5 por hora por email
- **Global rate limit:** 50-100 por hora

---

## 🔍 Entendendo os Tipos de Rate Limit

### **1. Rate Limit por Email (Desejado)**
- Limita quantos emails **cada endereço de email** pode receber
- ✅ **Recomendado:** 3-5 por hora em produção
- 🧪 **Teste:** 10-20 por hora

### **2. Rate Limit por IP (Problema Atual)**
- Limita requisições vindas do **mesmo IP**
- ⚠️ **Problema:** Afeta todos os usuários testando do mesmo local
- 🔧 **Solução:** Aumentar limite ou desabilitar em desenvolvimento

### **3. Rate Limit Global**
- Limita requisições totais do projeto
- 🎯 **Ideal:** Alto ou desabilitado

---

## 🔐 Configuração Recomendada Final

### **Para seu caso (Desenvolvimento + Produção no mesmo projeto):**

1. Acesse as configurações de autenticação
2. Procure por:
   - "Email Rate Limit"
   - "Anonymous Users Rate Limit"
   - "Authenticated Users Rate Limit"

3. Configure:
   ```
   Email Rate Limit: 10 por hora (por email)
   Anonymous Rate Limit: 50 por hora (por IP)
   Authenticated Rate Limit: 100 por hora (por usuário)
   ```

4. Salve as alterações

---

## ✅ Após Configurar

1. **Aguarde 5-10 minutos** para o rate limit atual expirar
2. **Tente novamente** com a conta nova
3. **Verifique** se o problema persiste

---

## 🆘 Se o Problema Persistir

O Supabase pode estar aplicando rate limit baseado em:
- 🌐 **IP do servidor Vercel** (não do usuário final)
- 🔒 **Projeto todo** (rate limit global muito restritivo)

**Solução definitiva:**
- Contate o suporte do Supabase
- Solicite aumento dos rate limits
- Ou considere usar um serviço de email externo (SendGrid, AWS SES, etc.)

