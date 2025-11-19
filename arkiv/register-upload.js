import fs from 'node:fs/promises'
import path from 'node:path'

const REGISTRY_PATH = path.resolve('arkiv/uploads.json')

/**
 * Register an upload in a local Arkiv-style registry.
 *
 * Usage (from project root):
 *   node arkiv/register-upload.js \
 *     --cid baf... \
 *     --filename ejemplo.txt \
 *     --space-did did:key:... \
 *     --gateway-url https://storacha.link/ipfs/baf...
 */
async function main () {
  const args = parseArgs(process.argv.slice(2))

  const required = ['cid', 'filename', 'spaceDid', 'gatewayUrl']
  for (const key of required) {
    if (!args[key]) {
      console.error(`Missing required argument --${toKebab(key)}`)
      process.exit(1)
    }
  }

  const record = {
    cid: args.cid,
    filename: args.filename,
    spaceDid: args.spaceDid,
    gatewayUrl: args.gatewayUrl,
    uploadedAt: new Date().toISOString()
  }

  const current = await readRegistry()
  current.push(record)
  await writeRegistry(current)

  console.log('✅ Registered upload in arkiv/uploads.json:')
  console.log(JSON.stringify(record, null, 2))
}

function parseArgs (argv) {
  const out = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      continue
    }

    if (key === 'space-did') {
      out.spaceDid = value
    } else if (key === 'gateway-url') {
      out.gatewayUrl = value
    } else if (key === 'cid') {
      out.cid = value
    } else if (key === 'filename') {
      out.filename = value
    }
  }

  return out
}

function toKebab (camel) {
  return camel.replace(/[A-Z]/g, c => '-' + c.toLowerCase())
}

async function readRegistry () {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []
    }
    throw err
  }
}

async function writeRegistry (records) {
  const dir = path.dirname(REGISTRY_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(records, null, 2), 'utf8')
}

main().catch(err => {
  console.error('Error registering upload:', err)
  process.exit(1)
})
