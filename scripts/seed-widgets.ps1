param(
  [string]$ApiBase = 'http://localhost:5000',
  [string]$AdminPassword = 'pickntrust2025'
)

$ErrorActionPreference = 'Stop'

Write-Host "Seeding widgets to" $ApiBase

$headers = @{ 'x-admin-password' = $AdminPassword }

$code1 = @'
<div id="pnt-story-badge" style="position:fixed;top:14px;right:14px;z-index:9999;background:#111;color:#fff;border-radius:20px;padding:8px 12px;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer">Stories</div>
<script>
try {
  var b = document.getElementById("pnt-story-badge");
  if (b && !window.__pntStories) {
    window.__pntStories = true;
    b.addEventListener("click", function () {
      alert("Stories overlay demo — no layout changes");
    });
  }
} catch (e) {
  console.warn("Widget init error", e);
}
</script>
'@

$code2 = @'
<div style="position:fixed;bottom:16px;right:16px;z-index:9999;background:#0ea5e9;color:#fff;border-radius:12px;padding:8px 10px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.2)">Cue Picks</div>
'@

$code3 = @'
<div style="position:fixed;top:14px;left:14px;z-index:9999;background:#22c55e;color:#fff;border-radius:12px;padding:8px 10px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.2)">Value Tips</div>
'@

$widgets = @(
  @{ 
    name = 'Stories Demo'; description = 'Non-intrusive floating badge'; body = $null; code = $code1; targetPage = 'prime-picks'; position = 'floating-top-right'; isActive = $true; displayOrder = 1; maxWidth = '240px'; customCss = $null; showOnMobile = $true; showOnDesktop = $true; externalLink = $null 
  },
  @{ 
    name = 'Cue Picks Floating'; description = 'Small promo badge'; body = $null; code = $code2; targetPage = 'cue-picks'; position = 'floating-bottom-right'; isActive = $true; displayOrder = 1; maxWidth = $null; customCss = $null; showOnMobile = $true; showOnDesktop = $true; externalLink = $null 
  },
  @{ 
    name = 'Value Picks Helper'; description = 'Top-left floating badge'; body = $null; code = $code3; targetPage = 'value-picks'; position = 'floating-top-left'; isActive = $true; displayOrder = 1; maxWidth = $null; customCss = $null; showOnMobile = $true; showOnDesktop = $true; externalLink = $null 
  }
)

foreach ($w in $widgets) {
  $json = $w | ConvertTo-Json -Compress -Depth 5
  Write-Host "POST" "$ApiBase/api/admin/widgets" "=>" $w.targetPage "@" $w.position
  $resp = Invoke-RestMethod -Uri "$ApiBase/api/admin/widgets" -Method Post -ContentType 'application/json' -Headers $headers -Body $json
  Write-Host "Created widget id:" $resp.id
}

Write-Host '✅ Widget seeding done.'