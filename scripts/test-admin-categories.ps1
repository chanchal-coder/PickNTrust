param()

Write-Host "Testing admin category add/delete..."

$BaseUrl = 'http://localhost:5000'
$Password = 'pickntrust2025'

function New-Category($name) {
  $body = @{ password = $Password; name = $name; description = 'Admin test category'; displayOrder = 999; isActive = $true } | ConvertTo-Json
  try {
    return Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/admin/categories" -ContentType 'application/json' -Body $body
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and $resp.StatusCode.value__ -eq 409) {
      Write-Host "409 duplicate for '$name'"
      return $null
    }
    throw $_
  }
}

function Find-Category($name) {
  $list = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/categories" -TimeoutSec 15
  return ($list | Where-Object { $_.name -eq $name })
}

function Delete-Category($id) {
  $body = @{ password = $Password } | ConvertTo-Json
  return Invoke-RestMethod -Method Delete -Uri "$BaseUrl/api/admin/categories/$id" -ContentType 'application/json' -Body $body
}

# 1) Create a unique category
$suffix = Get-Random -Minimum 1000 -Maximum 9999
$name = "RobustCategory-$suffix"
Write-Host "Creating category: $name"
$create = New-Category -name $name
if (-not $create) {
  $suffix = Get-Random -Minimum 1000 -Maximum 9999
  $name = "RobustCategory-$suffix"
  Write-Host "Retry creating category: $name"
  $create = New-Category -name $name
}

if (-not $create) { throw "Failed to create a new category after retry." }

$id = $create.id
Write-Host "Created category id: $id"

# 2) Verify presence
$found = Find-Category -name $name
Write-Host ("Found after create -> " + ([bool]$found))

# 3) Delete
$del = Delete-Category -id $id
Write-Host "Delete response: $($del.message)"

# 4) Verify absence
$after = Find-Category -name $name
Write-Host ("Found after delete -> " + ([bool]$after))

Write-Host "Admin category add/delete test completed."