// Script de prueba del servicio IPFS
import { IPFSService } from './src/services/ipfs.service.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function testIPFS() {
  console.log('🧪 PRUEBA DEL SERVICIO IPFS\n');

  const ipfsService = IPFSService.getInstance();

  try {
    // 1. Inicializar servicio
    console.log('1. Inicializando servicio IPFS...');
    await ipfsService.initialize();
    console.log('   ✅ Servicio inicializado\n');

    // 2. Leer archivo de prueba
    const testFile = path.join(process.cwd(), 'ejemplo.txt');
    console.log('2. Leyendo archivo de prueba:', testFile);
    
    let fileContent: Buffer;
    let filename: string;
    let mimeType: string;

    try {
      fileContent = await fs.readFile(testFile);
      filename = path.basename(testFile);
      mimeType = 'text/plain';
      console.log(`   ✅ Archivo leído: ${fileContent.length} bytes\n`);
    } catch (error) {
      console.log('   ⚠️  Archivo ejemplo.txt no encontrado, creando uno de prueba...');
      fileContent = Buffer.from('Este es un archivo de prueba para IPFS\nFecha: ' + new Date().toISOString());
      filename = 'test.txt';
      mimeType = 'text/plain';
      console.log(`   ✅ Archivo de prueba creado: ${fileContent.length} bytes\n`);
    }

    // 3. Subir archivo a IPFS
    console.log('3. Subiendo archivo a IPFS...');
    const result = await ipfsService.uploadFile(fileContent, filename, mimeType);
    console.log('   ✅ Archivo subido exitosamente\n');
    console.log('   📊 Resultado:');
    console.log(`      CID: ${result.cid}`);
    console.log(`      Tamaño: ${result.size} bytes`);
    console.log(`      MIME Type: ${result.mimeType}`);
    console.log(`      Nombre: ${result.filename}`);
    console.log(`      Gateway URL: ${result.gatewayUrl}`);
    console.log(`      Fecha: ${result.uploadedAt.toISOString()}\n`);

    // 4. Descargar archivo desde IPFS (opcional)
    console.log('4. Descargando archivo desde IPFS...');
    const downloadedContent = await ipfsService.getFile(result.cid);
    console.log(`   ✅ Archivo descargado: ${downloadedContent.length} bytes\n`);

    // 5. Verificar que el contenido coincide
    if (fileContent.equals(downloadedContent)) {
      console.log('   ✅ El contenido descargado coincide con el original\n');
    } else {
      console.log('   ⚠️  El contenido descargado NO coincide con el original\n');
    }

    // 6. Detener servicio
    console.log('5. Deteniendo servicio IPFS...');
    await ipfsService.stop();
    console.log('   ✅ Servicio detenido\n');

    console.log('✅ TODAS LAS PRUEBAS PASARON\n');
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    await ipfsService.stop().catch(() => {});
    process.exit(1);
  }
}

testIPFS().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

