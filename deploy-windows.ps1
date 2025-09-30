# PickNTrust Deployment Script for Windows
# This script deploys the PickNTrust application to a remote server

param(
    [string]$ServerIP = "103.127.29.89",
    [string]$ServerUser = "root",
    [string]$AppName = "pickntrust"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment of PickNTrust application..." -ForegroundColor Green

# Configuration
$AppDir = "/var/www/$AppName"
$GitHubRepo = "https://github.com/chanchal-coder/PickNTrust.git"
$NodeVersion = "18"

# Function to test server connectivity
function Test-ServerConnectivity {
    Write-Host "📡 Testing server connectivity..." -ForegroundColor Yellow
    
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 1 -Quiet
    if (-not $pingResult) {
        Write-Host "❌ Server $ServerIP is not reachable. Please check:" -ForegroundColor Red
        Write-Host "   - Server is running" -ForegroundColor Red
        Write-Host "   - IP address is correct" -ForegroundColor Red
        Write-Host "   - Firewall allows connections" -ForegroundColor Red
        return $false
    }
    
    Write-Host "✅ Server is reachable" -ForegroundColor Green
    return $true
}

# Function to test SSH connectivity
function Test-SSHConnectivity {
    Write-Host "🔐 Testing SSH connection..." -ForegroundColor Yellow
    
    try {
        $sshTest = ssh -o ConnectTimeout=10 "$ServerUser@$ServerIP" "echo 'SSH connection successful'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SSH connection successful" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ SSH connection failed. Please check:" -ForegroundColor Red
        Write-Host "   - SSH is enabled on the server" -ForegroundColor Red
        Write-Host "   - SSH keys are properly configured" -ForegroundColor Red
        Write-Host "   - Port 22 is open" -ForegroundColor Red
        return $false
    }
    
    return $false
}

# Function to run commands on remote server
function Invoke-RemoteCommand {
    param([string]$Command)
    
    Write-Host "Executing: $Command" -ForegroundColor Cyan
    ssh "$ServerUser@$ServerIP" $Command
    
    if ($LASTEXITCODE -ne 0) {
        throw "Remote command failed: $Command"
    }
}

# Function to copy files to remote server
function Copy-ToRemote {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    
    Write-Host "Copying $LocalPath to $RemotePath" -ForegroundColor Cyan
    scp -r $LocalPath "$ServerUser@${ServerIP}:$RemotePath"
    
    if ($LASTEXITCODE -ne 0) {
        throw "File copy failed: $LocalPath to $RemotePath"
    }
}

# Main deployment process
try {
    # Test connectivity
    if (-not (Test-ServerConnectivity)) {
        Write-Host "🔧 Server connectivity issues detected. Here are alternative deployment options:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. 🌐 Deploy to Vercel (Recommended for frontend + serverless):" -ForegroundColor Cyan
        Write-Host "   npm install -g vercel"
        Write-Host "   vercel --prod"
        Write-Host ""
        Write-Host "2. 🚀 Deploy to Heroku:" -ForegroundColor Cyan
        Write-Host "   npm install -g heroku"
        Write-Host "   heroku create pickntrust-app"
        Write-Host "   git push heroku main"
        Write-Host ""
        Write-Host "3. ☁️ Deploy to Railway:" -ForegroundColor Cyan
        Write-Host "   npm install -g @railway/cli"
        Write-Host "   railway login"
        Write-Host "   railway deploy"
        Write-Host ""
        Write-Host "4. 🔧 Manual server setup required:" -ForegroundColor Cyan
        Write-Host "   - Check server status and SSH configuration"
        Write-Host "   - Verify firewall settings"
        Write-Host "   - Ensure port 22 is open for SSH"
        Write-Host ""
        
        # Try alternative deployment to Vercel
        Write-Host "🌐 Attempting deployment to Vercel..." -ForegroundColor Green
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (-not $vercelInstalled) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        # Create vercel.json configuration
        $vercelConfig = @{
            version = 2
            builds = @(
                @{
                    src = "server/index.ts"
                    use = "@vercel/node"
                }
            )
            routes = @(
                @{
                    src = "/api/(.*)"
                    dest = "/server/index.ts"
                }
                @{
                    src = "/(.*)"
                    dest = "/dist/public/`$1"
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $vercelConfig | Out-File -FilePath "vercel.json" -Encoding UTF8
        
        Write-Host "✅ Created vercel.json configuration" -ForegroundColor Green
        Write-Host "🚀 Run 'vercel --prod' to deploy to Vercel" -ForegroundColor Cyan
        
        return
    }
    
    if (-not (Test-SSHConnectivity)) {
        throw "SSH connectivity failed"
    }
    
    Write-Host "📦 Installing system dependencies..." -ForegroundColor Yellow
    Invoke-RemoteCommand "apt update && apt upgrade -y"
    Invoke-RemoteCommand "apt install -y curl git nginx"
    
    Write-Host "📥 Installing Node.js $NodeVersion..." -ForegroundColor Yellow
    Invoke-RemoteCommand "curl -fsSL https://deb.nodesource.com/setup_${NodeVersion}.x | bash -"
    Invoke-RemoteCommand "apt install -y nodejs"
    
    Write-Host "📁 Creating application directory..." -ForegroundColor Yellow
    Invoke-RemoteCommand "mkdir -p $AppDir"
    Invoke-RemoteCommand "cd $AppDir && rm -rf * .git"
    
    Write-Host "🔄 Cloning repository..." -ForegroundColor Yellow
    Invoke-RemoteCommand "cd $AppDir && git clone $GitHubRepo ."
    
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Invoke-RemoteCommand "cd $AppDir && npm install"
    
    Write-Host "🏗️ Building application..." -ForegroundColor Yellow
    Invoke-RemoteCommand "cd $AppDir && npm run build"
    
    Write-Host "📄 Creating environment file..." -ForegroundColor Yellow
    Invoke-RemoteCommand "cd $AppDir && echo 'NODE_ENV=production' > .env"
    Invoke-RemoteCommand "cd $AppDir && echo 'PORT=5000' >> .env"
    
    Write-Host "🔧 Installing PM2 for process management..." -ForegroundColor Yellow
    Invoke-RemoteCommand "npm install -g pm2"
    
    Write-Host "🚀 Starting application with PM2..." -ForegroundColor Yellow
    Invoke-RemoteCommand "cd $AppDir && pm2 start dist/server/server/index.js --name $AppName"
    Invoke-RemoteCommand "pm2 save"
    Invoke-RemoteCommand "pm2 startup"
    
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌍 Your application should be accessible at: http://$ServerIP" -ForegroundColor Cyan
    Write-Host "📊 Check application status: ssh $ServerUser@$ServerIP 'pm2 status'" -ForegroundColor Cyan
    Write-Host "📋 View logs: ssh $ServerUser@$ServerIP 'pm2 logs $AppName'" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Please check the server configuration and try again." -ForegroundColor Yellow
}