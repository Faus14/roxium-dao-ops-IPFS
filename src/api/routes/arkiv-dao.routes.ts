// src/api/routes/arkiv-dao.routes.ts
import { Router } from "express";
import { z } from "zod";

import { walletClient, publicClient } from "../../arkiv/clients.js";
import { createDaoOnArkiv } from "../../arkiv/dao.js";
import { createUserOnDaoMembership } from "../../arkiv/membership.js";
import { eq } from "@arkiv-network/sdk/query";
import { bytesToString } from "@arkiv-network/sdk/utils";

const router = Router();

const CreateDaoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ownerAddress: z.string().optional(),
});

/**
 * Intenta extraer la "clave" de la entidad Arkiv.
 * Arkiv siempre tiene un identificador, pero según la versión del SDK
 * puede venir como `entityKey`, `key`, `id`, etc.
 */
function extractEntityKey(entity: any): string | null {
  if (!entity) return null;

  if (typeof entity.entityKey === "string") return entity.entityKey;
  if (typeof entity.key === "string") return entity.key;
  if (typeof entity.id === "string") return entity.id;

  // fallback: si la guardaste como atributo en algún momento
  if (Array.isArray(entity.attributes)) {
    const found = entity.attributes.find(
      (a: any) => a && a.key === "entityKey"
    );
    if (found && typeof found.value === "string") {
      return found.value;
    }
  }

  return null;
}

// 🔧 helper: convierte entity Arkiv a algo JSON-friendly
function normalizeEntity(entity: any) {
  const entityKey = extractEntityKey(entity);

  const attrs: Record<string, string> = Object.fromEntries(
    (entity.attributes ?? []).map((a: any) => [a.key, a.value])
  );

  let payload: unknown = null;
  if (entity.payload) {
    const str = bytesToString(entity.payload as Uint8Array);
    try {
      payload = JSON.parse(str);
    } catch {
      payload = str;
    }
  }

  const expiresAtBlock =
    typeof entity.expiresAtBlock === "bigint"
      ? entity.expiresAtBlock.toString()
      : entity.expiresAtBlock ?? null;

  return {
    // 👇 ahora SIEMPRE va en la respuesta (aunque sea null)
    entityKey,
    attributes: attrs,
    payload,
    expiresAtBlock,
  };
}

// -----------------------------------------------------
// POST /api/arkiv/daos  → crear DAO + membership OWNER
// -----------------------------------------------------
router.post("/", async (req, res) => {
  const parsed = CreateDaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { name, description, ownerAddress } = parsed.data;
    const now = new Date().toISOString();
    const owner = ownerAddress ?? walletClient.account.address;

    const { entityKey: daoKey, txHash: daoTxHash } = await createDaoOnArkiv({
      id: Date.now(),
      createdAt: now,
      name,
      description,
      ownerAddress: owner,
      version: 1,
    });

    const { entityKey: membershipKey, txHash: membershipTxHash } =
      await createUserOnDaoMembership({
        userAddress: owner,
        daoKey,
        role: "OWNER",
        createdAt: now,
        version: 1,
      });

    return res.status(201).json({
      daoKey,
      daoTxHash,
      membershipKey,
      membershipTxHash,
      ownerAddress: owner,
    });
  } catch (err: any) {
    console.error("Error creating DAO in Arkiv:", err);
    return res.status(500).json({
      error: "Failed to create DAO in Arkiv",
      details: err?.message,
    });
  }
});

// -----------------------------------------------------
// GET /api/arkiv/daos  → obtener TODOS los DAOs
// -----------------------------------------------------
router.get("/", async (_req, res) => {
  try {
    const result = await publicClient
      .buildQuery()
      .where([eq("type", "dao")])
      .withAttributes(true)
      .withPayload(true)
      .limit(200)
      .fetch();

    const daos = result.entities.map(normalizeEntity);

    return res.json({
      count: daos.length,
      daos,
    });
  } catch (err: any) {
    console.error("Error fetching all DAOs from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch DAOs from Arkiv",
      details: err?.message,
    });
  }
});

const AddMemberSchema = z.object({
  userAddress: z.string(),
  role: z.enum(["OWNER", "CONTRIBUTOR", "VIEWER"]).default("CONTRIBUTOR"),
});

// -----------------------------------------------------
// POST /api/arkiv/daos/:daoKey/members  → agregar miembro
// -----------------------------------------------------
router.post("/:daoKey/members", async (req, res) => {
  const daoKey = req.params.daoKey as `0x${string}`;
  const parsed = AddMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { userAddress, role } = parsed.data;
    const now = new Date().toISOString();

    const { entityKey, txHash } = await createUserOnDaoMembership({
      userAddress,
      daoKey,
      role,
      createdAt: now,
      version: 1,
    });

    return res.status(201).json({
      membershipKey: entityKey,
      txHash,
    });
  } catch (err: any) {
    console.error("Error adding DAO member in Arkiv:", err);
    return res.status(500).json({
      error: "Failed to add DAO member in Arkiv",
      details: err?.message,
    });
  }
});

// -----------------------------------------------------
// GET /api/arkiv/daos/:daoKey  → DAO + memberships
// -----------------------------------------------------
router.get("/:daoKey", async (req, res) => {
  const daoKey = req.params.daoKey as `0x${string}`;

  try {
    const daoEntity = await publicClient.getEntity(daoKey);
    const dao = normalizeEntity(daoEntity);

    const membershipsResult = await publicClient
      .buildQuery()
      .where([eq("type", "user-on-dao"), eq("daoKey", daoKey)])
      .withAttributes(true)
      .withPayload(true)
      .limit(200)
      .fetch();

    const memberships = membershipsResult.entities.map(normalizeEntity);

    return res.json({
      daoKey,
      dao,
      memberships,
    });
  } catch (err: any) {
    console.error("Error fetching DAO from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch DAO from Arkiv",
      details: err?.message,
    });
  }
});

// -----------------------------------------------------
// GET /api/arkiv/daos/:daoKey/board  → DAO + proposals + tasks
// -----------------------------------------------------
router.get("/:daoKey/board", async (req, res) => {
  const daoKey = req.params.daoKey as `0x${string}`;

  try {
    const daoEntity = await publicClient.getEntity(daoKey);
    const dao = normalizeEntity(daoEntity);

    const proposalsResult = await publicClient
      .buildQuery()
      .where([eq("type", "proposal"), eq("daoKey", daoKey)])
      .withAttributes(true)
      .withPayload(true)
      .limit(200)
      .fetch();

    const proposals = proposalsResult.entities.map(normalizeEntity);

    const tasksResult = await publicClient
      .buildQuery()
      .where([eq("type", "task"), eq("daoKey", daoKey)])
      .withAttributes(true)
      .withPayload(true)
      .limit(500)
      .fetch();

    const tasks = tasksResult.entities.map(normalizeEntity);

    return res.json({
      daoKey,
      dao,
      proposals,
      tasks,
    });
  } catch (err: any) {
    console.error("Error fetching DAO board from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch DAO board from Arkiv",
      details: err?.message,
    });
  }
});

export default router;
