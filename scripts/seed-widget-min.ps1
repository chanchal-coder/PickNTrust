$ErrorActionPreference = 'Stop'

# Minimal widget payload to avoid quoting/encoding issues
$payload = @{
    name        = 'WidgetTest'
    description = 'Minimal test widget'
    code        = '<div style="background:#222;color:#fff;padding:6px 10px;border-radius:8px;">Hi</div>'
    targetPage  = 'prime-picks'
    position    = 'header-bottom'
    isActive    = $true
    displayOrder = 1
} | ConvertTo-Json -Compress

$tmp = Join-Path $PSScriptRoot 'tmp-widget.json'
Set-Content -Path $tmp -Value $payload -Encoding UTF8

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($null -eq $curl) {
    Write-Error 'curl.exe not found in PATH'
    exit 1
}

$uri = 'http://localhost:5000/api/admin/widgets'
$args = @(
    '-s','-X','POST',
    '-H','Content-Type: application/json',
    '-H','x-admin-password: pickntrust2025',
    '--data-binary',"@$tmp",
    $uri
)

$resp = & $curl.Source @args
$exit = $LASTEXITCODE

if ($exit -ne 0) {
    Write-Error "curl exited with code $exit"
    exit $exit
}

Write-Host $resp