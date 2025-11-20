// Placeholder - será implementado en Fase 4
export class ArkivService {
    static instance;
    static getInstance() {
        if (!ArkivService.instance) {
            ArkivService.instance = new ArkivService();
        }
        return ArkivService.instance;
    }
    async initialize(rpcUrl, wsUrl, privateKey) {
        console.log('⚠️  ArkivService: Pendiente de implementación (Fase 4)');
    }
}
//# sourceMappingURL=arkiv.service.js.map