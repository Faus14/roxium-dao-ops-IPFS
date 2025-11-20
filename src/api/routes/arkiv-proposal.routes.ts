// src/api/routes/arkiv-proposal.routes.ts
import { Router } from "express";
import { z } from "zod";
import { createProposalOnArkiv } from "../../arkiv/proposal.js";

const router = Router();

const CreateProposalSchema = z.object({
  daoKey: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  budget: z.number().optional(),
  deadline: z.string().datetime().optional(), // ISO
  status: z.enum(["open", "closed", "archived"]).default("open"),
});

// POST /api/arkiv/proposals
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

    return res.status(201).json({
      proposalKey: entityKey,
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

export default router;
