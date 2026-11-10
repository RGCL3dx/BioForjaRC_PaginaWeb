# Detiene los servicios Java de BioForjaRC que estan escuchando en los puertos 8090-8096.
$puertos = @(8090, 8091, 8092, 8093, 8094, 8095, 8096)
foreach ($p in $puertos) {
    $conexiones = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conexiones) {
        $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Deteniendo $($proc.ProcessName) (PID $($proc.Id)) en el puerto $p"
            Stop-Process -Id $proc.Id -Force
        }
    }
}
Write-Host "Listo."
