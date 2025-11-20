import { createWalletClient, createPublicClient, http } from '@arkiv-network/sdk';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { mendoza } from '@arkiv-network/sdk/chains';
import { stringToPayload } from '@arkiv-network/sdk/utils';
import { eq } from '@arkiv-network/sdk/query';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const rpcUrl = process.env.ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc';
  const priv = process.env.ARKIV_PRIVATE_KEY as `0x${string}` | undefined;

  if (!priv) {
    throw new Error('Falta ARKIV_PRIVATE_KEY en el entorno (.env)');
  }

  // 1) Clientes
  const walletClient = createWalletClient({
    chain: mendoza,
    transport: http(rpcUrl),
    account: privateKeyToAccount(priv),
  });

  const publicClient = createPublicClient({
    chain: mendoza,
    transport: http(rpcUrl),
  });

  console.log('👋 Address:', walletClient.account.address);

  // 2) Crear propuesta
  const { entityKey: proposalKey } = await walletClient.createEntity({
    payload: stringToPayload('Proposal: Switch stand-up to 9:30?'),
    contentType: 'text/plain',
    attributes: [
      { key: 'type', value: 'proposal' },
      { key: 'status', value: 'open' },
      { key: 'version', value: '1' },
    ],
    expiresIn: 200,
  });

  console.log('📌 Proposal key:', proposalKey);

  // 3) Emitir dos votos (uno NO por el owner)
  const voterAddr = walletClient.account.address;

  await walletClient.mutateEntities({
    creates: [
      {
        payload: stringToPayload('vote: no'),
        contentType: 'text/plain',
        attributes: [
          { key: 'type', value: 'vote' },
          { key: 'proposalKey', value: proposalKey },
          { key: 'voter', value: voterAddr },
          { key: 'choice', value: 'no' },
          { key: 'weight', value: '1' },
        ],
        expiresIn: 200,
      },
    ],
  });
  console.log('🗳️ 1 vote cast (no)');

  // 4) Batch de 5 votos "yes"
  const creates = Array.from({ length: 5 }, (_, i) => ({
    payload: stringToPayload(`vote: yes #${i + 1}`),
    contentType: 'text/plain' as const,
    attributes: [
      { key: 'type', value: 'vote' },
      { key: 'proposalKey', value: proposalKey },
      { key: 'voter', value: `${voterAddr}-bot${i}` },
      { key: 'choice', value: 'yes' },
      { key: 'weight', value: '1' },
    ],
    expiresIn: 200,
  }));

  await walletClient.mutateEntities({ creates });
  console.log(`📦 Batch created: ${creates.length} votes`);

  // 5) Tally
  const yes = await publicClient
    .buildQuery()
    .where([eq('type', 'vote'), eq('proposalKey', proposalKey), eq('choice', 'yes')])
    .fetch();

  const no = await publicClient
    .buildQuery()
    .where([eq('type', 'vote'), eq('proposalKey', proposalKey), eq('choice', 'no')])
    .fetch();

  console.log(`📊 Tallies - YES: ${yes.entities.length}, NO: ${no.entities.length}`);

  // 6) (Opcional) Obtener entidad propuesta y mostrar texto
  const proposal = await publicClient.getEntity(proposalKey);
  const text = proposal.toText?.();
  if (text) console.log('📝 Proposal text:', text);
}

main().catch((err) => {
  console.error('❌ Error in Arkiv demo:', err);
  process.exit(1);
});
