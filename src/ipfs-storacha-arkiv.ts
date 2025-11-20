// ipfs-storacha-arkiv.ts
import fs from "node:fs";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

import { IPFSService } from "./services/ipfs.service.js";

import {
  createWalletClient,
  createPublicClient,
  http,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { mendoza } from "@arkiv-network/sdk/chains";
import { stringToPayload, bytesToString } from "@arkiv-network/sdk/utils";

dotenv.config();

// CONFIGURACIÓN
const SPACE_DID = process.env.STORACHA_SPACE_DID;
if (!SPACE_DID) {
  throw new Error("Falta STORACHA_SPACE_DID en el entorno (.env)");
}

const LOCAL_FILENAME = "bitcoinWhitepaper.pdf";

function runStorachaUp(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("storacha", ["up", filePath], {
      shell: true,
    });

    let output = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`storacha up exited with code ${code}`));
      }

      const lines = output.split(/\r?\n/);
      const urlLine = lines.find((l) =>
        l.includes("https://storacha.link/ipfs/")
      );
      if (!urlLine) {
        return reject(
          new Error(
            "No se encontró URL de Storacha en la salida de storacha up"
          )
        );
      }

      const match = urlLine.match(/(https:\/\/storacha\.link\/ipfs\/[\w]+)/);
      if (!match) {
        return reject(new Error("No se pudo extraer la URL de Storacha"));
      }

      resolve(match[1]);
    });
  });
}

async function main() {
  // 0) Arkiv: preparar clientes usando las ENV existentes
  const rpcUrl =
    process.env.ARKIV_RPC_URL || "https://mendoza.hoodi.arkiv.network/rpc";
  const priv = process.env.ARKIV_PRIVATE_KEY as `0x${string}` | undefined;

  if (!priv) {
    throw new Error("Falta ARKIV_PRIVATE_KEY en el entorno (.env)");
  }

  const walletClient = createWalletClient({
    chain: mendoza,
    transport: http(rpcUrl),
    account: privateKeyToAccount(priv),
  });

  const publicClient = createPublicClient({
    chain: mendoza,
    transport: http(rpcUrl),
  });

  console.log("👛 Arkiv address:", walletClient.account.address);

  const service = IPFSService.getInstance();

  // 1) Asegurarnos de que existe el archivo LOCAL_FILENAME
  if (!fs.existsSync(LOCAL_FILENAME)) {
    const content = "hola como estas";
    fs.writeFileSync(LOCAL_FILENAME, content, "utf-8");
    console.log(`📄 Archivo de ejemplo creado: ${LOCAL_FILENAME}`);
  } else {
    console.log(`📄 Usando archivo existente: ${LOCAL_FILENAME}`);
  }

  const buffer = fs.readFileSync(LOCAL_FILENAME);
  const mimeType = "text/plain";
  const filename = LOCAL_FILENAME;

  console.log("📤 Subiendo archivo a IPFS (Helia)...");
  const result = await service.uploadFile(buffer, filename, mimeType);

  console.log("✅ Resultado de Helia:");
  console.log(JSON.stringify(result, null, 2));

  // 2) Pinnear automáticamente en Storacha usando la CLI
  console.log("\n📌 Pinneando archivo en Storacha (storacha up)...");
  const storachaUrl = await runStorachaUp(`./${LOCAL_FILENAME}`);
  console.log(`✅ Archivo pinneado en Storacha: ${storachaUrl}`);

  // 3) Registrar en Arkiv usando el CID de Helia y la gatewayUrl de Storacha
  const cid = result.cid;
  const gatewayUrl = storachaUrl;

  console.log(
    "\n🧾 Registrando en Arkiv usando CID de Helia y gateway de Storacha..."
  );

  // armamos un payload JSON con la metadata del archivo
  const payloadObject = {
    cid,
    gatewayUrl,
    filename,
    spaceDid: SPACE_DID,
    mimeType,
  };

  const { entityKey, txHash } = await walletClient.createEntity({
    payload: stringToPayload(JSON.stringify(payloadObject)),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "ipfs-file" },
      { key: "cid", value: cid },
      { key: "gatewayUrl", value: gatewayUrl },
      { key: "filename", value: filename },
  { key: "spaceDid", value: SPACE_DID ?? "" },
    ],
    expiresIn: 60 * 60, // 1 hora, ajustable
  });

  console.log("\n✅ Registro creado en Arkiv");
  console.log("🔑 Entity key:", entityKey);
  console.log("🔗 Tx hash:", txHash);

  // 4) Leerlo de vuelta desde Arkiv (opcional, para validar)
  const entity = await publicClient.getEntity(entityKey);
  const decoded = entity.payload
    ? bytesToString(entity.payload as Uint8Array)
    : "<no-payload>";

  console.log("\n📦 Payload decodificado desde Arkiv:");
  console.log(decoded);

  await service.stop();
}

main().catch((err) => {
  console.error("❌ Error en test Helia -> Storacha -> Arkiv:", err);
  process.exit(1);
});
