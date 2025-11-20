// src/arkiv/dao.ts
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { walletClient } from "./clients.js";
import type { DaoPayloadV1 } from "../types/arkiv-domain.js";

export async function createDaoOnArkiv(input: DaoPayloadV1) {
  const payload = stringToPayload(JSON.stringify(input));

  const { entityKey, txHash } = await walletClient.createEntity({
    payload,
    contentType: "application/json",
    attributes: [
      { key: "type", value: "dao" },
      { key: "ownerAddress", value: input.ownerAddress },
      { key: "daoName", value: input.name },
    ],
    // por ahora TTL largo, después podés jugar con extendEntity
    expiresIn: 60 * 60 * 24 * 30, // 30 días
  });

  console.log("✅ DAO creado en Arkiv:", { entityKey, txHash });
  return { entityKey, txHash };
}
