import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function createFavicon() {
  try {
    const inputPath = join(projectRoot, 'public', 'Blue_and_Black_Minimalist_Brand_Logo__20_-removebg-preview.png');
    const outputPath = join(projectRoot, 'public', 'favicon.png');
    
    console.log('Criando favicon a partir da logo...');
    console.log('Input:', inputPath);
    console.log('Output:', outputPath);
    
    // Criar favicon 32x32 (tamanho padrão)
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log('✅ Favicon criado com sucesso!');
    
    // Criar também um apple-touch-icon (180x180)
    const appleTouchPath = join(projectRoot, 'public', 'apple-touch-icon.png');
    await sharp(inputPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(appleTouchPath);
    
    console.log('✅ Apple touch icon criado com sucesso!');
    
    // Atualizar os ícones do manifest também
    const sizes = [192, 512];
    for (const size of sizes) {
      const manifestIconPath = join(projectRoot, 'public', `icon-${size}x${size}.png`);
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(manifestIconPath);
      console.log(`✅ Ícone ${size}x${size} criado com sucesso!`);
    }
    
    console.log('\n🎉 Todos os ícones foram criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar favicon:', error);
    process.exit(1);
  }
}

createFavicon();

