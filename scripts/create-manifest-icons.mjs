import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// Criar ícones para Web App Manifest (com fundo sólido branco)
async function createManifestIcons() {
  try {
    // Criar diretório icons se não existir
    await mkdir(iconsDir, { recursive: true });
    
    const logoPath = join(publicDir, 'logo-black.png');
    
    // Tamanhos para manifest
    const sizes = [
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' },
    ];
    
    console.log('🎨 Criando ícones para Web App Manifest...\n');
    
    for (const { size, name } of sizes) {
      const outputPath = join(iconsDir, name);
      
      // Ler logo e obter suas dimensões
      const logo = sharp(logoPath);
      const logoMetadata = await logo.metadata();
      
      // Calcular tamanho da logo (70% do ícone final)
      const logoMaxSize = Math.round(size * 0.7);
      const logoScale = Math.min(logoMaxSize / logoMetadata.width, logoMaxSize / logoMetadata.height);
      const resizedLogoWidth = Math.round(logoMetadata.width * logoScale);
      const resizedLogoHeight = Math.round(logoMetadata.height * logoScale);
      
      // Redimensionar logo
      const resizedLogo = await logo
        .resize(resizedLogoWidth, resizedLogoHeight, { fit: 'contain' })
        .toBuffer();
      
      // Calcular posição central
      const left = Math.round((size - resizedLogoWidth) / 2);
      const top = Math.round((size - resizedLogoHeight) / 2);
      
      // Criar ícone final com fundo branco
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{
        input: resizedLogo,
        left: left,
        top: top
      }])
      .png({ quality: 100 })
      .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}x${size}) - Logo ${resizedLogoWidth}x${resizedLogoHeight} centralizada`);
    }
    
    console.log('\n🎉 Ícones do manifest criados com sucesso!');
    console.log(`📁 Salvos em: ${iconsDir}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar ícones:', error);
    process.exit(1);
  }
}

createManifestIcons();

