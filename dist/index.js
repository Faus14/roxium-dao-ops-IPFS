// Arranque del servidor
import app from './app.js';
import dotenv from 'dotenv';
import { IPFSService } from './services/ipfs.service.js';
import { ArkivService } from './services/arkiv.service.js';
dotenv.config();
const PORT = process.env.PORT || 3000;
// Inicializar servicios
async function initializeServices() {
    try {
        console.log('🔧 Inicializando servicios...');
        // Inicializar IPFS
        await IPFSService.getInstance().initialize();
        // Inicializar Arkiv
        const rpcUrl = process.env.ARKIV_RPC_URL;
        const wsUrl = process.env.ARKIV_WS_URL;
        const privateKey = process.env.ARKIV_PRIVATE_KEY;
        if (!rpcUrl || !wsUrl || !privateKey) {
            console.warn('⚠️  Advertencia: Faltan variables de entorno de Arkiv');
            console.warn('   El servicio funcionará pero no se registrarán eventos en Arkiv');
        }
        else {
            await ArkivService.getInstance().initialize(rpcUrl, wsUrl, privateKey);
        }
        console.log('✅ Servicios inicializados');
    }
    catch (error) {
        console.error('❌ Error inicializando servicios:', error);
        // En desarrollo, continuar aunque falle Arkiv
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}
// Iniciar servidor
async function start() {
    await initializeServices();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
    });
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Cerrando servidor...');
    await IPFSService.getInstance().stop();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🛑 Cerrando servidor...');
    await IPFSService.getInstance().stop();
    process.exit(0);
});
start().catch((error) => {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map