// src/api/routes/arkiv-task.routes.ts
import { Router } from "express";
import { z } from "zod";
import { createTaskOnArkiv } from "../../arkiv/task.js";

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

export default router;
