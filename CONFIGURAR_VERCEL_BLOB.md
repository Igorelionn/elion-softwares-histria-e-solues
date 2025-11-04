# 🎬 Configurar Vercel Blob Storage para Vídeo

Este guia mostra como hospedar vídeos no Vercel Blob Storage mantendo qualidade máxima.

---

## 📋 Passo a Passo Completo

### 1️⃣ Criar Blob Store no Vercel

1. **Acesse o Dashboard do Vercel:**
   - URL: https://vercel.com/dashboard/stores

2. **Crie um novo Blob Store:**
   - Clique em **"Create Database"** ou **"Create Store"**
   - Selecione **"Blob"**
   - Nome sugerido: `elion-videos`
   - Clique em **"Create"**

3. **Conecte ao Projeto:**
   - Selecione o projeto: `elion-softwares-histria-e-solues`
   - Escolha o ambiente: **Production**, **Preview**, **Development** (marque todos)
   - Clique em **"Connect"**

4. **Copie o Token:**
   - Após conectar, você verá: `BLOB_READ_WRITE_TOKEN`
   - **COPIE** esse token (começa com `vercel_blob_rw_...`)
   - ⚠️ **Guarde com segurança** - ele não será mostrado novamente

---

### 2️⃣ Fazer Upload do Vídeo

#### **Opção A: Via Dashboard do Vercel** ⭐ **MAIS FÁCIL**

1. **Acesse o Blob Store:**
   - Vercel Dashboard > Storage > seu-blob-store

2. **Upload Manual:**
   - Clique em **"Upload"**
   - Selecione o vídeo (`Sistema leilão.mp4` ou similar)
   - Aguarde o upload
   - **Copie a URL gerada** (ex: `https://...blob.vercel-storage.com/video.mp4`)

---

#### **Opção B: Via Script (Terminal)**

1. **Configure o token temporariamente:**
   ```powershell
   $env:BLOB_READ_WRITE_TOKEN="seu_token_aqui"
   ```

2. **Execute o script de upload:**
   ```bash
   node scripts/upload-video.mjs "C:\caminho\do\seu\video.mp4"
   ```

3. **Copie a URL gerada** no terminal

---

### 3️⃣ Atualizar o Código

Após obter a URL do vídeo, me envie e eu atualizo o componente automaticamente.

Ou você pode atualizar manualmente:

**Arquivo:** `src/components/ui/developments-section.tsx`

```tsx
// ANTES (YouTube)
<YouTubePlayer videoId="ucmpZlXJ9Go" />

// DEPOIS (Vercel Blob)
<VideoPlayer src="https://sua-url.blob.vercel-storage.com/video.mp4" />
```

---

## 🎯 Vantagens do Vercel Blob

✅ **Qualidade Original** - Sem compressão adicional  
✅ **CDN Global** - Carregamento rápido em qualquer lugar  
✅ **Integração Nativa** - Funciona perfeitamente com Next.js  
✅ **Sem Custos Extras** - Plano gratuito generoso (500GB/mês)  
✅ **Player Customizado** - Controles já implementados  

---

## 📊 Limites do Plano Gratuito

- **Armazenamento:** Até 500GB/mês de transferência
- **Tamanho do arquivo:** Até 500MB por arquivo
- **Uploads:** Ilimitados

---

## 🔧 Otimizar Vídeo (Opcional)

Se o vídeo for muito grande (> 100MB), recomendo otimizar primeiro:

### **Usando Handbrake (Grátis):**

1. **Download:** https://handbrake.fr/
2. **Configurações recomendadas:**
   - Preset: **"Fast 1080p30"**
   - Codec: **H.265 (HEVC)** ou **H.264**
   - Quality: **RF 20-22** (menor = melhor qualidade)
   - Framerate: **30 fps** (ou original)

3. **Resultado esperado:**
   - Qualidade visual: **Excelente (1080p)**
   - Tamanho: **20-40MB** (redução de 70-80%)
   - Compatibilidade: **Todos os navegadores**

---

## 🚀 Próximos Passos

1. ✅ Criar Blob Store no Vercel
2. ✅ Fazer upload do vídeo
3. ✅ Copiar URL gerada
4. ✅ Me enviar a URL
5. ✅ Eu atualizo o código
6. ✅ Deploy automático no Vercel

---

## 📞 Precisa de Ajuda?

- **Dashboard Vercel:** https://vercel.com/dashboard/stores
- **Documentação:** https://vercel.com/docs/storage/vercel-blob
- **Suporte:** https://vercel.com/support

---

## 🎬 Resultado Final

Após configurar, seu vídeo terá:
- ✨ **Qualidade máxima preservada**
- ⚡ **Carregamento ultra-rápido via CDN**
- 🎨 **Player customizado elegante**
- 📱 **Funcionamento em todos os dispositivos**

**Boa sorte!** 🚀

