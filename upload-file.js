import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Script principal para subir archivos a IPFS usando Helia.
 * 
 * Uso:
 *   node upload-file.js ./ruta/al/archivo.ext
 * 
 * Si no se pasa argumento, intenta usar ./ejemplo.txt por defecto.
 */
async function main() {
  // Obtener la ruta del archivo desde los argumentos
  const filePath = process.argv[2] || './ejemplo.txt'
  
  try {
    // Verificar que el archivo existe
    await fs.access(filePath)
    
    console.log('🚀 Iniciando nodo Helia...')
    
    // 1. Crear un nodo Helia local
    const helia = await createHelia()
    const fsUnix = unixfs(helia)
    
    console.log('📖 Leyendo archivo:', filePath)
    
    // 2. Leer el archivo del sistema de archivos
    const fileContent = await fs.readFile(filePath)
    const fileName = path.basename(filePath)
    
    console.log('📤 Subiendo archivo a IPFS...')
    
    // 3. Agregar el archivo a IPFS usando UnixFS
    const cid = await fsUnix.addBytes(fileContent)
    
    // 4. Mostrar resultados
    console.log('\n📦 Archivo subido a IPFS')
    console.log('🔑 CID:', cid.toString())
    console.log('🌍 Gateway: https://ipfs.io/ipfs/' + cid.toString())
    console.log('🌍 Gateway alternativo: https://w3s.link/ipfs/' + cid.toString())
    console.log('🌍 Gateway alternativo: https://dweb.link/ipfs/' + cid.toString())
    
    // Detener el nodo Helia
    await helia.stop()
    
    console.log('\n✅ Proceso completado!')
    console.log('\n💡 Nota: El archivo puede no estar disponible inmediatamente en los gateways públicos.')
    console.log('   Para garantizar disponibilidad, considera usar Storacha para hacer pin del archivo.')
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: El archivo no existe:', filePath)
    } else {
      console.error('❌ Error:', error.message)
    }
    process.exit(1)
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

