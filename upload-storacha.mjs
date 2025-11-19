import fs from 'node:fs/promises'
import path from 'node:path'
import * as Client from '@web3-storage/w3up-client'

async function uploadWithStoracha(filePath) {
  // 1. Crear el cliente w3up
  const client = await Client.create()

  // 2. Asegurarnos de tener un space seleccionado
  const space = await client.currentSpace()
  if (!space) {
    console.error('❌ No hay ningún space seleccionado.')
    console.error('   Corre `learnyouw3up` y completa los ejercicios de space/registration/authorization.')
    process.exit(1)
  }

  // 3. Leer el archivo local
  const absolutePath = path.resolve(filePath)
  const content = await fs.readFile(absolutePath)
  const name = path.basename(absolutePath)

  console.log('⬆️  Subiendo archivo a Storacha (w3up)...')

  // 4. Subir el archivo como Blob
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const cid = await client.uploadFile(blob, { name })

  console.log('📦 Archivo subido a Storacha')
  console.log('🔑 CID:', cid.toString())
  console.log('🌍 Gateway (w3s.link): https://w3s.link/ipfs/' + cid.toString())
  console.log('🌍 Gateway (ipfs.io):   https://ipfs.io/ipfs/' + cid.toString())
}

const filepath = process.argv[2] || './ejemplo.txt'

uploadWithStoracha(filepath).catch((err) => {
  console.error('Error subiendo a Storacha:', err)
  process.exit(1)
})