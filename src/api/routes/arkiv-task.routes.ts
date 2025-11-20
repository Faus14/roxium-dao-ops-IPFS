// src/api/routes/arkiv-task.routes.ts
import { Router } from "express";
import { z } from "zod";

import { createTaskOnArkiv } from "../../arkiv/task.js";
import { publicClient } from "../../arkiv/clients.js";
import { eq } from "@arkiv-network/sdk/query";
import { bytesToString } from "@arkiv-network/sdk/utils";

const router = Router();

const CreateTaskSchema = z.object({
  proposalKey: z.string().min(1),
  daoKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  budget: z.number().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
});

/**
 * Igual que en DAOs y Proposals: extraemos la key real de la entidad Arkiv.
 */
function extractEntityKey(entity: any): string | null {
  if (!entity) return null;

  if (typeof entity.entityKey === "string") return entity.entityKey;
  if (typeof entity.key === "string") return entity.key;
  if (typeof entity.id === "string") return entity.id;

  // fallback: si alguna vez se guardó como atributo
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
    entityKey, // 👈 clave para el front
    attributes: attrs,
    payload,
    expiresAtBlock,
  };
}

// -----------------------------------------------------
// POST /api/arkiv/tasks  → crear task
// -----------------------------------------------------
router.post("/", async (req, res) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const {
      proposalKey,
      daoKey,
      title,
      description,
      budget,
      deadline,
      status,
    } = parsed.data;

    const now = new Date().toISOString();

    const { entityKey, txHash } = await createTaskOnArkiv({
      id: Date.now(),
      createdAt: now,
      deadline,
      title,
      budget,
      description,
      proposalKey,
      daoKey,
      status,
      version: 1,
    });

    console.log("✅ Task creada en Arkiv:", { entityKey, txHash });

    return res.status(201).json({
      taskKey: entityKey,
      daoKey,
      proposalKey,
      txHash,
    });
  } catch (err: any) {
    console.error("Error creating task in Arkiv:", err);
    return res.status(500).json({
      error: "Failed to create task in Arkiv",
      details: err?.message,
    });
  }
});

// -----------------------------------------------------
// GET /api/arkiv/tasks  → obtener TODAS las tasks
// -----------------------------------------------------
router.get("/", async (_req, res) => {
  try {
    const result = await publicClient
      .buildQuery()
      .where([eq("type", "task")])
      .withAttributes(true)
      .withPayload(true)
      .limit(1000)
      .fetch();

    const tasks = result.entities.map(normalizeEntity);

    return res.json({
      count: tasks.length,
      tasks,
    });
  } catch (err: any) {
    console.error("Error fetching all tasks from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch tasks from Arkiv",
      details: err?.message,
    });
  }
});

//
// ====== GETs específicos ======
//

// GET /api/arkiv/tasks/by-proposal/:proposalKey
router.get("/by-proposal/:proposalKey", async (req, res) => {
  const proposalKey = req.params.proposalKey as `0x${string}`;

  try {
    const result = await publicClient
      .buildQuery()
      .where([eq("type", "task"), eq("proposalKey", proposalKey)])
      .withAttributes(true)
      .withPayload(true)
      .limit(500)
      .fetch();

    const tasks = result.entities.map(normalizeEntity);

    return res.json({
      proposalKey,
      tasks,
    });
  } catch (err: any) {
    console.error("Error fetching tasks by proposal from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch tasks from Arkiv",
      details: err?.message,
    });
  }
});

// GET /api/arkiv/tasks/:taskKey
router.get("/:taskKey", async (req, res) => {
  const taskKey = req.params.taskKey as `0x${string}`;

  try {
    const entity = await publicClient.getEntity(taskKey);
    const task = normalizeEntity(entity);

    return res.json({
      taskKey,
      task,
    });
  } catch (err: any) {
    console.error("Error fetching task from Arkiv:", err);
    return res.status(500).json({
      error: "Failed to fetch task from Arkiv",
      details: err?.message,
    });
  }
});

export default router;
