$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $Root ".server.pid"
$LogDir = Join-Path $Root "logs"
$OutLog = Join-Path $LogDir "server.out.log"
$ErrLog = Join-Path $LogDir "server.err.log"

Set-Location $Root
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (Test-Path $PidFile) {
    $ExistingPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($ExistingPid) {
        $Existing = Get-Process -Id $ExistingPid -ErrorAction SilentlyContinue
        if ($Existing) {
            Write-Host "Server is already running: http://localhost:3040"
            exit 0
        }
    }
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env. Add Discord settings there when you are ready."
}

if (-not (Select-String -Path ".env" -Pattern "^ADMIN_PASSWORD=" -Quiet)) {
    Add-Content ".env" "ADMIN_PASSWORD=admin"
}

$Process = Start-Process -FilePath "node" `
    -ArgumentList "server/server.mjs" `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -WindowStyle Hidden `
    -PassThru

$Process.Id | Set-Content $PidFile
Write-Host "Server started: http://localhost:3040"
Write-Host "Logs: $OutLog"
