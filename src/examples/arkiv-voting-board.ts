// src/examples/arkiv-voting-board.ts
import { walletClient, publicClient } from "../arkiv/clients.js";
import { bytesToString } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";

import { createDaoOnArkiv } from "../arkiv/dao.js";
import { createProposalOnArkiv } from "../arkiv/proposal.js";
import { createTaskOnArkiv } from "../arkiv/task.js";
import { createUserOnDaoMembership } from "../arkiv/membership.js";

async function main() {
  const ownerAddress = walletClient.account.address;
  const now = new Date();

  console.log("👋 Owner address (wallet):", ownerAddress);

  // 1) Crear DAO en Arkiv
  const { entityKey: daoKey } = await createDaoOnArkiv({
    id: 1,
    createdAt: now.toISOString(),
    name: "Roxium DAO Ops",
    description: "DAO de operaciones / hackathon demo",
    ownerAddress,
    version: 1,
  });

  // 2) Membership OWNER (UserOnDao)
  await createUserOnDaoMembership({
    userAddress: ownerAddress,
    daoKey,
    role: "OWNER",
    createdAt: now.toISOString(),
    version: 1,
  });

  // 3) Proposal con deadline → se usa para TTL (expiresIn)
  const deadline = new Date(now.getTime() + 1000 * 60 * 60).toISOString(); // +1h
  const { entityKey: proposalKey } = await createProposalOnArkiv({
    id: 1,
    createdAt: now.toISOString(),
    deadline,
    title: "Definir horario de daily standup",
    budget: 0,
    description: "¿Movemos la daily a las 9:30?",
    daoKey,
    status: "open",
    version: 1,
  });

  // 4) Algunas Tasks ligadas a la Proposal
  await createTaskOnArkiv({
    id: 1,
    createdAt: now.toISOString(),
    deadline,
    title: "Relevar disponibilidad del equipo",
    budget: 0,
    description: "Enviar encuesta rápida al equipo.",
    proposalKey,
    daoKey,
    status: "todo",
    version: 1,
  });

  await createTaskOnArkiv({
    id: 2,
    createdAt: now.toISOString(),
    deadline,
    title: "Actualizar calendario de la DAO",
    budget: 0,
    description: "Actualizar eventos en el calendario compartido.",
    proposalKey,
    daoKey,
    status: "todo",
    version: 1,
  });

  // 5) Leer la Proposal de vuelta y mostrar el payload
  const proposalEntity = await publicClient.getEntity(proposalKey);

  if (!proposalEntity.payload) {
    console.warn("⚠️ Proposal entity no tiene payload (payload undefined)");
  } else {
    const proposalPayload = bytesToString(proposalEntity.payload);
    console.log("\n📝 Proposal payload (JSON):", proposalPayload);
  }

  // 6) Query de Tasks por proposalKey (mini Open Analytics)
  const tasksQuery = await publicClient
    .buildQuery()
    .where([eq("type", "task"), eq("proposalKey", proposalKey)])
    .fetch();

  console.log(
    `\n📊 Tasks encontradas para proposal ${proposalKey}:`,
    tasksQuery.entities.length
  );

  for (const e of tasksQuery.entities) {
    const key = (e as any).entityKey ?? (e as any).key ?? "<unknown>";

    if (!e.payload) {
      console.warn("  • Task key =", key, "sin payload (undefined)");
      continue;
    }

    const decoded = bytesToString(e.payload as Uint8Array);
    console.log("  • Task key =", key, "payload =", decoded);
  }

  console.log("\n✅ Demo DAO / Proposal / Task terminada.");
}

main().catch((err) => {
  console.error("❌ Error en arkiv-voting-board demo:", err);
  process.exit(1);
});
