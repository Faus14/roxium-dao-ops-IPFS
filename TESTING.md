# Guía de Testing - Fase 1

## ✅ Verificaciones Completadas

1. **Instalación de dependencias**: ✅
   - Todas las dependencias se instalaron correctamente
   - Nota: Se removió `@arkiv-network/sdk` temporalmente (se agregará en Fase 4)

2. **Compilación TypeScript**: ✅
   - El código compila sin errores
   - Se corrigió un error de tipo en `validation.utils.ts`

3. **Estructura de archivos**: ✅
   - Todos los archivos base están creados
   - Estructura de carpetas correcta

## 🧪 Pruebas Manuales Necesarias

### 1. Iniciar el servidor

```bash
npm run dev
```

**Salida esperada:**
```
🔧 Inicializando servicios...
⚠️  IPFSService: Pendiente de implementación (Fase 2)
⚠️  Advertencia: Faltan variables de entorno de Arkiv
   El servicio funcionará pero no se registrarán eventos en Arkiv
⚠️  ArkivService: Pendiente de implementación (Fase 4)
✅ Servicios inicializados
🚀 Servidor corriendo en http://localhost:3000
📝 Health check: http://localhost:3000/api/health
```

### 2. Probar Health Check

**Opción A: Navegador**
- Abrir: `http://localhost:3000/api/health`
- Deberías ver: `{"status":"ok","timestamp":"...","service":"roxium-dao-ops-ipfs"}`

**Opción B: PowerShell**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
```

**Opción C: cURL**
```bash
curl http://localhost:3000/api/health
```

### 3. Probar Endpoints Placeholder

**Upload (debería retornar 501):**
```bash
curl -X POST http://localhost:3000/api/upload
```

**Task Status (debería retornar 501):**
```bash
curl -X POST http://localhost:3000/api/tasks/test-123/status
```

**Task Attachments (debería retornar 501):**
```bash
curl http://localhost:3000/api/tasks/test-123/attachments
```

## 📋 Checklist de Verificación

- [ ] El servidor inicia sin errores
- [ ] Health check responde correctamente
- [ ] Los endpoints placeholder retornan 501 (Not Implemented)
- [ ] No hay errores en la consola
- [ ] El servidor se puede detener con Ctrl+C

## 🔍 Troubleshooting

### El servidor no inicia

1. Verificar que el puerto 3000 no esté en uso:
   ```powershell
   netstat -ano | findstr :3000
   ```

2. Verificar variables de entorno:
   - Crear archivo `.env` basado en `.env.example`
   - O usar valores por defecto (PORT=3000)

3. Verificar que TypeScript compile:
   ```bash
   npm run build
   ```

### Error de módulos no encontrados

```bash
npm install
```

### Error de TypeScript

```bash
npm run build
```

## ✅ Estado Actual

- **Fase 1**: ✅ Completada
- **Fase 2**: ⏳ Pendiente (Servicio IPFS)
- **Fase 3**: ⏳ Pendiente (API REST completa)
- **Fase 4**: ⏳ Pendiente (Arkiv SDK)

## 🚀 Próximos Pasos

Una vez verificado que el servidor funciona correctamente:

1. **Fase 2**: Implementar servicio IPFS con Helia
2. **Fase 3**: Completar endpoints de upload
3. **Fase 4**: Integrar SDK de Arkiv

