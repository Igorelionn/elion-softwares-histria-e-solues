import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Redimensionar favicon (diminuir um pouco - de tamanho original para ~85% do tamanho)
async function resizeFavicon() {
  try {
    const inputPath = join(publicDir, 'favicon.png');
    const outputPath = join(publicDir, 'favicon-resized.png');
    
    // Ler a imagem atual
    const metadata = await sharp(inputPath).metadata();
    const currentWidth = metadata.width;
    const currentHeight = metadata.height;
    
    // Calcular novo tamanho (85% do original - "diminuir bem pouco")
    const newWidth = Math.round(currentWidth * 0.85);
    const newHeight = Math.round(currentHeight * 0.85);
    
    console.log(`Tamanho original: ${currentWidth}x${currentHeight}`);
    console.log(`Novo tamanho: ${newWidth}x${newHeight}`);
    
    // Redimensionar
    await sharp(inputPath)
      .resize(newWidth, newHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log('✅ Favicon redimensionado com sucesso!');
    console.log(`📁 Arquivo salvo em: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Erro ao redimensionar favicon:', error);
    process.exit(1);
  }
}

resizeFavicon();

