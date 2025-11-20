# Plan de Acción: Implementación IPFS + Arkiv

## 🎯 Objetivo
Crear un servicio Node/TypeScript que reciba archivos del frontend, los suba a IPFS usando Helia, y registre los eventos en Arkiv (Mendoza testnet).

---

## 📋 Checklist de Implementación

### **PASO 1: Setup Inicial** (2-3 horas)

- [ ] **1.1** Crear estructura de carpetas
  ```
  src/
    services/
    api/
    types/
    utils/
    config/
  ```

- [ ] **1.2** Configurar TypeScript
  - Crear `tsconfig.json`
  - Configurar paths y compilación

- [ ] **1.3** Actualizar `package.json`
  - Agregar dependencias: `express`, `multer`, `@arkiv-network/sdk`, `dotenv`, `zod`
  - Agregar devDependencies: `@types/*`, `typescript`, `tsx`, `nodemon`
  - Agregar scripts: `dev`, `build`, `start`

- [ ] **1.4** Crear `.env.example`
  - Variables: PORT, HELIA_DATA_DIR, ARKIV_RPC_URL, ARKIV_WS_URL, ARKIV_PRIVATE_KEY

- [ ] **1.5** Instalar dependencias
  ```bash
  npm install
  ```

---

### **PASO 2: Servicio IPFS** (3-4 horas)

- [ ] **2.1** Crear `src/services/ipfs.service.ts`
  - Clase singleton `IPFSService`
  - Método `initialize()` para crear nodo Helia
  - Método `uploadFile(buffer, filename, mimeType)` → retorna CID
  - Método `stop()` para cleanup

- [ ] **2.2** Implementar upload con Helia
  ```typescript
  import { createHelia } from 'helia'
  import { unixfs } from '@helia/unixfs'
  ```

- [ ] **2.3** Tests básicos
  - Test de upload de archivo pequeño
  - Verificar que retorna CID válido

---

### **PASO 3: API REST** (4-5 horas)

- [ ] **3.1** Crear `src/app.ts`
  - Setup Express
  - Configurar CORS
  - Middleware de errores
  - Configurar routes

- [ ] **3.2** Crear `src/index.ts` (punto de entrada)
  - Importar app
  - Inicializar servicios (IPFS, Arkiv)
  - Levantar servidor con app.listen()
  - Graceful shutdown

- [ ] **3.3** Crear `src/api/routes/upload.routes.ts`
  - POST `/api/upload`
  - Middleware multer para recibir archivos
  - Validar `taskId` en body
  - Llamar a IPFSService
  - Retornar respuesta con CID y metadata

- [ ] **3.4** Probar que el servidor levanta correctamente
  - GET `/api/health` → `{ status: "ok" }`

- [ ] **3.5** Probar endpoint de upload
  - Usar Postman/curl para subir archivo
  - Verificar que retorna CID

---

### **PASO 4: Configurar Arkiv SDK** (2-3 horas)

- [ ] **4.1** Obtener credenciales
  - Private key para wallet
  - RPC y WS URLs de Mendoza testnet

- [ ] **4.2** Instalar SDK
  ```bash
  npm install @arkiv-network/sdk
  ```

- [ ] **4.3** Crear `src/services/arkiv.service.ts`
  - Clase `ArkivService`
  - Método `initialize()` para conectar
  - Setup de wallet client y public client
  - Test de conexión básico

- [ ] **4.4** Verificar conexión
  - Hacer query simple a Arkiv
  - Confirmar que funciona

---

### **PASO 5: Registrar Attachments** (4-5 horas)

- [ ] **5.1** Definir tipos en `src/types/arkiv.types.ts`
  ```typescript
  interface AttachmentEntity {
    type: "attachment"
    cid: string
    filename: string
    mimeType: string
    size: number
    taskId: string
    gatewayUrl: string
    uploadedAt: string
  }
  ```

- [ ] **5.2** Implementar `registerAttachment()` en ArkivService
  - Construir payload JSON
  - Definir attributes para queries
  - Llamar a `walletClient.createEntity()`
  - Retornar entityId

- [ ] **5.3** Integrar en endpoint `/api/upload`
  - Después de subir a IPFS, registrar en Arkiv
  - Manejar errores (si falla Arkiv, loguear pero no fallar upload)

- [ ] **5.4** Probar flujo completo
  - Subir archivo → IPFS → Arkiv
  - Verificar entidad en Arkiv testnet

---

### **PASO 6: Registrar Cambios de Estado** (3-4 horas)

- [ ] **6.1** Definir tipo `TaskExecutionEntity` en types

- [ ] **6.2** Crear endpoint POST `/api/tasks/:taskId/status`
  - Recibir: `previousStatus`, `newStatus`, `proposalId`, `daoId`, `changedBy`
  - Validar datos
  - Llamar a `registerTaskExecution()`

- [ ] **6.3** Implementar `registerTaskExecution()` en ArkivService
  - Similar a `registerAttachment()`
  - Tipo: `"taskExecution"`

- [ ] **6.4** Probar endpoint
  - Simular cambio de estado
  - Verificar en Arkiv

---

### **PASO 7: Queries Básicas** (3-4 horas)

- [ ] **7.1** Implementar helper `queryByType()` en ArkivService
  - Usar `publicClient.buildQuery()`
  - Filtrar por `type` attribute

- [ ] **7.2** Crear funciones específicas
  - `getTaskAttachments(taskId: string)`
  - `getTaskHistory(taskId: string)`

- [ ] **7.3** (Opcional) Crear endpoints GET para queries
  - GET `/api/tasks/:taskId/attachments`
  - GET `/api/tasks/:taskId/history`

---

### **PASO 8: Testing y Documentación** (4-6 horas)

- [ ] **8.1** Tests unitarios
  - IPFSService
  - ArkivService
  - Utils

- [ ] **8.2** Tests de integración
  - Flujo completo upload → IPFS → Arkiv
  - Manejo de errores

- [ ] **8.3** Documentación
  - Actualizar README.md
  - Documentar endpoints (Swagger o markdown)
  - Ejemplos de uso
  - Guía de deployment

---

### **PASO 9: Preparación para Producción** (3-4 horas)

- [ ] **9.1** Logging
  - Configurar Winston o Pino
  - Logs estructurados

- [ ] **9.2** Manejo de errores
  - Error handler centralizado
  - Códigos HTTP apropiados

- [ ] **9.3** Variables de entorno
  - `.env` para desarrollo
  - Documentar variables de producción

- [ ] **9.4** Health checks mejorados
  - Verificar conexión a Arkiv
  - Verificar nodo Helia

- [ ] **9.5** Docker (opcional)
  - Dockerfile
  - docker-compose.yml

---

## 🚀 Orden de Ejecución Recomendado

### **Sprint 1 (MVP)** - Semana 1
1. Paso 1: Setup inicial
2. Paso 2: Servicio IPFS
3. Paso 3: API REST básica
4. Paso 4: Configurar Arkiv SDK

### **Sprint 2 (Funcionalidad Core)** - Semana 2
5. Paso 5: Registrar attachments
6. Paso 6: Registrar cambios de estado
7. Paso 7: Queries básicas

### **Sprint 3 (Producción)** - Semana 3
8. Paso 8: Testing y documentación
9. Paso 9: Preparación para producción

---

## 📝 Notas Importantes

### **Antes de Empezar**
- [ ] Tener credenciales de Arkiv (private key)
- [ ] Tener URLs de RPC y WS de Mendoza testnet
- [ ] Servidor dedicado configurado (o ambiente local)

### **Durante el Desarrollo**
- Usar `tsx` para desarrollo (hot reload)
- Probar cada paso antes de continuar
- Commit frecuente en Git
- Documentar decisiones importantes

### **Integración con Frontend**
- El frontend debe enviar `multipart/form-data`
- Incluir `taskId` en el body
- El backend retorna CID que el frontend guarda en Vetra

### **Integración con Vetra**
- Vetra guardará el CID en `Document.cid`
- Vetra puede llamar a este servicio para subir documentos
- Vetra puede consultar Arkiv para historial

---

## 🔍 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Tests
npm test

# Linting
npm run lint
```

---

## ✅ Criterios de Éxito

El proyecto está completo cuando:
- [ ] Se puede subir un PDF/imagen y obtener CID
- [ ] El CID se registra automáticamente en Arkiv
- [ ] Se pueden registrar cambios de estado en Arkiv
- [ ] Se pueden consultar attachments por taskId
- [ ] La API está documentada
- [ ] Hay tests básicos funcionando
- [ ] El servicio está listo para deployment

---

**Última actualización:** 2025-01-XX

