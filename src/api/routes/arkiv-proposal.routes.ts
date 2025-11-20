// src/api/routes/arkiv-proposal.routes.ts
import { Router } from "express";
import { z } from "zod";

import { createProposalOnArkiv } from "../../arkiv/proposal.js";
import { publicClient } from "../../arkiv/clients.js";
import { eq } from "@arkiv-network/sdk/query";
import { bytesToString } from "@arkiv-network/sdk/utils";

const router = Router();

const CreateProposalSchema = z.object({
  daoKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  budget: z.number().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(["open", "closed", "archived"]).default("open"),
});

/**
 * Igual que en DAOs: intentamos extraer la key real de la entidad Arkiv.
 */
function extractEntityKey(entity: any): string | null {
  if (!entity) return null;

  if (typeof entity.entityKey === "string") return entity.entityKey;
  if (typeof entity.key === "string") return entity.key;
  if (typeof entity.id === "string") return entity.id;

  // fallback: si alguna vez la guardaste como atributo
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

// 🔧 helper: convierte entity Arkiv a algo JSON-friendly (INCLUYENDO entityKey)
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
    entityKey, // 👈 esto ahora SIEMPRE viene en la respuesta
    attributes: attrs,
    payload,
    expiresAtBlock,
  };
}

// -----------------------------------------------------
// POST /api/arkiv/proposals  → crear proposal
// -----------------------------------------------------
router.post("/", async (req, res) => {
  const parsed = CreateProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { daoKey, title, description, budget, deadline, status } =
      parsed.data;
    const now = new Date().toISOString();

    const { entityKey, txHash } = await createProposalOnArkiv({
      id: Date.now(),
      createdAt: now,
      deadline,
      title,
      budget,
      description,
      daoKey,
      status,
      version: 1,
    });

    console.log("✅ Proposal creada en Arkiv:", { entityKey, txHash });

    return res.status(201).json({
      proposalKey: entityKey,
      daoKey,
      txHash,
    });
  } catch (err: any) {
    console.error("Error creating proposal in Arkiv:", err);
    return res.status(500).json({
      error: "Failed to create proposal in Arkiv",
      details: err?.message,
    });
  }
});

// -----------------------------------------------------
// GET /api/arkiv/proposals  → obtener TODAS las proposals
// -----------------------------------------------------
router.get("/", async (_req, res) => {
  try {
    const result = await publicClient
      .buildQuery()
      .where([eq("type", "proposal")])
      .withAttributes(true)
      .withPayload(true)
      .limit(500)
      .fetch();

    const proposals = result.entities.map(normalizeEntity);

    return res.json({
      count: proposals.length,
      proposals,
    });
  } catch (err: any) {
    console.error("Error fetching all proposals from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch proposals from Arkiv",
      details: err?.message,
    });
  }
});

//
// ====== GETs específicos ======
//

// GET /api/arkiv/proposals/by-dao/:daoKey
router.get("/by-dao/:daoKey", async (req, res) => {
  const daoKey = req.params.daoKey as `0x${string}`;

  try {
    const result = await publicClient
      .buildQuery()
      .where([eq("type", "proposal"), eq("daoKey", daoKey)])
      .withAttributes(true)
      .withPayload(true)
      .limit(200)
      .fetch();

    const proposals = result.entities.map(normalizeEntity);

    return res.json({
      daoKey,
      proposals,
    });
  } catch (err: any) {
    console.error("Error fetching proposals by DAO from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch proposals from Arkiv",
      details: err?.message,
    });
  }
});

// GET /api/arkiv/proposals/:proposalKey
router.get("/:proposalKey", async (req, res) => {
  const proposalKey = req.params.proposalKey as `0x${string}`;

  try {
    const proposalEntity = await publicClient.getEntity(proposalKey);
    const proposal = normalizeEntity(proposalEntity);
    const daoKey = proposal.attributes?.daoKey;

    const tasksResult = await publicClient
      .buildQuery()
      .where([eq("type", "task"), eq("proposalKey", proposalKey)])
      .withAttributes(true)
      .withPayload(true)
      .limit(500)
      .fetch();

    const tasks = tasksResult.entities.map(normalizeEntity);

    return res.json({
      proposalKey,
      daoKey,
      proposal,
      tasks,
    });
  } catch (err: any) {
    console.error("Error fetching proposal from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch proposal from Arkiv",
      details: err?.message,
    });
  }
});

export default router;
