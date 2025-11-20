import { IPFSService } from './services/ipfs.service.js';
import fs from 'node:fs';

async function main() {
  const service = IPFSService.getInstance();

  // Crear archivo de prueba con el contenido solicitado
  const content = 'hola como estas';
  const filePath = 'hola-como-estas.txt';
  fs.writeFileSync(filePath, content, 'utf-8');

  const buffer = fs.readFileSync(filePath);
  const mimeType = 'text/plain';
  const filename = 'hola-como-estas.txt';

  console.log('📄 Archivo local creado:', { filePath, size: buffer.length });

  // Subir a IPFS usando el servicio
  const result = await service.uploadFile(buffer, filename, mimeType);

  console.log('✅ Resultado de upload a IPFS:');
  console.log(JSON.stringify(result, null, 2));

  // Leer de vuelta desde IPFS para verificar contenido
  const downloaded = await service.getFile(result.cid);
  console.log('📥 Contenido descargado desde IPFS:');
  console.log(downloaded.toString('utf-8'));

  await service.stop();
}

main().catch((err) => {
  console.error('❌ Error en test IPFS (hola como estas):', err);
  process.exit(1);
});
