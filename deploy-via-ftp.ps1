# Alternative deployment using curl for file transfer
$serverIP = "51.21.112.211"
$username = "ubuntu"

Write-Host "Attempting alternative deployment method..."

# Try using curl to upload files
Write-Host "Uploading server files..."
curl -T "server-files.tar.gz" "sftp://$username@$serverIP/home/ubuntu/PickNTrust/" --key "C:\AWSKeys\picktrust-key.pem" --insecure

# If curl fails, try using PowerShell's built-in methods
if ($LASTEXITCODE -ne 0) {
    Write-Host "Curl failed, trying alternative method..."
    
    # Create a simple HTTP server to transfer files
    Write-Host "Starting local HTTP server for file transfer..."
    Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; python -m http.server 8080" -WindowStyle Hidden
    
    # Give the server time to start
    Start-Sleep -Seconds 3
    
    # Get local IP
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress[0]
    
    Write-Host "Local server running at http://$localIP:8080"
    Write-Host "You can manually download files from the server using:"
    Write-Host "wget http://$localIP:8080/server-files.tar.gz"
    Write-Host "wget http://$localIP:8080/production-server.cjs"
    
    # Keep server running for 60 seconds
    Start-Sleep -Seconds 60
    
    # Stop the HTTP server
    Get-Process | Where-Object {$_.ProcessName -eq "python" -and $_.CommandLine -like "*http.server*"} | Stop-Process -Force
}

Write-Host "Deployment attempt complete!"