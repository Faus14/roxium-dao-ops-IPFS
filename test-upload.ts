// Test del endpoint de upload
import FormData from 'form-data';
import fs from 'node:fs';
import fetch from 'node-fetch';
import path from 'node:path';

async function testUpload() {
  console.log('🧪 PRUEBA DEL ENDPOINT DE UPLOAD\n');

  // Esperar a que el servidor esté listo
  console.log('1. Esperando a que el servidor esté listo...');
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        serverReady = true;
        console.log('   ✅ Servidor listo\n');
        break;
      }
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!serverReady) {
    console.error('   ❌ Servidor no está disponible');
    process.exit(1);
  }

  // 2. Probar upload completo
  console.log('2. Probando upload completo...');
  try {
    const testFile = path.join(process.cwd(), 'ejemplo.txt');
    
    if (!fs.existsSync(testFile)) {
      console.error('   ❌ Archivo de prueba no encontrado:', testFile);
      process.exit(1);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile));
    formData.append('taskId', 'test-task-123');

    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('   ✅ Upload exitoso\n');
      console.log('   📊 Resultado:');
      console.log(`      CID: ${result.data.cid}`);
      console.log(`      Filename: ${result.data.filename}`);
      console.log(`      Size: ${result.data.size} bytes`);
      console.log(`      MIME Type: ${result.data.mimeType}`);
      console.log(`      Gateway URL: ${result.data.gatewayUrl}`);
      console.log(`      Uploaded At: ${result.data.uploadedAt}\n`);
    } else {
      console.error('   ❌ Error en upload:', result);
      process.exit(1);
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ PRUEBA COMPLETADA\n');
}

testUpload().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

