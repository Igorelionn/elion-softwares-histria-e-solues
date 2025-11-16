import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Criar todos os tamanhos de favicon necessários
async function createAllFavicons() {
  try {
    const inputPath = join(publicDir, 'logo-black.png');
    
    // Tamanhos necessários
    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 48, name: 'favicon-48x48.png' },
      { size: 64, name: 'favicon-64x64.png' },
      { size: 180, name: 'apple-touch-icon.png' },
      { size: 192, name: 'android-chrome-192x192.png' },
      { size: 512, name: 'android-chrome-512x512.png' },
    ];
    
    console.log('🎨 Criando todos os tamanhos de favicon...\n');
    
    for (const { size, name } of sizes) {
      const outputPath = join(publicDir, name);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}x${size})`);
    }
    
    console.log('\n🎉 Todos os favicons criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar favicons:', error);
    process.exit(1);
  }
}

createAllFavicons();

