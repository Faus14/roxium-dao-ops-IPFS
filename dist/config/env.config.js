// Configuración de variables de entorno
import dotenv from 'dotenv';
dotenv.config();
export const config = {
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    ipfs: {
        dataDir: process.env.HELIA_DATA_DIR || './helia-data',
    },
    arkiv: {
        rpcUrl: process.env.ARKIV_RPC_URL,
        wsUrl: process.env.ARKIV_WS_URL,
        privateKey: process.env.ARKIV_PRIVATE_KEY,
    },
    storacha: {
        spaceDid: process.env.STORACHA_SPACE_DID,
    },
};
//# sourceMappingURL=env.config.js.map