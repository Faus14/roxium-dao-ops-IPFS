# Script de prueba del servidor
Write-Host "🧪 Probando servidor..." -ForegroundColor Cyan

# Esperar a que el servidor inicie
Start-Sleep -Seconds 3

# Probar health check
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
    Write-Host "✅ Health check OK" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error conectando al servidor: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Asegúrate de que el servidor esté corriendo con: npm run dev" -ForegroundColor Yellow
}

