# Arkiv flow for this project

This folder contains a **local Arkiv-style registry** that sits on top of the Helia + Storacha flow from the main project.

It is meant to:

- Show how you can **track uploads** (CIDs) in a structured way.
- Mirror the shape of the data you would later store as **entities on Arkiv Testnet**.
- Stay simple: just Node.js + JSON for now.

## What we already did

### 1. Upload and pin content

From the project root (`../`):

- Use **Helia** (`upload-file.js`) to add a local file to IPFS and obtain its CID.
- Use **Storacha CLI** to pin that file and get a stable public gateway URL.

Example (Storacha):

```bash
storacha space ls          # see your active Space and its DID
storacha up ./ejemplo.txt  # pin the file and get a CID + URL
```

Typical Storacha output:

```text
🐔 Stored 1 file
🐔 https://storacha.link/ipfs/bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy
```

Here:

- CID: `bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy`
- Gateway URL: `https://storacha.link/ipfs/<CID>`
- Space DID: from `storacha space ls` (for example `did:key:z6Mk...`).

### 2. Local Arkiv-style registry script

File: `arkiv/register-upload.js`

This Node.js script writes a record into `arkiv/uploads.json` with the key bits of metadata for each upload:

- `cid`: the IPFS CID.
- `filename`: the local file name (e.g. `ejemplo.txt`).
- `spaceDid`: the DID of the Storacha Space that stored the file.
- `gatewayUrl`: the public HTTP URL to fetch the file.
- `uploadedAt`: timestamp when the record was registered.

You can call it directly:

```bash
node arkiv/register-upload.js \
  --cid <CID> \
  --filename <local_filename> \
  --space-did <SPACE_DID> \
  --gateway-url https://storacha.link/ipfs/<CID>
```

Or via the npm script (from the project root):

```bash
npm run arkiv:register -- \
  --cid <CID> \
  --filename ejemplo.txt \
  --space-did <SPACE_DID> \
  --gateway-url https://storacha.link/ipfs/<CID>
```

After running this, `arkiv/uploads.json` will look like:

```json
[
  {
    "cid": "bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy",
    "filename": "ejemplo.txt",
    "spaceDid": "did:key:z6MkfzjaPXye5EMSYuwZ6XBr642JnDq6nrgQ8QwtpLtLbsnd",
    "gatewayUrl": "https://storacha.link/ipfs/bafybeicn2wobdvgmx4wlqadqg7ybzbnnxogfuejbm4zgocypzckivx2jsy",
    "uploadedAt": "2025-11-19T22:03:57.185Z"
  }
]
```

This file is your **local registry** of uploads, similar to how Arkiv would let you query entities later.

## How this relates to Arkiv

Arkiv lets you store small, queryable entities on a DB-chain. Each entity has:

- A **payload** (e.g. JSON text).
- A list of **attributes** you can query by (key/value pairs).

What we modeled here is exactly the data you would put into such an entity:

- Payload: JSON string containing `{ cid, filename, spaceDid, gatewayUrl }`.
- Attributes (example):
  - `type = "ipfs-upload"`
  - `cid = <CID>`
  - `spaceDid = <SPACE_DID>`
  - maybe `filename = ejemplo.txt`.

Right now we are just writing this to `uploads.json`, but the structure is **ready to be sent to Arkiv** using their TypeScript SDK.

## What is still missing (future work)

To actually write and read these uploads from Arkiv Testnet (Mendoza), we still need to:

1. **Install the Arkiv SDK** in this project:

   - `@arkiv-network/sdk`
   - `dotenv`
   - `tsx` / `typescript` for TypeScript scripts.

2. **Create an Arkiv TS script**, for example `arkiv/ipfs-upload.ts`, that:

   - Reads one entry from `uploads.json` (or takes CLI args like `--cid ...`).
   - Connects to Arkiv Mendoza using your test `PRIVATE_KEY`.
   - Calls `walletClient.createEntity({ ... })` with:
     - `payload`: JSON string of the upload record.
     - `contentType`: `application/json`.
     - `attributes`: keys like `type = ipfs-upload`, `cid = ...`, `spaceDid = ...`.

3. **Optionally create a query script** (e.g. `arkiv/list-uploads.ts`) that:

   - Uses `publicClient.buildQuery()`.
   - Filters by `type = "ipfs-upload"`.
   - Lists all entities you have written for your uploads.

4. **Wire it into npm scripts**, similar to the local registry, so you can run:

   ```bash
   npm run arkiv:onchain-upload -- --index 0
   npm run arkiv:list-uploads
   ```

Once those pieces are added, you will be able to:

- Use Helia + Storacha as now.
- Register locally in `uploads.json`.
- **Push that same record as an Arkiv entity**, and then see/query it on Arkiv Testnet.

For now, this folder documents and implements the **local side** of that flow so you can iterate quickly without needing the chain online yet.
