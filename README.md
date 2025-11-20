# Roxium DAO Ops - IPFS Service

Este proyecto implementa un servicio Node/TypeScript para subir archivos a IPFS usando Helia y registrar eventos en Arkiv.

## 📚 Documentación del Proyecto

- **[ROADMAP.md](./ROADMAP.md)** - Roadmap completo y detallado de la implementación
- **[PLAN_DE_ACCION.md](./PLAN_DE_ACCION.md)** - Plan de acción ejecutable paso a paso
- **[EJEMPLOS_CODIGO.md](./EJEMPLOS_CODIGO.md)** - Ejemplos de código para guiar la implementación

## 🎯 Objetivo

Crear un servicio dedicado que:
- Recibe archivos (PDFs e imágenes) desde el frontend
- Los sube a IPFS usando Helia
- Registra los CIDs y metadata en Arkiv (Mendoza testnet)
- Actúa como el "blob store" descentralizado de la arquitectura

## 📋 Estado Actual

Este proyecto actualmente contiene ejemplos básicos de:

- Upload a IPFS usando [Helia](https://github.com/ipfs/helia) y obtener un **CID**.
- Pin de archivos en la red Storacha usando su **CLI**, para obtener una URL pública estable.

## Requirements

- Node.js 18 or higher (recommended)
- npm

## Installation (Helia project)

From the project folder:

```bash
npm install
```

This will install `helia` and `@helia/unixfs`.

## Usage: upload a file to IPFS with Helia

The main script is `upload-file.js`. It accepts a local file path as an argument:

```bash
# Option 1: using npm script
npm run start -- ./path/to/your-file.ext

# Option 2: directly with node
node upload-file.js ./path/to/your-file.ext
```

If you don't pass an argument, it will try to use `./ejemplo.pdf` by default.

### What the `upload-file.js` script does

1. Creates a local Helia node.
2. Reads the given file from the filesystem.
3. Adds it to IPFS using UnixFS.
4. Prints:
   - The content CID.
   - A public gateway URL you can try in a browser, for example:

```text
📦 Archivo subido a IPFS
🔑 CID: baf...
🌍 Gateway: https://ipfs.io/ipfs/baf...
```

## Understanding the CID and the Helia URL

- **CID**: the content identifier; it will always be the same for the same content when using the same hash algorithm.
- **Gateway URL**: `https://ipfs.io/ipfs/<CID>` is a convenient way to request that content from the IPFS network via a public HTTP gateway.

Having a CID **does not guarantee** that a public gateway can retrieve the content immediately. It depends on the presence of nodes that:

- Store that content, and
- Are reachable from the public internet.

## Typical retrieval errors (504 / no providers)

When opening the gateway URL you might see something like:

> 504 Gateway Timeout: no providers found for the CID

This means the gateway asked the network "who has this CID?" and did not find any reachable node providing it within the timeout.

This usually happens when:

- Only your local node has the content.
- Your node is behind a router/NAT/firewall or is already stopped.
- There is no pinning service or other node also storing those blocks.

### How to mitigate it

1. **Verify locally that the CID works**

   You can read the content locally using Helia:

   ```bash
   node - <<'EOF'
   import { createHelia } from 'helia'
   import { unixfs } from '@helia/unixfs'

   const cidStr = 'PUT_YOUR_CID_HERE'

   const helia = await createHelia()
   const fsUnix = unixfs(helia)

   const chunks = []
   for await (const chunk of fsUnix.cat(cidStr)) {
     chunks.push(chunk)
   }

   const content = Buffer.concat(chunks).toString()
   console.log('Content read from local Helia node:\n', content)

   await helia.stop()
   EOF
   ```

   If you see your content, the CID is correct; the problem is just network discovery/providing.

2. **Keep your node running for a while**

   Instead of creating and stopping the node immediately after uploading, you can keep it running for a few minutes so it announces/provides the content on the DHT. The longer it stays online and reachable, the easier for gateways to find it.

3. **Use a pinning service (Storacha)**

   To make content reliably accessible from anywhere (without depending on your local node), we use Storacha as a pinning service. Storacha stores the content in its network (on top of Filecoin + hot storage) and exposes it via gateways like `storacha.link` or `w3s.link`, so public gateways typically can retrieve the CID.

4. **Try other gateways**

   Different gateways may have different visibility and caches. You can try, for example:

   - `https://w3s.link/ipfs/<CID>`
   - `https://dweb.link/ipfs/<CID>`

   If they all return "no providers found", it means nobody reachable on the network is announcing that CID.

## Pin files with Storacha (CLI)

Besides Helia, we use the Storacha CLI to pin files and get a stable public URL.

### Storacha requirements

- Node 18+ (already satisfied if you are using Helia here).
- CLI installed globally:

```bash
npm install -g @storacha/cli
storacha --help
```

### 1. Login and account plan

First authorize an agent and associate it with an account that has a plan (e.g. Starter):

```bash
storacha login your-email@example.com
```

Follow the link you receive by email, choose a plan and wait for it to be configured. Then you can check the plan:

```bash
storacha plan get
```

### 2. Create and use a Space

Everything you upload is associated with a **Space**. A space is like a bucket identified by a DID:

```bash
storacha space create Documents
storacha space ls
```

The output will look like:

```text
* did:key:z6Mk... Documents
```

The `*` indicates which space is currently active.

If needed, you can provision the space (associate it with your account/plan):

```bash
storacha space provision Documents
```

### 3. Upload (pin) your file

From the project folder (or anywhere else):

```bash
cd /Users/faustosaludas/Downloads/helia

storacha up ./ejemplo.txt
```

Example of real output:

```text
🐔 Agent was authorized by did:mailto:gmail.com:fausaludas14
🐔 did:web:starter.web3.storage
✨ Billing account is set
   1 file 0.1KB
🐔 Stored 1 file
🐔 https://storacha.link/ipfs/bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy
```

Here:

- The **CID** is `bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy`.
- The URL `https://storacha.link/ipfs/<CID>` takes you to the content on the Storacha gateway.
- You may also get subdomain-style URLs, for example:

   - `https://bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy.ipfs.w3s.link/`
   - `https://bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy.ipfs.w3s.link/ejemplo.txt`

   Both point to the same CID, but:

   - the URL without `/ejemplo.txt` points to the **root of the DAG/directory** associated with the CID;
   - the URL with `/ejemplo.txt` points directly to the **file** inside that directory.

You can also use other IPFS gateways, for example:

```text
https://ipfs.io/ipfs/bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy/ejemplo.txt
```

### 4. Verify the pinned CID with Helia

You can use Helia to read the same CID that Storacha pinned:

```bash
cd /Users/faustosaludas/Downloads/helia

node - <<'EOF'
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'

const cidStr = 'bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy'

const helia = await createHelia()
const fsUnix = unixfs(helia)

const chunks = []
for await (const chunk of fsUnix.cat(cidStr)) {
   chunks.push(chunk)
}

const content = Buffer.concat(chunks).toString()
console.log('Content read with Helia:\n', content)

await helia.stop()
EOF
```

You should see the original contents of `ejemplo.txt`.

## Final notes

- This project is meant as a minimal example to understand how Helia (IPFS) and Storacha (pinning) work together.
- For production usage, consider:
  - Managing Storacha credentials and spaces securely.
  - Adding persistent records (e.g. a database) so you don't lose the mapping between `cid`, `filename`, `spaceDid`, etc.
  - Improving Helia's network/libp2p configuration if you plan to run it as a long-lived node.
