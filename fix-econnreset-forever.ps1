# ECONNRESET Network Connectivity Fix - Simple and Effective
# This script fixes network connectivity issues for Telegram API

Write-Host "ECONNRESET Network Fix - Starting..." -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges" -ForegroundColor Yellow
    Write-Host "Restarting as Administrator..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Function to test connectivity
function Test-Connection {
    Write-Host "Testing Telegram API connectivity..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "https://api.telegram.org" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "SUCCESS: Telegram API is reachable" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    return $false
}

# Step 1: Initial test
Write-Host "Step 1: Initial connectivity test" -ForegroundColor Yellow
$initialTest = Test-Connection
Write-Host ""

# Step 2: Flush DNS
Write-Host "Step 2: Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "DNS cache flushed successfully" -ForegroundColor Green
} catch {
    Write-Host "DNS flush failed" -ForegroundColor Red
}
Write-Host ""

# Step 3: Reset Winsock
Write-Host "Step 3: Resetting Winsock..." -ForegroundColor Yellow
try {
    netsh winsock reset | Out-Null
    Write-Host "Winsock reset successfully" -ForegroundColor Green
} catch {
    Write-Host "Winsock reset failed" -ForegroundColor Red
}
Write-Host ""

# Step 4: Reset TCP/IP
Write-Host "Step 4: Resetting TCP/IP stack..." -ForegroundColor Yellow
try {
    netsh int ip reset | Out-Null
    Write-Host "TCP/IP stack reset successfully" -ForegroundColor Green
} catch {
    Write-Host "TCP/IP reset failed" -ForegroundColor Red
}
Write-Host ""

# Step 5: Set DNS servers
Write-Host "Step 5: Setting optimal DNS servers..." -ForegroundColor Yellow
try {
    $adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
    foreach ($adapter in $adapters) {
        Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses @("8.8.8.8", "1.1.1.1") -ErrorAction SilentlyContinue
    }
    Write-Host "DNS servers configured successfully" -ForegroundColor Green
} catch {
    Write-Host "DNS configuration failed" -ForegroundColor Red
}
Write-Host ""

# Step 6: Disable Windows Firewall temporarily
Write-Host "Step 6: Managing Windows Firewall..." -ForegroundColor Yellow
$disableFirewall = Read-Host "Disable Windows Firewall temporarily? (y/N)"
if ($disableFirewall -eq "y" -or $disableFirewall -eq "Y") {
    try {
        Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
        Write-Host "Windows Firewall disabled temporarily" -ForegroundColor Green
        Write-Host "WARNING: Remember to re-enable it later" -ForegroundColor Yellow
    } catch {
        Write-Host "Failed to disable firewall" -ForegroundColor Red
    }
} else {
    Write-Host "Firewall left enabled" -ForegroundColor Green
}
Write-Host ""

# Step 7: Release and renew IP
Write-Host "Step 7: Renewing IP address..." -ForegroundColor Yellow
try {
    ipconfig /release | Out-Null
    Start-Sleep -Seconds 2
    ipconfig /renew | Out-Null
    Write-Host "IP address renewed successfully" -ForegroundColor Green
} catch {
    Write-Host "IP renewal failed" -ForegroundColor Red
}
Write-Host ""

# Step 8: Restart network services
Write-Host "Step 8: Restarting network services..." -ForegroundColor Yellow
$services = @("Dnscache", "Dhcp")
foreach ($service in $services) {
    try {
        Restart-Service -Name $service -Force -ErrorAction SilentlyContinue
        Write-Host "Restarted: $service" -ForegroundColor Green
    } catch {
        Write-Host "Failed to restart: $service" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 9: Final test
Write-Host "Step 9: Final connectivity test" -ForegroundColor Yellow
Start-Sleep -Seconds 5
$finalTest = Test-Connection
Write-Host ""

# Results
Write-Host "RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
if ($initialTest) {
    Write-Host "Initial Test: PASS" -ForegroundColor Green
} else {
    Write-Host "Initial Test: FAIL" -ForegroundColor Red
}

if ($finalTest) {
    Write-Host "Final Test: PASS" -ForegroundColor Green
} else {
    Write-Host "Final Test: FAIL" -ForegroundColor Red
}

Write-Host ""
if ($finalTest) {
    Write-Host "SUCCESS! ECONNRESET issue resolved!" -ForegroundColor Green
    Write-Host "Telegram API connectivity is working" -ForegroundColor Green
    Write-Host "You can now run your bot successfully" -ForegroundColor Green
} else {
    Write-Host "ECONNRESET issue persists. Try these additional steps:" -ForegroundColor Yellow
    Write-Host "1. Use mobile hotspot connection" -ForegroundColor White
    Write-Host "2. Use VPN service" -ForegroundColor White
    Write-Host "3. Contact ISP about Telegram access" -ForegroundColor White
    Write-Host "4. Check antivirus software" -ForegroundColor White
}

Write-Host ""
Write-Host "A system restart is recommended" -ForegroundColor Yellow
$restart = Read-Host "Restart now? (y/N)"
if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host "Restarting in 10 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Restart-Computer -Force
} else {
    Write-Host "Please restart manually to complete the fix" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "ECONNRESET fix completed!" -ForegroundColor Green
Pause