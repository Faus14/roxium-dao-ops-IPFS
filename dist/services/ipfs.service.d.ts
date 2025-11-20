import type { IPFSUploadResult } from '../types/document.types.js';
/**
 * Servicio para interactuar con IPFS usando Helia.
 * Implementa patrón Singleton para mantener una única instancia del nodo.
 */
export declare class IPFSService {
    private static instance;
    private helia;
    private fs;
    private initialized;
    private constructor();
    /**
     * Obtiene la instancia única del servicio (Singleton)
     */
    static getInstance(): IPFSService;
    /**
     * Inicializa el nodo Helia y el sistema de archivos UnixFS
     */
    initialize(): Promise<void>;
    /**
     * Sube un archivo a IPFS y retorna el CID y metadata
     * @param buffer - Contenido del archivo como Buffer
     * @param filename - Nombre del archivo original
     * @param mimeType - Tipo MIME del archivo
     * @returns Resultado con CID, metadata y URLs de gateway
     */
    uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<IPFSUploadResult>;
    /**
     * Obtiene un archivo desde IPFS usando su CID
     * @param cidString - Content Identifier del archivo como string
     * @returns Buffer con el contenido del archivo
     */
    getFile(cidString: string): Promise<Buffer>;
    /**
     * Verifica si el servicio está inicializado
     */
    isInitialized(): boolean;
    /**
     * Detiene el nodo Helia y limpia recursos
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=ipfs.service.d.ts.map