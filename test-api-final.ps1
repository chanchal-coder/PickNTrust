# Final API test for EC2
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Final API test on EC2..." -ForegroundColor Green

# Wait for server to fully start
Write-Host "Waiting for server to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test products endpoint
Write-Host "Testing /api/products endpoint..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000/api/products | jq .'

Write-Host "`nTesting /api/featured endpoint..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000/api/featured | jq .'

Write-Host "`nTesting external access..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://$EC2_IP:3000/api/products" -TimeoutSec 10
    Write-Host "External API test successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "External API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI testing completed!" -ForegroundColor Green