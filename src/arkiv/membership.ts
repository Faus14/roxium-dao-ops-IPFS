// src/arkiv/membership.ts
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { walletClient } from "./clients.js";
import type { MembershipPayloadV1 } from "../types/arkiv-domain.js";

export async function createUserOnDaoMembership(input: MembershipPayloadV1) {
  const payload = stringToPayload(JSON.stringify(input));

  const { entityKey, txHash } = await walletClient.createEntity({
    payload,
    contentType: "application/json",
    attributes: [
      { key: "type", value: "user-on-dao" },
      { key: "userAddress", value: input.userAddress },
      { key: "daoKey", value: input.daoKey },
      { key: "role", value: input.role },
    ],
    // membresías renovables → después podés usar extendEntity para micro-bounty de TTL
    expiresIn: 60 * 60 * 24 * 30,
  });

  console.log("✅ Membership creada en Arkiv:", { entityKey, txHash });
  return { entityKey, txHash };
}
