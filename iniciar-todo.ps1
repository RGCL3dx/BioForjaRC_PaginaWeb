# =====================================================================
#  Inicia TODO BioForjaRC: backend (7 servicios) + frontend React.
#  Uso:  .\iniciar-todo.ps1
#  Requisito: MySQL de XAMPP encendido (Apache solo para phpMyAdmin).
# =====================================================================
param(
    [string]$DbPassword = "",
    [switch]$SinNavegador
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== 1. Comprobando MySQL de XAMPP ===" -ForegroundColor Cyan
if (-not (Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
    Write-Host "MySQL no responde en el puerto 3306." -ForegroundColor Red
    Write-Host "Abre XAMPP Control Panel y pulsa Start en MySQL (y en Apache para phpMyAdmin)."
    exit 1
}
Write-Host "MySQL OK (puerto 3306)" -ForegroundColor Green

Write-Host ""
Write-Host "=== 2. Iniciando backend ===" -ForegroundColor Cyan
& (Join-Path $raiz "iniciar-backend.ps1") -DbPassword $DbPassword

Write-Host ""
Write-Host "=== 3. Iniciando frontend ===" -ForegroundColor Cyan
$frontend = Join-Path $raiz "frontend"
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Instalando dependencias (solo la primera vez)..."
    Push-Location $frontend
    npm install --no-audit --no-fund
    Pop-Location
}

if (Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue) {
    Write-Host "El frontend ya esta corriendo en el puerto 5173." -ForegroundColor Yellow
} else {
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "`$host.UI.RawUI.WindowTitle='BioForjaRC Frontend'; Set-Location '$frontend'; npm run dev"
    ) -WindowStyle Normal
    for ($i = 0; $i -lt 60; $i++) {
        if (Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue) { break }
        Start-Sleep -Milliseconds 500
    }
}

if (Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue) {
    Write-Host "Frontend OK (puerto 5173)" -ForegroundColor Green
} else {
    Write-Host "El frontend aun no responde; revisa la ventana que se abrio." -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " PAGINA WEB      http://localhost:5173"
Write-Host " API GATEWAY     http://localhost:8090"
Write-Host " PHPMYADMIN      http://localhost/phpmyadmin  (root, sin clave)"
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Admin:   admin@bioforjarc.cl / ClaveAdmin123!"
Write-Host " Cliente: hermenegildo.gonzalez@correo.cl / ClaveCliente123!"
Write-Host ""

if (-not $SinNavegador) {
    Start-Process "http://localhost:5173"
}
