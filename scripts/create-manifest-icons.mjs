import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function createManifestIcons() {
  const inputPath = join(__dirname, '../public/favicon.png');
  
  console.log('🎨 Criando ícones do manifest...\n');
  
  for (const size of sizes) {
    const outputPath = join(__dirname, `../public/icon-${size}x${size}.png`);
    
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Criado: icon-${size}x${size}.png`);
  }
  
  console.log('\n🎉 Todos os ícones foram criados com sucesso!');
}

createManifestIcons().catch(console.error);

