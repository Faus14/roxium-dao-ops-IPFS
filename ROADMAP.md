# Roadmap: Implementación IPFS + Helia + Arkiv

## 📋 Resumen Ejecutivo

Este roadmap detalla la implementación de un **servicio Node.js/TypeScript completo con servidor HTTP** que:
- Recibe archivos (PDFs e imágenes) desde el frontend mediante API REST
- Los sube a IPFS usando Helia
- Registra los CIDs y metadata en Arkiv (Mendoza testnet)
- Actúa como el "blob store" descentralizado de la arquitectura

**Tipo de Proyecto:**
- ✅ Proyecto Node.js completo con servidor Express
- ✅ Punto de entrada: `src/index.ts` (levanta el servidor)
- ✅ Configuración de Express: `src/app.ts` (middleware, routes)
- ✅ API REST con endpoints para upload y gestión de tasks
- ✅ Servicio dedicado (no integrado en Vetra)

**Arquitectura de 3 capas:**
1. **Vetra** (operacional) - ERP que maneja estados y workflows
2. **IPFS + Helia** (blob store) - Este servicio Node.js
3. **Arkiv** (audit log / DB-chain) - Registro inmutable de eventos

---

## 🎯 Fases de Implementación

### **FASE 1: Configuración del Proyecto y Infraestructura Base**

#### 1.1 Estructura del Proyecto
```
roxium-dao-ops-IPFS/
├── src/
│   ├── index.ts                 # Punto de entrada - levanta el servidor
│   ├── app.ts                   # Configuración de Express (middleware, routes)
│   ├── services/
│   │   ├── ipfs.service.ts      # Servicio Helia para IPFS
│   │   └── arkiv.service.ts     # Servicio para interactuar con Arkiv
│   ├── api/
│   │   └── routes/
│   │       ├── upload.routes.ts # Endpoints para subir archivos
│   │       ├── task.routes.ts   # Endpoints para tasks (status, history)
│   │       └── health.routes.ts # Health check
│   ├── types/
│   │   ├── document.types.ts    # Tipos para documentos
│   │   └── arkiv.types.ts       # Tipos para entidades Arkiv
│   ├── utils/
│   │   ├── file.utils.ts        # Utilidades para manejo de archivos
│   │   └── validation.utils.ts # Validaciones básicas
│   └── config/
│       └── env.config.ts        # Configuración de variables de entorno
├── dist/                        # Código compilado (generado)
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

#### 1.2 Dependencias Principales
```json
{
  "dependencies": {
    "helia": "^2.0.0",
    "@helia/unixfs": "^2.0.0",
    "@arkiv-network/sdk": "^latest",
    "express": "^4.18.0",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "zod": "^3.22.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.0",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:dev": "nodemon --exec tsx src/index.ts"
  }
}
```

#### 1.3 Variables de Entorno
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

# Storacha (opcional, para pinning)
STORACHA_SPACE_DID=did:key:...
```

**Tareas:**
- [ ] Crear estructura de carpetas
- [ ] Configurar TypeScript
- [ ] Instalar dependencias
- [ ] Configurar variables de entorno
- [ ] Setup de scripts (dev, build, start)
- [ ] Crear `src/index.ts` - punto de entrada del servidor
- [ ] Crear `src/app.ts` - configuración de Express

---

### **FASE 2: Servicio IPFS con Helia**

#### 2.1 Servicio Helia Base
Implementar `src/services/ipfs.service.ts`:

**Funcionalidades:**
- Inicializar nodo Helia (singleton)
- Subir archivos usando `@helia/unixfs`
- Retornar CID y metadata
- Manejo de errores y cleanup

**Interfaz esperada:**
```typescript
interface IPFSUploadResult {
  cid: string;
  size: number;
  mimeType: string;
  filename: string;
  uploadedAt: Date;
}
```

**Tareas:**
- [ ] Crear clase `IPFSService` con singleton pattern
- [ ] Implementar `uploadFile(buffer: Buffer, filename: string, mimeType: string)`
- [ ] Implementar `getFile(cid: string)` para lectura (opcional)
- [ ] Manejo de lifecycle del nodo Helia
- [ ] Tests unitarios básicos

#### 2.2 Soporte para PDFs e Imágenes
- Aceptar `multipart/form-data` con archivos
- Detectar MIME type automáticamente
- No validar tamaño/tipo (según requerimientos)
- Guardar metadata del archivo original

**Tareas:**
- [ ] Configurar multer para recibir archivos
- [ ] Detección de MIME type
- [ ] Extracción de metadata (nombre, tamaño)

---

### **FASE 3: API REST para Upload**

#### 3.1 Estructura del Servidor
- **`src/index.ts`**: Punto de entrada que levanta el servidor
  - Inicializa servicios (IPFS, Arkiv)
  - Ejecuta `app.listen(PORT)`
  - Maneja graceful shutdown
- **`src/app.ts`**: Configuración de Express
  - Middleware (CORS, JSON parser)
  - Routes
  - Error handlers

#### 3.2 Endpoint Principal: POST /api/upload
**Request:**
```typescript
POST /api/upload
Content-Type: multipart/form-data

{
  file: File,
  taskId: string,        // ID de la Task asociada
  documentType?: string  // Opcional: "PDF" | "IMAGE"
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    cid: string,
    filename: string,
    size: number,
    mimeType: string,
    gatewayUrl: string,
    uploadedAt: string
  }
}
```

#### 3.2 Endpoints Adicionales
- `GET /api/health` - Health check
- `GET /api/file/:cid` - Obtener metadata de un archivo por CID (opcional)

**Tareas:**
- [ ] Configurar Express/Fastify
- [ ] Implementar middleware de multer
- [ ] Crear endpoint POST /api/upload
- [ ] Integrar con IPFSService
- [ ] Manejo de errores HTTP
- [ ] Validación de request (taskId requerido)
- [ ] CORS configuration para frontend

---

### **FASE 4: Integración con Arkiv SDK**

#### 4.1 Configuración de Arkiv
Implementar `src/services/arkiv.service.ts`:

**Setup inicial:**
- Conectar a Mendoza testnet usando SDK
- Configurar wallet client con private key
- Configurar public client para queries

**Tareas:**
- [ ] Instalar `@arkiv-network/sdk`
- [ ] Crear clase `ArkivService`
- [ ] Configurar conexión RPC + WS
- [ ] Setup de wallet client
- [ ] Tests de conexión

#### 4.2 Tipos de Entidades Arkiv

Según la arquitectura, necesitamos:

**1. `type=attachment` (Documentos)**
```typescript
{
  type: "attachment",
  cid: string,
  filename: string,
  mimeType: string,
  size: number,
  taskId: string,
  gatewayUrl: string,
  uploadedAt: string
}
```

**2. `type=taskExecution` (Cambios de estado)**
```typescript
{
  type: "taskExecution",
  taskId: string,
  proposalId: string,
  daoId: string,
  previousStatus: string,
  newStatus: string,
  changedAt: string,
  changedBy: string
}
```

**3. `type=dao` (DAOs)**
```typescript
{
  type: "dao",
  daoId: string,
  name: string,
  description: string,
  createdAt: string,
  ownerId: string
}
```

**4. `type=proposal` (Proposals)**
```typescript
{
  type: "proposal",
  proposalId: string,
  daoId: string,
  title: string,
  budget: number,
  status: string,
  createdAt: string
}
```

**5. `type=task` (Tasks)**
```typescript
{
  type: "task",
  taskId: string,
  proposalId: string,
  title: string,
  budget: number,
  status: string,
  taskType: string,
  createdAt: string
}
```

**Tareas:**
- [ ] Definir tipos TypeScript para cada entidad
- [ ] Crear funciones helper para construir payloads
- [ ] Documentar estructura de attributes para queries

---

### **FASE 5: Registro de Documentos en Arkiv**

#### 5.1 Implementar `registerAttachment()`
Después de subir a IPFS, registrar en Arkiv:

**Flujo:**
1. Archivo subido a IPFS → obtener CID
2. Crear entidad Arkiv con `type=attachment`
3. Guardar en blockchain
4. Retornar CID + entityId de Arkiv

**Implementación:**
```typescript
async registerAttachment(
  cid: string,
  filename: string,
  mimeType: string,
  size: number,
  taskId: string,
  gatewayUrl: string
): Promise<string> // Retorna entityId
```

**Tareas:**
- [ ] Implementar `registerAttachment()` en ArkivService
- [ ] Integrar en el endpoint `/api/upload`
- [ ] Manejo de errores (rollback si falla Arkiv)
- [ ] Logging de operaciones
- [ ] Tests de integración

---

### **FASE 6: Registro de Cambios de Estado**

#### 6.1 Endpoint para Cambios de Estado
**POST /api/tasks/:taskId/status**

**Request:**
```typescript
{
  previousStatus: string,
  newStatus: string,
  proposalId: string,
  daoId: string,
  changedBy: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    entityId: string,
    taskId: string,
    statusChange: {
      from: string,
      to: string
    }
  }
}
```

**Tareas:**
- [ ] Crear endpoint para cambios de estado
- [ ] Implementar `registerTaskExecution()` en ArkivService
- [ ] Validación de transiciones de estado
- [ ] Integración con el flujo

---

### **FASE 7: Queries y Consultas en Arkiv**

#### 7.1 Funciones de Query
Implementar queries para recuperar datos desde Arkiv:

**Queries útiles:**
- Obtener todos los attachments de una Task
- Obtener historial de cambios de estado de una Task
- Obtener todas las Tasks de una Proposal
- Obtener todas las Proposals de un DAO

**Tareas:**
- [ ] Implementar `queryByType()` helper
- [ ] Crear funciones específicas:
  - `getTaskAttachments(taskId: string)`
  - `getTaskHistory(taskId: string)`
  - `getProposalTasks(proposalId: string)`
  - `getDAOProposals(daoId: string)`
- [ ] Endpoints REST opcionales para queries
- [ ] Documentar queries disponibles

---

### **FASE 8: Testing y Documentación**

#### 8.1 Testing
- [ ] Tests unitarios para IPFSService
- [ ] Tests unitarios para ArkivService
- [ ] Tests de integración para flujo completo
- [ ] Tests E2E para endpoints API
- [ ] Mock de Helia para tests
- [ ] Mock de Arkiv SDK para tests

#### 8.2 Documentación
- [ ] README con instrucciones de setup
- [ ] Documentación de API (Swagger/OpenAPI)
- [ ] Guía de deployment
- [ ] Ejemplos de uso
- [ ] Troubleshooting guide
- [ ] Diagrama de flujo de arquitectura

---

### **FASE 9: Deployment y Producción**

#### 9.1 Preparación para Producción
- [ ] Configurar variables de entorno de producción
- [ ] Setup de logging (Winston/Pino)
- [ ] Manejo de errores centralizado
- [ ] Rate limiting para API
- [ ] Health checks mejorados
- [ ] Monitoring básico

#### 9.2 Deployment
- [ ] Dockerfile
- [ ] docker-compose.yml (opcional)
- [ ] Scripts de deployment
- [ ] Configuración de servidor dedicado
- [ ] Backup de datos locales (si aplica)

---

## 🔄 Flujo Completo de Upload

```
1. Frontend → POST /api/upload (multipart/form-data)
   ├── file: PDF/Image
   └── taskId: string

2. Backend recibe archivo
   ├── Extrae metadata (nombre, tamaño, MIME type)
   └── Valida taskId

3. Backend → IPFSService.uploadFile()
   ├── Crea/usa nodo Helia
   ├── Sube archivo a IPFS
   └── Retorna CID

4. Backend → ArkivService.registerAttachment()
   ├── Construye payload con metadata
   ├── Crea entidad type=attachment
   ├── Guarda en Arkiv (Mendoza)
   └── Retorna entityId

5. Backend → Response al Frontend
   ├── CID
   ├── Metadata del archivo
   ├── Gateway URL
   └── EntityId de Arkiv (opcional)
```

---

## 📊 Priorización

### **MVP (Mínimo Producto Viable)**
1. ✅ Fase 1: Configuración base
2. ✅ Fase 2: Servicio IPFS
3. ✅ Fase 3: API REST básica
4. ✅ Fase 4: Setup Arkiv SDK
5. ✅ Fase 5: Registro de attachments

### **Fase 2 (Funcionalidad Completa)**
6. ✅ Fase 6: Registro de cambios de estado
7. ✅ Fase 7: Queries básicas

### **Fase 3 (Producción)**
8. ✅ Fase 8: Testing completo
9. ✅ Fase 9: Deployment

---

## 🚨 Consideraciones Importantes

### **Seguridad**
- [ ] Validar que taskId existe antes de subir
- [ ] Rate limiting por IP/usuario
- [ ] Sanitización de nombres de archivo
- [ ] Protección de private key de Arkiv
- [ ] HTTPS en producción

### **Performance**
- [ ] Pool de conexiones Helia (si necesario)
- [ ] Caching de queries a Arkiv
- [ ] Timeout configurable para uploads grandes
- [ ] Compresión de archivos grandes (opcional)

### **Manejo de Errores**
- [ ] Retry logic para Arkiv (si falla temporalmente)
- [ ] Rollback si falla registro en Arkiv después de IPFS
- [ ] Logging estructurado de errores
- [ ] Notificaciones de errores críticos

### **Escalabilidad Futura**
- [ ] Considerar pinning service (Storacha) para persistencia
- [ ] Queue system para uploads asíncronos (si crece)
- [ ] CDN para gateway URLs
- [ ] Múltiples nodos Helia (si necesario)

---

## 📝 Notas de Implementación

### **Relación con Vetra**
- Este servicio es **independiente** de Vetra
- Vetra llamará a este servicio cuando necesite subir documentos
- El CID retornado se guardará en Vetra (campo `Document.cid` en lugar de `Document.URL`)
- Los cambios de estado pueden venir de Vetra o registrarse directamente aquí

### **Arkiv como DB Principal**
- Arkiv almacenará TODOS los eventos importantes
- Vetra puede consultar Arkiv para obtener historial
- Arkiv es la fuente de verdad inmutable
- Vetra es el ERP operacional que consulta Arkiv

---

## ✅ Checklist de Inicio

Antes de comenzar, asegúrate de tener:
- [ ] Node.js 18+ instalado
- [ ] Credenciales de Arkiv (private key)
- [ ] Acceso a Mendoza testnet (RPC + WS URLs)
- [ ] Servidor dedicado configurado (o local para desarrollo)
- [ ] Repositorio Git configurado

---

## 🎯 Próximos Pasos Inmediatos

1. **Obtener credenciales de Arkiv** (private key para Mendoza testnet)
2. **Crear estructura base del proyecto** (Fase 1)
3. **Implementar servicio IPFS básico** (Fase 2)
4. **Crear endpoint de upload** (Fase 3)
5. **Integrar con Arkiv** (Fase 4-5)

---

**Última actualización:** 2025-01-XX
**Versión:** 1.0.0

