import { Router } from "express";
import { z } from "zod";

import { createTaskOnArkiv } from "../../arkiv/task.js";
import { publicClient } from "../../arkiv/clients.js";
import { eq } from "@arkiv-network/sdk/query";
import { bytesToString } from "@arkiv-network/sdk/utils";

const router = Router();

const CreateTaskSchema = z.object({
  proposalKey: z.string(),
  daoKey: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  budget: z.number().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
});

function normalizeEntity(entity: any) {
  const attrs: Record<string, string> = Object.fromEntries(
    (entity.attributes ?? []).map((a: any) => [a.key, a.value])
  );

  let payload: any = null;
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
    entityKey: entity.entityKey as string,
    attributes: attrs,
    payload,
    expiresAtBlock,
  };
}

// POST /api/arkiv/tasks
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

    return res.status(201).json({
      taskKey: entityKey,
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

//
// ====== GETs ======
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
