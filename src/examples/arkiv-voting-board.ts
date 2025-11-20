import {
  createWalletClient,
  createPublicClient,
  http,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { mendoza } from "@arkiv-network/sdk/chains";
import { stringToPayload, bytesToString } from "@arkiv-network/sdk/utils";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const rpcUrl =
    process.env.ARKIV_RPC_URL || "https://mendoza.hoodi.arkiv.network/rpc";
  const priv = process.env.ARKIV_PRIVATE_KEY as `0x${string}` | undefined;

  if (!priv) {
    throw new Error("Falta ARKIV_PRIVATE_KEY en el entorno (.env)");
  }

  // 1) Clientes
  const walletClient = createWalletClient({
    chain: mendoza,
    transport: http(rpcUrl),
    account: privateKeyToAccount(priv),
  });

  const publicClient = createPublicClient({
    chain: mendoza,
    transport: http(rpcUrl),
  });

  console.log("👋 Address:", walletClient.account.address);

  // 2) Escribir un pequeño registro on-chain (Hello World)
  const { entityKey, txHash } = await walletClient.createEntity({
    payload: stringToPayload("Hello, Arkiv!"),
    contentType: "text/plain",
    attributes: [{ key: "type", value: "hello" }],
    expiresIn: 120, // segundos
  });

  console.log("✅ Hello world creado en Arkiv");
  console.log("🔑 Entity key:", entityKey);
  console.log("🔗 Tx hash:", txHash);

  // 3) Leerlo de vuelta y decodificar a string
  const entity = await publicClient.getEntity(entityKey);
  const data = bytesToString(entity.payload);

  console.log("📦 Data almacenada:", data);
}

main().catch((err) => {
  console.error("❌ Error en Arkiv hello world:", err);
  process.exit(1);
});
