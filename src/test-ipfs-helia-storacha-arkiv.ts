import { IPFSService } from './services/ipfs.service.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

// CONFIGURACIÓN: ajusta estos valores si hace falta
const SPACE_DID = 'did:key:z6MkfzjaPXye5EMSYuwZ6XBr642JnDq6nrgQ8QwtpLtLbsnd';
const LOCAL_FILENAME = 'ejemplo.txt';

function runArkivRegister(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'arkiv:register', '--', ...args], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`arkiv:register exited with code ${code}`));
      }
    });
  });
}

function runStorachaUp(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('storacha', ['up', filePath], {
      shell: true,
    });

    let output = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`storacha up exited with code ${code}`));
      }

      const lines = output.split(/\r?\n/);
      const urlLine = lines.find((l) => l.includes('https://storacha.link/ipfs/'));
      if (!urlLine) {
        return reject(new Error('No se encontró URL de Storacha en la salida de storacha up'));
      }

      const match = urlLine.match(/(https:\/\/storacha\.link\/ipfs\/[\w]+)/);
      if (!match) {
        return reject(new Error('No se pudo extraer la URL de Storacha')); 
      }

      resolve(match[1]);
    });
  });
}

async function main() {
  const service = IPFSService.getInstance();

  // 1) Asegurarnos de que existe el archivo LOCAL_FILENAME (como en tu ejemplo con storacha up ./ejemplo.txt)
  if (!fs.existsSync(LOCAL_FILENAME)) {
    const content = 'hola como estas';
    fs.writeFileSync(LOCAL_FILENAME, content, 'utf-8');
    console.log(`📄 Archivo de ejemplo creado: ${LOCAL_FILENAME}`);
  } else {
    console.log(`📄 Usando archivo existente: ${LOCAL_FILENAME}`);
  }

  const buffer = fs.readFileSync(LOCAL_FILENAME);
  const mimeType = 'text/plain';
  const filename = LOCAL_FILENAME;

  console.log('📤 Subiendo archivo a IPFS (Helia)...');
  const result = await service.uploadFile(buffer, filename, mimeType);

  console.log('✅ Resultado de Helia:');
  console.log(JSON.stringify(result, null, 2));

  // 2) Pinnear automáticamente en Storacha usando la CLI
  console.log('\n� Pinneando archivo en Storacha (storacha up)...');
  const storachaUrl = await runStorachaUp(`./${LOCAL_FILENAME}`);
  console.log(`✅ Archivo pinneado en Storacha: ${storachaUrl}`);

  // 3) Registrar en Arkiv usando el CID de Helia pero la gatewayUrl de Storacha

  const cid = result.cid;
  const gatewayUrl = storachaUrl;

  console.log('\n� Registrando en Arkiv usando CID de Helia y gateway de Storacha...');

  await runArkivRegister([
    '--cid', cid,
    '--filename', filename,
    '--space-did', SPACE_DID,
    '--gateway-url', gatewayUrl,
  ]);

  console.log('\n✅ Flujo completo Helia -> Storacha -> Arkiv ejecutado.');

  await service.stop();
}

main().catch((err) => {
  console.error('❌ Error en test Helia -> Storacha -> Arkiv:', err);
  process.exit(1);
});
