// src/api/routes/arkiv-dao.routes.ts
import { Router } from "express";
import { z } from "zod";

import { walletClient } from "../../arkiv/clients.js";
import { createDaoOnArkiv } from "../../arkiv/dao.js";
import { createUserOnDaoMembership } from "../../arkiv/membership.js";

const router = Router();

const CreateDaoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ownerAddress: z.string().optional(), // si no viene, usamos la del wallet del backend
});

// POST /api/arkiv/daos
router.post("/", async (req, res) => {
  const parsed = CreateDaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { name, description, ownerAddress } = parsed.data;
    const now = new Date().toISOString();
    const owner = ownerAddress ?? walletClient.account.address;

    // 1) Crear DAO en Arkiv
    const { entityKey: daoKey, txHash: daoTxHash } = await createDaoOnArkiv({
      id: Date.now(),
      createdAt: now,
      name,
      description,
      ownerAddress: owner,
      version: 1,
    });

    // 2) Crear membership OWNER
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

const AddMemberSchema = z.object({
  userAddress: z.string(),
  role: z.enum(["OWNER", "CONTRIBUTOR", "VIEWER"]).default("CONTRIBUTOR"),
});

// POST /api/arkiv/daos/:daoKey/members
router.post("/:daoKey/members", async (req, res) => {
  const { daoKey } = req.params;
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

export default router;
