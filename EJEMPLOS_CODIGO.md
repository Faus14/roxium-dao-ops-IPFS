# Ejemplos de Código - IPFS + Arkiv Service

Este documento contiene ejemplos de código para guiar la implementación.

---

## 1. Estructura de Tipos

### `src/types/document.types.ts`
```typescript
export interface UploadRequest {
  file: Express.Multer.File;
  taskId: string;
  documentType?: 'PDF' | 'IMAGE';
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  mimeType: string;
  filename: string;
  uploadedAt: Date;
  gatewayUrl: string;
}

export interface UploadResponse {
  success: boolean;
  data: {
    cid: string;
    filename: string;
    size: number;
    mimeType: string;
    gatewayUrl: string;
    uploadedAt: string;
    arkivEntityId?: string;
  };
}
```

### `src/types/arkiv.types.ts`
```typescript
export interface AttachmentEntity {
  type: 'attachment';
  cid: string;
  filename: string;
  mimeType: string;
  size: number;
  taskId: string;
  gatewayUrl: string;
  uploadedAt: string;
}

export interface TaskExecutionEntity {
  type: 'taskExecution';
  taskId: string;
  proposalId: string;
  daoId: string;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
  changedBy: string;
}

export interface DAOEntity {
  type: 'dao';
  daoId: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
}

export interface ProposalEntity {
  type: 'proposal';
  proposalId: string;
  daoId: string;
  title: string;
  budget: number;
  status: string;
  createdAt: string;
}

export interface TaskEntity {
  type: 'task';
  taskId: string;
  proposalId: string;
  title: string;
  budget: number;
  status: string;
  taskType: string;
  createdAt: string;
}
```

---

## 2. Servicio IPFS

### `src/services/ipfs.service.ts`
```typescript
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import type { IPFSUploadResult } from '../types/document.types.js';

export class IPFSService {
  private static instance: IPFSService;
  private helia: any;
  private fs: any;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Inicializando nodo Helia...');
    this.helia = await createHelia();
    this.fs = unixfs(this.helia);
    this.initialized = true;
    console.log('✅ Nodo Helia inicializado');
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<IPFSUploadResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`📤 Subiendo archivo a IPFS: ${filename}`);

    try {
      const cid = await this.fs.addBytes(buffer);
      const cidString = cid.toString();

      const result: IPFSUploadResult = {
        cid: cidString,
        size: buffer.length,
        mimeType,
        filename,
        uploadedAt: new Date(),
        gatewayUrl: `https://ipfs.io/ipfs/${cidString}`,
      };

      console.log(`✅ Archivo subido. CID: ${cidString}`);
      return result;
    } catch (error) {
      console.error('❌ Error subiendo archivo a IPFS:', error);
      throw new Error(`Error al subir archivo a IPFS: ${error.message}`);
    }
  }

  async stop(): Promise<void> {
    if (this.helia) {
      await this.helia.stop();
      this.initialized = false;
      console.log('🛑 Nodo Helia detenido');
    }
  }
}
```

---

## 3. Servicio Arkiv

### `src/services/arkiv.service.ts`
```typescript
import { WalletClient, PublicClient } from '@arkiv-network/sdk';
import type {
  AttachmentEntity,
  TaskExecutionEntity,
} from '../types/arkiv.types.js';

export class ArkivService {
  private static instance: ArkivService;
  private walletClient: WalletClient | null = null;
  private publicClient: PublicClient | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): ArkivService {
    if (!ArkivService.instance) {
      ArkivService.instance = new ArkivService();
    }
    return ArkivService.instance;
  }

  async initialize(
    rpcUrl: string,
    wsUrl: string,
    privateKey: string
  ): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔗 Conectando a Arkiv (Mendoza testnet)...');

    try {
      // Inicializar wallet client
      this.walletClient = new WalletClient({
        rpcUrl,
        wsUrl,
        privateKey,
      });

      // Inicializar public client para queries
      this.publicClient = new PublicClient({
        rpcUrl,
        wsUrl,
      });

      // Test de conexión
      // await this.publicClient.healthCheck();

      this.initialized = true;
      console.log('✅ Conectado a Arkiv');
    } catch (error) {
      console.error('❌ Error conectando a Arkiv:', error);
      throw new Error(`Error al conectar a Arkiv: ${error.message}`);
    }
  }

  async registerAttachment(
    attachment: Omit<AttachmentEntity, 'type'>
  ): Promise<string> {
    if (!this.initialized || !this.walletClient) {
      throw new Error('ArkivService no inicializado');
    }

    console.log(`📝 Registrando attachment en Arkiv: ${attachment.cid}`);

    try {
      const payload = JSON.stringify({
        cid: attachment.cid,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        taskId: attachment.taskId,
        gatewayUrl: attachment.gatewayUrl,
        uploadedAt: attachment.uploadedAt,
      });

      const entity = await this.walletClient.createEntity({
        payload,
        contentType: 'application/json',
        attributes: {
          type: 'attachment',
          cid: attachment.cid,
          taskId: attachment.taskId,
          filename: attachment.filename,
        },
      });

      console.log(`✅ Attachment registrado. EntityId: ${entity.id}`);
      return entity.id;
    } catch (error) {
      console.error('❌ Error registrando attachment:', error);
      throw new Error(`Error al registrar attachment: ${error.message}`);
    }
  }

  async registerTaskExecution(
    execution: Omit<TaskExecutionEntity, 'type'>
  ): Promise<string> {
    if (!this.initialized || !this.walletClient) {
      throw new Error('ArkivService no inicializado');
    }

    console.log(
      `📝 Registrando cambio de estado: Task ${execution.taskId} (${execution.previousStatus} → ${execution.newStatus})`
    );

    try {
      const payload = JSON.stringify({
        taskId: execution.taskId,
        proposalId: execution.proposalId,
        daoId: execution.daoId,
        previousStatus: execution.previousStatus,
        newStatus: execution.newStatus,
        changedAt: execution.changedAt,
        changedBy: execution.changedBy,
      });

      const entity = await this.walletClient.createEntity({
        payload,
        contentType: 'application/json',
        attributes: {
          type: 'taskExecution',
          taskId: execution.taskId,
          proposalId: execution.proposalId,
          daoId: execution.daoId,
          newStatus: execution.newStatus,
        },
      });

      console.log(`✅ Cambio de estado registrado. EntityId: ${entity.id}`);
      return entity.id;
    } catch (error) {
      console.error('❌ Error registrando cambio de estado:', error);
      throw new Error(`Error al registrar cambio de estado: ${error.message}`);
    }
  }

  async getTaskAttachments(taskId: string): Promise<AttachmentEntity[]> {
    if (!this.initialized || !this.publicClient) {
      throw new Error('ArkivService no inicializado');
    }

    try {
      const query = this.publicClient.buildQuery({
        attributes: {
          type: 'attachment',
          taskId: taskId,
        },
      });

      const entities = await this.publicClient.query(query);

      return entities.map((entity) => {
        const payload = JSON.parse(entity.payload);
        return {
          type: 'attachment',
          ...payload,
        };
      });
    } catch (error) {
      console.error('❌ Error consultando attachments:', error);
      throw new Error(`Error al consultar attachments: ${error.message}`);
    }
  }

  async getTaskHistory(taskId: string): Promise<TaskExecutionEntity[]> {
    if (!this.initialized || !this.publicClient) {
      throw new Error('ArkivService no inicializado');
    }

    try {
      const query = this.publicClient.buildQuery({
        attributes: {
          type: 'taskExecution',
          taskId: taskId,
        },
      });

      const entities = await this.publicClient.query(query);

      return entities.map((entity) => {
        const payload = JSON.parse(entity.payload);
        return {
          type: 'taskExecution',
          ...payload,
        };
      });
    } catch (error) {
      console.error('❌ Error consultando historial:', error);
      throw new Error(`Error al consultar historial: ${error.message}`);
    }
  }
}
```

---

## 4. API Routes

### `src/api/routes/upload.routes.ts`
```typescript
import express from 'express';
import multer from 'multer';
import { IPFSService } from '../../services/ipfs.service.js';
import { ArkivService } from '../../services/arkiv.service.js';
import type { UploadResponse } from '../../types/document.types.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const ipfsService = IPFSService.getInstance();
const arkivService = ArkivService.getInstance();

router.post('/upload', upload.single('file'), async (req, res) => {
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

    // Subir a IPFS
    const ipfsResult = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Registrar en Arkiv
    let arkivEntityId: string | undefined;
    try {
      arkivEntityId = await arkivService.registerAttachment({
        cid: ipfsResult.cid,
        filename: ipfsResult.filename,
        mimeType: ipfsResult.mimeType,
        size: ipfsResult.size,
        taskId,
        gatewayUrl: ipfsResult.gatewayUrl,
        uploadedAt: ipfsResult.uploadedAt.toISOString(),
      });
    } catch (arkivError) {
      console.error('⚠️ Error registrando en Arkiv (continuando):', arkivError);
      // No fallar el upload si Arkiv falla, solo loguear
    }

    const response: UploadResponse = {
      success: true,
      data: {
        cid: ipfsResult.cid,
        filename: ipfsResult.filename,
        size: ipfsResult.size,
        mimeType: ipfsResult.mimeType,
        gatewayUrl: ipfsResult.gatewayUrl,
        uploadedAt: ipfsResult.uploadedAt.toISOString(),
        arkivEntityId,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error en upload:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
});

export default router;
```

### `src/api/routes/task.routes.ts`
```typescript
import express from 'express';
import { ArkivService } from '../../services/arkiv.service.js';

const router = express.Router();
const arkivService = ArkivService.getInstance();

// Registrar cambio de estado
router.post('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { previousStatus, newStatus, proposalId, daoId, changedBy } =
      req.body;

    // Validaciones
    if (!previousStatus || !newStatus || !proposalId || !daoId || !changedBy) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos',
      });
    }

    const entityId = await arkivService.registerTaskExecution({
      taskId,
      proposalId,
      daoId,
      previousStatus,
      newStatus,
      changedAt: new Date().toISOString(),
      changedBy,
    });

    res.status(200).json({
      success: true,
      data: {
        entityId,
        taskId,
        statusChange: {
          from: previousStatus,
          to: newStatus,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error registrando cambio de estado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener attachments de una task
router.get('/:taskId/attachments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachments = await arkivService.getTaskAttachments(taskId);

    res.status(200).json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('❌ Error obteniendo attachments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
});

// Obtener historial de una task
router.get('/:taskId/history', async (req, res) => {
  try {
    const { taskId } = req.params;
    const history = await arkivService.getTaskHistory(taskId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
});

export default router;
```

---

## 5. Configuración de Express (app.ts)

### `src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import uploadRoutes from './api/routes/upload.routes.js';
import taskRoutes from './api/routes/task.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

export default app;
```

---

## 6. Punto de Entrada del Servidor (index.ts)

### `src/index.ts`
```typescript
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
    const rpcUrl = process.env.ARKIV_RPC_URL!;
    const wsUrl = process.env.ARKIV_WS_URL!;
    const privateKey = process.env.ARKIV_PRIVATE_KEY!;

    if (!rpcUrl || !wsUrl || !privateKey) {
      throw new Error('Faltan variables de entorno de Arkiv');
    }

    await ArkivService.getInstance().initialize(rpcUrl, wsUrl, privateKey);

    console.log('✅ Servicios inicializados');
  } catch (error) {
    console.error('❌ Error inicializando servicios:', error);
    process.exit(1);
  }
}

// Iniciar servidor
async function start() {
  await initializeServices();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
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
```

---

## 6. Configuración

### `.env.example`
```env
# Server
PORT=3000
NODE_ENV=development

# IPFS/Helia
HELIA_DATA_DIR=./helia-data

# Arkiv (Mendoza Testnet)
ARKIV_RPC_URL=https://mendoza-rpc.arkiv.dev
ARKIV_WS_URL=wss://mendoza-ws.arkiv.dev
ARKIV_PRIVATE_KEY=your_private_key_here
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 7. Ejemplo de Uso desde Frontend

### JavaScript/TypeScript
```typescript
async function uploadDocument(file: File, taskId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('taskId', taskId);

  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    console.log('CID:', result.data.cid);
    console.log('Gateway URL:', result.data.gatewayUrl);
    // Guardar CID en Vetra
    return result.data.cid;
  } else {
    throw new Error(result.error);
  }
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@documento.pdf" \
  -F "taskId=task-123"
```

---

## 8. Notas de Implementación

### SDK de Arkiv
El SDK de Arkiv puede tener una API diferente. Consulta la documentación oficial:
- https://docs.arkiv.dev
- Verifica los métodos exactos de `WalletClient` y `PublicClient`
- Ajusta los ejemplos según la versión del SDK

### Manejo de Errores
- Considera retry logic para operaciones de Arkiv
- Implementa timeout para uploads grandes
- Valida tamaño de archivo si es necesario (aunque no es requerimiento)

### Performance
- Considera pool de conexiones Helia si hay muchos uploads simultáneos
- Cache queries a Arkiv si es necesario
- Considera queue system para uploads asíncronos en el futuro

---

**Nota:** Estos son ejemplos de referencia. Ajusta según la documentación oficial de las librerías y tus necesidades específicas.

