# =====================================================================
#  Inicia los 7 servicios de BioForjaRC contra MySQL/MariaDB de XAMPP.
#  Uso:  .\iniciar-backend.ps1
#  Requisitos:
#    - MySQL de XAMPP encendido (puerto 3306)
#    - Bases bioforja_* creadas (ver README)
#    - Servicios compilados: .\mvnw.cmd -DskipTests package en cada uno
# =====================================================================
param(
    [string]$JavaHome = "C:\Program Files\Java\jdk-25.0.2",
    [string]$DbUser = "root",
    [string]$DbPassword = "",
    [string]$JwtSecret = "bioforjarc-secreto-local-de-32-o-mas-caracteres-2026"
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$logs = Join-Path $raiz "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$java = Join-Path $JavaHome "bin\java.exe"
if (-not (Test-Path $java)) { throw "No se encontro java en $java" }

# Variables de entorno comunes a todos los servicios.
$env:BIOFORJA_DB_HOST = "localhost"
$env:BIOFORJA_DB_PORT = "3306"
$env:BIOFORJA_DB_USERNAME = $DbUser
$env:BIOFORJA_DB_PASSWORD = $DbPassword
$env:BIOFORJA_JWT_SECRET = $JwtSecret
$env:BIOFORJA_SEMILLA_HABILITADA = "true"
$env:BIOFORJA_SEMILLA_ADMIN_CLAVE = "ClaveAdmin123!"
$env:BIOFORJA_SEMILLA_CLIENTE_CLAVE = "ClaveCliente123!"

$servicios = @(
    @{ Nombre = "ms-usuarios";     Puerto = 8091 },
    @{ Nombre = "ms-catalogo";     Puerto = 8092 },
    @{ Nombre = "ms-envios";       Puerto = 8093 },
    @{ Nombre = "ms-pedidos";      Puerto = 8094 },
    @{ Nombre = "ms-cotizaciones"; Puerto = 8095 },
    @{ Nombre = "ms-consultas";    Puerto = 8096 }
)

foreach ($s in $servicios) {
    $dir = Join-Path $raiz "backend\$($s.Nombre)"
    $jar = Get-ChildItem (Join-Path $dir "target\*.jar") -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike "*.original" } |
        Select-Object -First 1
    if (-not $jar) {
        Write-Warning "$($s.Nombre): falta compilar. Ejecuta .\mvnw.cmd -DskipTests package en $dir"
        continue
    }
    $puertoAbierto = Test-NetConnection -ComputerName localhost -Port $s.Puerto -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($puertoAbierto) {
        Write-Host "$($s.Nombre): el puerto $($s.Puerto) ya esta en uso, se omite." -ForegroundColor Yellow
        continue
    }
    Write-Host "Iniciando $($s.Nombre) en el puerto $($s.Puerto)..."
    Start-Process -FilePath $java `
        -ArgumentList @("-jar", "`"$($jar.FullName)`"") `
        -WorkingDirectory $dir `
        -RedirectStandardOutput (Join-Path $logs "$($s.Nombre).log") `
        -RedirectStandardError  (Join-Path $logs "$($s.Nombre)-error.log") `
        -WindowStyle Hidden | Out-Null
}

# El gateway se inicia al final, cuando los servicios ya estan arriba.
$gwDir = Join-Path $raiz "backend\api-gateway"
$gwJar = Get-ChildItem (Join-Path $gwDir "target\*.jar") | Where-Object { $_.Name -notlike "*.original" } | Select-Object -First 1
if ($gwJar -and -not (Test-NetConnection -ComputerName localhost -Port 8090 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
    Write-Host "Iniciando api-gateway en el puerto 8090..."
    Start-Process -FilePath $java `
        -ArgumentList @("-jar", "`"$($gwJar.FullName)`"") `
        -WorkingDirectory $gwDir `
        -RedirectStandardOutput (Join-Path $logs "api-gateway.log") `
        -RedirectStandardError  (Join-Path $logs "api-gateway-error.log") `
        -WindowStyle Hidden | Out-Null
}

Write-Host ""
Write-Host "Esperando a que los servicios respondan..."
$puertos = @(8090, 8091, 8092, 8093, 8094, 8095, 8096)
foreach ($p in $puertos) {
    $ok = $false
    for ($i = 0; $i -lt 40; $i++) {
        if (Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue) { $ok = $true; break }
        Start-Sleep -Milliseconds 500
    }
    if ($ok) { Write-Host "  Puerto $p OK" -ForegroundColor Green } else { Write-Host "  Puerto $p NO responde (revisa logs)" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Gateway:   http://localhost:8090"
Write-Host "Frontend:  http://localhost:5173  (npm run dev en frontend)"
Write-Host "phpMyAdmin: http://localhost/phpmyadmin"
Write-Host "Logs:      $logs"
