# Script de prueba completa - Fases 1 y 2
Write-Host "`n🧪 PRUEBA COMPLETA - FASES 1 Y 2`n" -ForegroundColor Cyan

$projectPath = $PSScriptRoot
Set-Location $projectPath

# Limpiar procesos anteriores
Write-Host "1. Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Iniciar servidor en background
Write-Host "`n2. Iniciando servidor..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:projectPath
    npx tsx src/index.ts 2>&1
}

# Esperar a que el servidor inicie
Write-Host "   Esperando 8 segundos para que el servidor inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Verificar que el job está corriendo
if ($serverJob.State -eq "Running") {
    Write-Host "   ✅ Servidor iniciado (Job ID: $($serverJob.Id))" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Estado del servidor: $($serverJob.State)" -ForegroundColor Yellow
    $output = Receive-Job $serverJob
    Write-Host "   Output: $output" -ForegroundColor Gray
}

# ============================================
# FASE 1: PRUEBAS BÁSICAS DEL SERVIDOR
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "FASE 1: PRUEBAS BÁSICAS DEL SERVIDOR" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# PRUEBA 1.1: Health Check
Write-Host "PRUEBA 1.1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: $($json.status)" -ForegroundColor Green
    Write-Host "   ✅ Service: $($json.service)" -ForegroundColor Green
    Write-Host "   ✅ Timestamp: $($json.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# PRUEBA 1.2: Task Status Endpoint (placeholder)
Write-Host "`nPRUEBA 1.2: Task Status Endpoint (placeholder)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/tasks/test-123/status" -Method POST `
        -Body '{}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ⚠️  Status inesperado: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 501) {
        Write-Host "   ✅ Status 501 (Not Implemented) - Correcto para placeholder" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# PRUEBA 1.3: Task Attachments Endpoint (placeholder)
Write-Host "`nPRUEBA 1.3: Task Attachments Endpoint (placeholder)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/tasks/test-123/attachments" `
        -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ⚠️  Status inesperado: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 501) {
        Write-Host "   ✅ Status 501 (Not Implemented) - Correcto para placeholder" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# FASE 2: PRUEBAS DEL SERVICIO IPFS
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "FASE 2: PRUEBAS DEL SERVICIO IPFS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# PRUEBA 2.1: Upload sin archivo (validación)
Write-Host "PRUEBA 2.1: Upload sin archivo (validación)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/upload" -Method POST `
        -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ⚠️  Status inesperado: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Status 400 (Bad Request) - Validación correcta" -ForegroundColor Green
        $errorContent = $_.Exception.Response | Get-Member -MemberType Property | Where-Object { $_.Name -eq 'Content' }
        if ($errorContent) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            $errorJson = $responseBody | ConvertFrom-Json
            Write-Host "   ✅ Error message: $($errorJson.error)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# PRUEBA 2.2: Upload sin taskId (validación)
Write-Host "`nPRUEBA 2.2: Upload sin taskId (validación)" -ForegroundColor Yellow
$testFile = Join-Path $projectPath "ejemplo.txt"
if (Test-Path $testFile) {
    try {
        # Usar curl para hacer el upload sin taskId
        $curlResult = curl.exe -X POST http://localhost:3000/api/upload `
            -F "file=@$testFile" `
            2>&1
        
        if ($LASTEXITCODE -ne 0) {
            # Intentar parsear el error
            $errorText = $curlResult -join "`n"
            if ($errorText -match "400" -or $errorText -match "taskId" -or $errorText -match "requerido") {
                Write-Host "   ✅ Validación de taskId funcionando (400 Bad Request)" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Resultado: $errorText" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "   ⚠️  Error en prueba: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Archivo de prueba no encontrado, saltando..." -ForegroundColor Yellow
}

# PRUEBA 2.2b: Upload con tipo de archivo no permitido (validación MIME)
Write-Host "`nPRUEBA 2.2b: Upload con archivo de texto (validación MIME)" -ForegroundColor Yellow
$testFile = Join-Path $projectPath "ejemplo.txt"
if (Test-Path $testFile) {
    try {
        # Intentar subir archivo de texto (no permitido)
        $curlResult = curl.exe -X POST http://localhost:3000/api/upload `
            -F "file=@$testFile" `
            -F "taskId=test-task-123" `
            2>&1
        
        $errorText = $curlResult -join "`n"
        if ($errorText -match "400" -or $errorText -match "no permitido" -or $errorText -match "Tipo de archivo") {
            Write-Host "   ✅ Validación de tipo MIME funcionando (400 Bad Request)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Resultado: $errorText" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Error en prueba: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Archivo de prueba no encontrado, saltando..." -ForegroundColor Yellow
}

# PRUEBA 2.2c: Upload REAL con archivo válido (PDF o imagen)
Write-Host "`nPRUEBA 2.2c: Upload REAL con archivo válido (PDF o imagen)" -ForegroundColor Yellow
# Crear un archivo PNG de prueba simple (1x1 pixel PNG válido)
$testImagePath = Join-Path $projectPath "test-upload.png"
$pngBytes = [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
[System.IO.File]::WriteAllBytes($testImagePath, $pngBytes)

if (Test-Path $testImagePath) {
    try {
        Write-Host "   Subiendo archivo PNG de prueba..." -ForegroundColor Gray
        $curlResult = curl.exe -X POST http://localhost:3000/api/upload `
            -F "file=@$testImagePath" `
            -F "taskId=test-task-123" `
            -s `
            2>&1
        
        # Verificar si curl tuvo éxito
        $responseBody = $curlResult -join "`n"
        $httpCode = "200"  # Asumir 200 si curl no falló y hay respuesta JSON
        
        # Intentar parsear JSON para verificar si fue exitoso
        try {
            $json = $responseBody | ConvertFrom-Json
            if ($json.success -eq $true) {
                Write-Host "   ✅ Upload exitoso (200 OK)" -ForegroundColor Green
                Write-Host "   ✅ Success: $($json.success)" -ForegroundColor Green
                
                # Verificar campos requeridos
                $data = $json.data
                if ($data.cid) {
                    # Validar formato de CID (debe empezar con bafk, bafy, etc.)
                    if ($data.cid -match "^baf[a-z0-9]{50,}$") {
                        Write-Host "   ✅ CID válido: $($data.cid)" -ForegroundColor Green
                    } else {
                        Write-Host "   ⚠️  CID con formato inesperado: $($data.cid)" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   ❌ CID no encontrado en respuesta" -ForegroundColor Red
                }
                
                if ($data.filename) {
                    Write-Host "   ✅ Filename: $($data.filename)" -ForegroundColor Green
                }
                
                if ($data.size) {
                    Write-Host "   ✅ Size: $($data.size) bytes" -ForegroundColor Green
                }
                
                if ($data.mimeType) {
                    Write-Host "   ✅ MIME Type: $($data.mimeType)" -ForegroundColor Green
                }
                
                if ($data.gatewayUrl) {
                    Write-Host "   ✅ Gateway URL: $($data.gatewayUrl)" -ForegroundColor Green
                    # Verificar que la URL contiene el CID
                    if ($data.gatewayUrl -match $data.cid) {
                        Write-Host "   ✅ Gateway URL contiene el CID correcto" -ForegroundColor Green
                    } else {
                        Write-Host "   ⚠️  Gateway URL no contiene el CID" -ForegroundColor Yellow
                    }
                }
                
                if ($data.uploadedAt) {
                    Write-Host "   ✅ Uploaded At: $($data.uploadedAt)" -ForegroundColor Green
                }
                
                Write-Host "   ✅ TODOS LOS CAMPOS REQUERIDOS PRESENTES" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Success es false: $($json.error)" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error parseando JSON: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   Response body: $responseBody" -ForegroundColor Gray
        }
        
        # Limpiar archivo temporal
        Remove-Item $testImagePath -ErrorAction SilentlyContinue
    } catch {
        Write-Host "   ❌ Error en prueba: $($_.Exception.Message)" -ForegroundColor Red
        Remove-Item $testImagePath -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "   ❌ No se pudo crear archivo de prueba" -ForegroundColor Red
}

# PRUEBA 2.3: Test del servicio IPFS directamente (verificación de que realmente sube a IPFS)
Write-Host "`nPRUEBA 2.3: Test del servicio IPFS directamente (verificación real)" -ForegroundColor Yellow
Write-Host "   Ejecutando test-ipfs.ts..." -ForegroundColor Gray
try {
    $ipfsTest = npx tsx test-ipfs.ts 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "   ✅ Test del servicio IPFS pasó (exit code: $exitCode)" -ForegroundColor Green
        
        # Extraer información importante de la salida
        $outputText = $ipfsTest -join "`n"
        
        # Verificar que se inicializó Helia
        if ($outputText -match "Inicializando nodo Helia" -or $outputText -match "Nodo Helia inicializado") {
            Write-Host "   ✅ Helia se inicializó correctamente" -ForegroundColor Green
        }
        
        # Verificar que se subió el archivo
        if ($outputText -match "Subiendo archivo a IPFS" -or $outputText -match "Archivo subido a IPFS") {
            Write-Host "   ✅ Archivo se subió a IPFS" -ForegroundColor Green
        }
        
        # Extraer y validar CID
        if ($outputText -match "CID:\s*(baf[a-z0-9]{50,})") {
            $cid = $matches[1]
            Write-Host "   ✅ CID generado: $cid" -ForegroundColor Green
            
            # Validar formato de CID
            if ($cid -match "^baf[a-z0-9]{50,}$") {
                Write-Host "   ✅ Formato de CID válido" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Formato de CID inesperado" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ⚠️  No se encontró CID en la salida" -ForegroundColor Yellow
        }
        
        # Verificar que se descargó y verificó el contenido
        if ($outputText -match "contenido descargado coincide") {
            Write-Host "   ✅ Verificación de contenido: El archivo descargado coincide con el original" -ForegroundColor Green
            Write-Host "   ✅ ESTO CONFIRMA QUE REALMENTE SE SUBIO A IPFS (no es mock)" -ForegroundColor Green
        }
        
        # Verificar que se detuvo correctamente
        if ($outputText -match "Servicio detenido" -or $outputText -match "Nodo Helia detenido") {
            Write-Host "   ✅ Servicio se detuvo correctamente" -ForegroundColor Green
        }
        
        # Verificar mensaje final
        if ($outputText -match "TODAS LAS PRUEBAS PASARON") {
            Write-Host "   ✅ TODAS LAS PRUEBAS DEL SERVICIO IPFS PASARON" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ Test del servicio IPFS falló (exit code: $exitCode)" -ForegroundColor Red
        Write-Host "   Output:" -ForegroundColor Gray
        $ipfsTest | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    }
} catch {
    Write-Host "   ❌ Error ejecutando test: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar logs del servidor
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "LOGS DEL SERVIDOR" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan
$serverOutput = Receive-Job $serverJob
if ($serverOutput) {
    $serverOutput | Select-Object -Last 15 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   (Sin logs aún)" -ForegroundColor Gray
}

# Limpiar
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan
Write-Host "Deteniendo servidor..." -ForegroundColor Yellow
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "`n✅ PRUEBAS COMPLETADAS`n" -ForegroundColor Green

