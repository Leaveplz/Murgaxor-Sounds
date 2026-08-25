$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $Root ".server.pid"

if (-not (Test-Path $PidFile)) {
    Write-Host "No saved server process was found."
    exit 0
}

$ServerPid = Get-Content $PidFile -ErrorAction SilentlyContinue
if (-not $ServerPid) {
    Remove-Item $PidFile -Force
    Write-Host "Server pid file was empty and has been removed."
    exit 0
}

$Process = Get-Process -Id $ServerPid -ErrorAction SilentlyContinue
if ($Process) {
    Stop-Process -Id $ServerPid -Force
    Write-Host "Server stopped."
} else {
    Write-Host "Server process was not running."
}

Remove-Item $PidFile -Force
