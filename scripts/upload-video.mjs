#!/usr/bin/env node

/**
 * Script para fazer upload de vídeo para Vercel Blob Storage
 * 
 * Como usar:
 * 1. Configure BLOB_READ_WRITE_TOKEN nas variáveis de ambiente do Vercel
 * 2. Copie o token e execute:
 *    BLOB_READ_WRITE_TOKEN=seu_token_aqui node scripts/upload-video.mjs caminho/do/video.mp4
 */

import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { basename } from 'path';

const videoPath = process.argv[2];

if (!videoPath) {
  console.error('❌ Erro: Forneça o caminho do vídeo');
  console.log('Uso: node scripts/upload-video.mjs caminho/do/video.mp4');
  process.exit(1);
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ Erro: BLOB_READ_WRITE_TOKEN não configurado');
  console.log('\n📋 Como configurar:');
  console.log('1. Acesse: https://vercel.com/dashboard/stores');
  console.log('2. Crie um Blob Store ou selecione existente');
  console.log('3. Copie o BLOB_READ_WRITE_TOKEN');
  console.log('4. Execute: BLOB_READ_WRITE_TOKEN=seu_token node scripts/upload-video.mjs video.mp4');
  process.exit(1);
}

async function uploadVideo() {
  try {
    console.log('📤 Fazendo upload do vídeo...');
    console.log(`📁 Arquivo: ${videoPath}`);
    
    const videoBuffer = readFileSync(videoPath);
    const fileName = basename(videoPath);
    
    console.log(`📊 Tamanho: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    const blob = await put(fileName, videoBuffer, {
      access: 'public',
      contentType: 'video/mp4',
    });

    console.log('\n✅ Upload concluído com sucesso!');
    console.log('🔗 URL do vídeo:', blob.url);
    console.log('\n📝 Adicione esta URL no componente:');
    console.log(`   <VideoPlayer src="${blob.url}" />`);
    
  } catch (error) {
    console.error('❌ Erro no upload:', error.message);
    process.exit(1);
  }
}

uploadVideo();

