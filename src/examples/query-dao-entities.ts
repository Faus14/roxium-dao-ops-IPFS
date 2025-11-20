// src/examples/query-dao-entities.ts
import "dotenv/config";
import { createPublicClient, http } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { bytesToString } from "@arkiv-network/sdk/utils";

async function main() {
  const rpcUrl =
    process.env.ARKIV_RPC_URL || "https://mendoza.hoodi.arkiv.network/rpc";

  const publicClient = createPublicClient({
    chain: mendoza,
    transport: http(rpcUrl),
  });

  console.log("🔎 Arkiv query demo");

  // 👉 Reemplazá esto por las keys reales que te tiró el script de voting-board
  const daoKey =
    "0x0fa365f17e3fc5563f3b495c6557330d6a28422a96077342081bb6528a5c1dd4";
  const proposalKey =
    "0x5994f0df1313f4a28fd3ecfb5208f8e3c3d567c288b5ac2114fa2ffeabb63fa5";

  // 1) Traer DAO por entityKey
  const daoEntity = await publicClient.getEntity(daoKey);
  console.log("\n🏛 DAO entity:");
  console.log("  key:", daoKey);
  console.log("  attrs:", daoEntity.attributes);
  if (daoEntity.payload) {
    console.log("  payload:", bytesToString(daoEntity.payload));
  }

  // 2) Traer Proposal por entityKey
  const proposalEntity = await publicClient.getEntity(proposalKey);
  console.log("\n📜 Proposal entity:");
  console.log("  key:", proposalKey);
  console.log("  attrs:", proposalEntity.attributes);
  if (proposalEntity.payload) {
    console.log("  payload:", bytesToString(proposalEntity.payload));
  }

  // 3) Query: todas las Tasks para esa Proposal
  const result = await publicClient
    .buildQuery()
    .where([
      eq("type", "task"),
      eq("proposalKey", proposalKey),
      // si querés solo activas: eq('status', 'open'),
    ])
    .withAttributes(true)
    .withPayload(true)
    .limit(20)
    .fetch();

  console.log(
    `\n✅ Tasks para proposal ${proposalKey}: ${result.entities.length}`
  );

  for (const ent of result.entities) {
    const attrs = Object.fromEntries(
      ent.attributes.map((a) => [a.key, a.value])
    );
    const payloadStr = ent.payload
      ? bytesToString(ent.payload as Uint8Array)
      : undefined;

  const key = (ent as any).entityKey ?? (ent as any).key ?? "<unknown>";
  console.log("  • Task key:", key);
    console.log("    attrs:", attrs);
    if (payloadStr) {
      console.log("    payload:", payloadStr);
    }
  }
}

main().catch((err) => {
  console.error("❌ Error in query-dao-entities:", err);
  process.exit(1);
});
