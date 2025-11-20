// src/arkiv/proposal.ts
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { walletClient } from "./clients.js";
import { computeExpiresInFromDeadline } from "./time.js";
import type { ProposalPayloadV1 } from "../types/arkiv-domain.js";

export async function createProposalOnArkiv(input: ProposalPayloadV1) {
  const payload = stringToPayload(JSON.stringify(input));
  const expiresIn = computeExpiresInFromDeadline(input.deadline);

  const { entityKey, txHash } = await walletClient.createEntity({
    payload,
    contentType: "application/json",
    attributes: [
      { key: "type", value: "proposal" },
      { key: "daoKey", value: input.daoKey },
      { key: "status", value: input.status },
    ],
    expiresIn: expiresIn ?? 60 * 60 * 24, // fallback 1 día
  });

  console.log("✅ Proposal creada en Arkiv:", { entityKey, txHash });
  return { entityKey, txHash };
}
