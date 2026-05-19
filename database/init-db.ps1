<# GoalTrack — Database Init (PowerShell)
   Usage: .\init-db.ps1 [-Seed]
#>
param([switch]$Seed)

$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DB_PASS = $env:DB_PASS
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=== GoalTrack Database Initialization ===" -ForegroundColor Cyan
Write-Host "Host: ${DB_HOST}:${DB_PORT}  User: $DB_USER`n"

$mysqlArgs = @("-h", $DB_HOST, "-P", $DB_PORT, "-u", $DB_USER)
if ($DB_PASS) { $mysqlArgs += "-p$DB_PASS" }

Write-Host "[1/3] Creating schema..." -ForegroundColor Yellow
Get-Content "$ScriptDir\schema.sql" | mysql @mysqlArgs
Write-Host "  ✓ Schema created" -ForegroundColor Green

if ($Seed) {
    Write-Host "[2/3] Inserting seed data..." -ForegroundColor Yellow
    Get-Content "$ScriptDir\seed.sql" | mysql @mysqlArgs
    Write-Host "  ✓ Seed data inserted" -ForegroundColor Green
} else {
    Write-Host "[2/3] Skipping seed (use -Seed flag)" -ForegroundColor DarkGray
}

Write-Host "[3/3] Verifying..." -ForegroundColor Yellow
$count = mysql @mysqlArgs -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='goaltrack_db';"
Write-Host "  ✓ $count tables created`n" -ForegroundColor Green
Write-Host "=== Database ready! 🚀 ===" -ForegroundColor Cyan
