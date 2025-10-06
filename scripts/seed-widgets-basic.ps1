$ErrorActionPreference = 'Stop'

$pages = @(
  'home','prime-picks','cue-picks','value-picks','click-picks','global-picks','travel-picks'
)

$positions = @(
  'content-top','content-bottom','footer-bottom'
)

$makePayload = {
  param($page,$position,$index)
  $code = @'
<div style="background:#111;color:#fff;padding:8px 12px;border-radius:10px;display:inline-block;">
  Widget OK
</div>
'@
  @{ name = "Test $page $position $index"; description = "Auto-seeded test"; code = $code; targetPage = $page; position = $position; isActive = $true; displayOrder = $index; showOnMobile = $true; showOnDesktop = $true }
}

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($null -eq $curl) { Write-Error 'curl.exe not found in PATH'; exit 1 }

$uri = 'http://localhost:5000/api/admin/widgets'
$headers = @(
  '-H','Content-Type: application/json',
  '-H','x-admin-password: pickntrust2025'
)

Write-Host "Seeding widgets for pages and positions..."
$tmpDir = Join-Path $PSScriptRoot 'tmp'
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$count = 0
foreach ($p in $pages) {
  $i = 1
  foreach ($pos in $positions) {
    $payloadObj = & $makePayload $p $pos $i
    $json = $payloadObj | ConvertTo-Json -Compress
    $file = Join-Path $tmpDir "widget-$p-$pos-$i.json"
    Set-Content -Path $file -Value $json -Encoding UTF8
    $args = @('-s','-X','POST') + $headers + @('--data-binary',"@$file",$uri)
    $resp = & $curl.Source @args
    $exit = $LASTEXITCODE
    if ($exit -ne 0) { Write-Error "curl exited with code $exit for $p/$pos"; exit $exit }
    Write-Host "OK $p / $pos =>" $resp
    $i++
    $count++
  }
}

Write-Host "Seeded $count widgets."