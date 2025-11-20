import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
/**
 * Servicio para interactuar con IPFS usando Helia.
 * Implementa patrón Singleton para mantener una única instancia del nodo.
 */
export class IPFSService {
    static instance;
    helia = null;
    fs = null;
    initialized = false;
    constructor() { }
    /**
     * Obtiene la instancia única del servicio (Singleton)
     */
    static getInstance() {
        if (!IPFSService.instance) {
            IPFSService.instance = new IPFSService();
        }
        return IPFSService.instance;
    }
    /**
     * Inicializa el nodo Helia y el sistema de archivos UnixFS
     */
    async initialize() {
        if (this.initialized) {
            console.log('ℹ️  IPFSService ya está inicializado');
            return;
        }
        try {
            console.log('🚀 Inicializando nodo Helia...');
            // Crear nodo Helia
            this.helia = await createHelia();
            // Inicializar UnixFS
            // @ts-ignore - Conflicto de tipos entre versiones de @helia/interface
            this.fs = unixfs(this.helia);
            this.initialized = true;
            console.log('✅ Nodo Helia inicializado correctamente');
        }
        catch (error) {
            console.error('❌ Error inicializando Helia:', error);
            throw new Error(`Error al inicializar Helia: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Sube un archivo a IPFS y retorna el CID y metadata
     * @param buffer - Contenido del archivo como Buffer
     * @param filename - Nombre del archivo original
     * @param mimeType - Tipo MIME del archivo
     * @returns Resultado con CID, metadata y URLs de gateway
     */
    async uploadFile(buffer, filename, mimeType) {
        if (!this.initialized || !this.fs) {
            await this.initialize();
        }
        if (!this.fs) {
            throw new Error('UnixFS no está inicializado');
        }
        try {
            console.log(`📤 Subiendo archivo a IPFS: ${filename} (${buffer.length} bytes)`);
            // Agregar el archivo a IPFS usando UnixFS
            const cid = await this.fs.addBytes(buffer);
            const cidString = cid.toString();
            // Construir URLs de gateway
            const gatewayUrls = [
                `https://ipfs.io/ipfs/${cidString}`,
                `https://w3s.link/ipfs/${cidString}`,
                `https://dweb.link/ipfs/${cidString}`,
            ];
            const result = {
                cid: cidString,
                size: buffer.length,
                mimeType,
                filename,
                uploadedAt: new Date(),
                gatewayUrl: gatewayUrls[0], // URL principal
            };
            console.log(`✅ Archivo subido a IPFS`);
            console.log(`   CID: ${cidString}`);
            console.log(`   Gateway: ${result.gatewayUrl}`);
            return result;
        }
        catch (error) {
            console.error('❌ Error subiendo archivo a IPFS:', error);
            throw new Error(`Error al subir archivo a IPFS: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Obtiene un archivo desde IPFS usando su CID
     * @param cidString - Content Identifier del archivo como string
     * @returns Buffer con el contenido del archivo
     */
    async getFile(cidString) {
        if (!this.initialized || !this.fs) {
            await this.initialize();
        }
        if (!this.fs) {
            throw new Error('UnixFS no está inicializado');
        }
        try {
            console.log(`📥 Descargando archivo desde IPFS: ${cidString}`);
            // Convertir string CID a objeto CID
            const cid = CID.parse(cidString);
            const chunks = [];
            for await (const chunk of this.fs.cat(cid)) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            console.log(`✅ Archivo descargado: ${buffer.length} bytes`);
            return buffer;
        }
        catch (error) {
            console.error('❌ Error descargando archivo desde IPFS:', error);
            throw new Error(`Error al descargar archivo desde IPFS: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    /**
     * Verifica si el servicio está inicializado
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Detiene el nodo Helia y limpia recursos
     */
    async stop() {
        if (this.helia) {
            try {
                console.log('🛑 Deteniendo nodo Helia...');
                await this.helia.stop();
                this.helia = null;
                this.fs = null;
                this.initialized = false;
                console.log('✅ Nodo Helia detenido correctamente');
            }
            catch (error) {
                console.error('❌ Error deteniendo Helia:', error);
                throw error;
            }
        }
    }
}
//# sourceMappingURL=ipfs.service.js.map