// Placeholder - será implementado en Fase 4
export class ArkivService {
  private static instance: ArkivService;

  static getInstance(): ArkivService {
    if (!ArkivService.instance) {
      ArkivService.instance = new ArkivService();
    }
    return ArkivService.instance;
  }

  async initialize(rpcUrl: string, wsUrl: string, privateKey: string): Promise<void> {
    console.log('⚠️  ArkivService: Pendiente de implementación (Fase 4)');
  }
}

