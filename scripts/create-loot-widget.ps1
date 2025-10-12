param(
  [string]$ApiBase = 'http://localhost:5000',
  [string]$AdminPassword = 'pickntrust2025'
)

$ErrorActionPreference = 'Stop'

$headers = @{ 'x-admin-password' = $AdminPassword }

$code = @'
<div style="padding:10px;border:2px solid #22c55e;border-radius:8px;background:#dcfce7">Loot Box Widget – content-top</div>
<script>
  setTimeout(function(){
    var d = document.createElement('div');
    d.textContent = 'JS running inside iframe';
    d.style.marginTop = '6px';
    d.style.fontSize = '12px';
    document.body.appendChild(d);
  }, 200);
</script>
'@

$widget = @{
  name = 'Loot Box Header Widget'
  description = 'Test widget for loot-box header-top'
  body = $null
  code = $code
  targetPage = 'loot-box'
  position = 'header-top'
  isActive = $true
  displayOrder = 1
  maxWidth = $null
  customCss = $null
  showOnMobile = $true
  showOnDesktop = $true
  externalLink = $null
}

$json = $widget | ConvertTo-Json -Compress -Depth 5
Write-Host "POST $ApiBase/api/admin/widgets => loot-box @ header-top"
$resp = Invoke-RestMethod -Uri "$ApiBase/api/admin/widgets" -Method Post -ContentType 'application/json' -Headers $headers -Body $json
Write-Host ("Created widget id: " + $resp.id)
Write-Host '✅ Loot Box test widget created.'