# Fix SSH Key Permissions for Windows
Write-Host "Fixing SSH key permissions..." -ForegroundColor Yellow

$keyPath = "C:\Users\sharm\.ssh\picktrust-key.pem"

# Remove inheritance and all existing permissions
Write-Host "Removing inheritance and existing permissions..." -ForegroundColor Cyan
icacls $keyPath /inheritance:r

# Grant only the current user read access
Write-Host "Granting read access to current user only..." -ForegroundColor Cyan
icacls $keyPath /grant:r "$env:USERNAME:(R)"

# Remove all other users/groups
Write-Host "Removing access for other users..." -ForegroundColor Cyan
icacls $keyPath /remove "Everyone"
icacls $keyPath /remove "Users"
icacls $keyPath /remove "Authenticated Users"

# Display final permissions
Write-Host "Final permissions:" -ForegroundColor Green
icacls $keyPath

Write-Host "SSH key permissions fixed!" -ForegroundColor Green