import { createWalletClient, createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk/utils';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
export class ArkivService {
    static instance;
    walletClient = null;
    publicClient = null;
    initialized = false;
    constructor() { }
    static getInstance() {
        if (!ArkivService.instance) {
            ArkivService.instance = new ArkivService();
        }
        return ArkivService.instance;
    }
    async initialize(rpcUrl, wsUrl, privateKey) {
        if (this.initialized) {
            return;
        }
        if (!privateKey || !rpcUrl) {
            console.warn('⚠️  ArkivService: Faltan RPC URL o PRIVATE_KEY. Arkiv se deshabilita.');
            return;
        }
        const account = privateKeyToAccount(privateKey);
        this.walletClient = createWalletClient({
            chain: mendoza,
            transport: http(rpcUrl),
            account,
        });
        this.publicClient = createPublicClient({
            chain: mendoza,
            transport: http(rpcUrl),
        });
        this.initialized = true;
        console.log('✅ ArkivService inicializado contra Mendoza');
    }
    isInitialized() {
        return this.initialized;
    }
    async registerAttachment(params) {
        if (!this.walletClient) {
            throw new Error('ArkivService no está inicializado (walletClient null)');
        }
        const { cid, filename, mimeType, size, taskId, gatewayUrl } = params;
        const payload = jsonToPayload({
            type: 'attachment',
            cid,
            filename,
            mimeType,
            size,
            taskId,
            gatewayUrl,
            uploadedAt: new Date().toISOString(),
        });
        const { entityKey, txHash } = await this.walletClient.createEntity({
            payload,
            contentType: 'application/json',
            attributes: [
                { key: 'type', value: 'attachment' },
                { key: 'taskId', value: taskId },
                { key: 'cid', value: cid },
            ],
            expiresIn: ExpirationTime.fromDays(365),
        });
        console.log('✅ Attachment registrado en Arkiv:', { entityKey, txHash });
        return { entityKey, txHash };
    }
}
//# sourceMappingURL=arkiv.service.js.map