export interface RegisterAttachmentParams {
    cid: string;
    filename: string;
    mimeType: string;
    size: number;
    taskId: string;
    gatewayUrl: string;
}
export declare class ArkivService {
    private static instance;
    private walletClient;
    private publicClient;
    private initialized;
    private constructor();
    static getInstance(): ArkivService;
    initialize(rpcUrl: string, wsUrl: string, privateKey: string): Promise<void>;
    isInitialized(): boolean;
    registerAttachment(params: RegisterAttachmentParams): Promise<{
        entityKey: string;
        txHash: string;
    }>;
}
//# sourceMappingURL=arkiv.service.d.ts.map