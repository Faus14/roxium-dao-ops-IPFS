import express from 'express';
import multer from 'multer';
import { IPFSService } from '../../services/ipfs.service.js';
const router = express.Router();
// Configurar multer para recibir archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB máximo
    },
});
const ipfsService = IPFSService.getInstance();
/**
 * POST /api/upload
 * Sube un archivo a IPFS y retorna el CID y metadata
 *
 * Body (multipart/form-data):
 * - file: Archivo a subir (PDF o imagen)
 * - taskId: ID de la Task asociada (requerido)
 * - documentType: Tipo de documento (opcional: "PDF" | "IMAGE")
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        // Validar que hay archivo
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo',
            });
        }
        // Validar taskId
        const { taskId } = req.body;
        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'taskId es requerido',
            });
        }
        // Validar tipo de archivo (PDF o imagen)
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: `Tipo de archivo no permitido: ${req.file.mimetype}. Solo se permiten PDFs e imágenes.`,
            });
        }
        // Subir archivo a IPFS
        const ipfsResult = await ipfsService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
        // Construir respuesta
        const response = {
            success: true,
            data: {
                cid: ipfsResult.cid,
                filename: ipfsResult.filename,
                size: ipfsResult.size,
                mimeType: ipfsResult.mimeType,
                gatewayUrl: ipfsResult.gatewayUrl,
                uploadedAt: ipfsResult.uploadedAt.toISOString(),
                // arkivEntityId se agregará en Fase 5 cuando integremos Arkiv
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('❌ Error en upload:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor',
        });
    }
});
export default router;
//# sourceMappingURL=upload.routes.js.map