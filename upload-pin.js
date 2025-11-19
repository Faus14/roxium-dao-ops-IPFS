import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Web3Storage, File } from 'web3.storage'

function getAccessToken () {
  const token = process.env.WEB3_STORAGE_TOKEN

  if (!token) {
    console.error('❌ Falta la variable de entorno WEB3_STORAGE_TOKEN')
    console.error('   Crea una API key en https://web3.storage y exportala asi:')
    console.error('   export WEB3_STORAGE_TOKEN="TU_TOKEN_AQUI"')
    process.exit(1)
  }

  return token
}

function makeStorageClient () {
  return new Web3Storage({ token: getAccessToken() })
}

async function fileFromPath (filePath) {
  const absolutePath = path.resolve(filePath)
  const content = await fs.readFile(absolutePath)
  const name = path.basename(absolutePath)

  return [new File([content], name)]
}

async function uploadAndPin (filePath) {
  const client = makeStorageClient()
  const files = await fileFromPath(filePath)

  console.log('⬆️  Subiendo archivo a Web3.Storage (IPFS pinning)...')

  const cid = await client.put(files, {
    wrapWithDirectory: false
  })

  console.log('📦 Archivo pineado en Web3.Storage')
  console.log('🔑 CID:', cid)
  console.log('🌍 Gateway (web3.storage): https://w3s.link/ipfs/' + cid)
  console.log('🌍 Gateway (ipfs.io):     https://ipfs.io/ipfs/' + cid)
}

const filepath = process.argv[2] || './ejemplo.txt'

uploadAndPin(filepath).catch((err) => {
  console.error('Error subiendo/pineando archivo:', err)
  process.exit(1)
})
