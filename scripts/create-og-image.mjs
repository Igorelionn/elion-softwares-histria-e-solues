import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Criar imagem Open Graph (1200x630) com a logo centralizada
async function createOGImage() {
  try {
    const logoPath = join(publicDir, 'logo-black.png');
    const outputPath = join(publicDir, 'og-image.png');
    
    // Ler a logo
    const logo = sharp(logoPath);
    const logoMetadata = await logo.metadata();
    
    // Redimensionar logo para caber bem na imagem OG (máximo 800px de largura)
    const maxLogoWidth = 800;
    const logoScale = Math.min(maxLogoWidth / logoMetadata.width, 1);
    const resizedLogoWidth = Math.round(logoMetadata.width * logoScale);
    const resizedLogoHeight = Math.round(logoMetadata.height * logoScale);
    
    const resizedLogo = await logo
      .resize(resizedLogoWidth, resizedLogoHeight, { fit: 'contain' })
      .toBuffer();
    
    // Criar imagem de fundo branco 1200x630
    const ogWidth = 1200;
    const ogHeight = 630;
    
    // Calcular posição central
    const left = Math.round((ogWidth - resizedLogoWidth) / 2);
    const top = Math.round((ogHeight - resizedLogoHeight) / 2);
    
    // Criar imagem final
    await sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
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
    
    console.log('✅ Imagem Open Graph criada com sucesso!');
    console.log(`📐 Tamanho: ${ogWidth}x${ogHeight}`);
    console.log(`🖼️  Logo: ${resizedLogoWidth}x${resizedLogoHeight}`);
    console.log(`📁 Arquivo: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar imagem OG:', error);
    process.exit(1);
  }
}

createOGImage();

