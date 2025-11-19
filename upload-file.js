import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import fs from 'node:fs/promises'
import path from 'node:path'

async function uploadFile(filepath) {
  // Instanciamos Helia (nodo IPFS local)
  const helia = await createHelia()

  // Creamos manejador de archivos
  const fsUnix = unixfs(helia)

  // Leemos el archivo
  const fileBuffer = await fs.readFile(path.resolve(filepath))

  // Subimos a IPFS
  const cid = await fsUnix.addBytes(fileBuffer)

  console.log('📦 Archivo subido a IPFS')
  console.log('🔑 CID:', cid.toString())
  console.log('🌍 Gateway: https://ipfs.io/ipfs/' + cid.toString())

  await helia.stop()
}

// Soporte para argumento CLI: node upload-file.js <ruta-al-archivo>
const filepath = process.argv[2] || './ejemplo.pdf'
if (!filepath) {
  console.error('Uso: node upload-file.js <ruta-al-archivo>')
  process.exit(1)
}

uploadFile(filepath).catch((err) => {
  console.error('Error subiendo archivo:', err)
  process.exit(1)
})
