// src/arkiv/clients.ts
import dotenv from "dotenv";
import {
  createWalletClient,
  createPublicClient,
  http,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { mendoza } from "@arkiv-network/sdk/chains";

dotenv.config();

const rpcUrl =
  process.env.ARKIV_RPC_URL || "https://mendoza.hoodi.arkiv.network/rpc";
const priv = process.env.ARKIV_PRIVATE_KEY as `0x${string}` | undefined;

if (!priv) {
  throw new Error("Falta ARKIV_PRIVATE_KEY en .env");
}

export const walletClient = createWalletClient({
  chain: mendoza,
  transport: http(rpcUrl),
  account: privateKeyToAccount(priv),
});

export const publicClient = createPublicClient({
  chain: mendoza,
  transport: http(rpcUrl),
});

console.log("👛 Arkiv wallet address:", walletClient.account.address);
