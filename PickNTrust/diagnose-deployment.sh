#!/bin/bash
echo "=== PickNTrust Deployment Diagnostics ==="

# Test SSH connection first
echo "1. Testing SSH connection..."
ssh -i "./picktrust-key.pem" -o ConnectTimeout=10 ubuntu@51.20.43.157 << 'EOF'
echo "✅ SSH connection successful"

echo "2. Checking system status..."
whoami
pwd
uptime

echo "3. Checking if Node.js is installed..."
node --version || echo "❌ Node.js not installed"
npm --version || echo "❌ npm not installed"

echo "4. Checking PM2 status..."
pm2 --version || echo "❌ PM2 not installed"
pm2 status || echo "❌ No PM2 processes"

echo "5. Checking if project exists..."
ls -la /home/ubuntu/PickNTrust/ || echo "❌ Project directory not found"

echo "6. Checking if application is running..."
curl -s http://localhost:3000 | head -5 || echo "❌ App not responding on port 3000"

echo "7. Checking Nginx status..."
sudo systemctl status nginx --no-pager || echo "❌ Nginx not running"

echo "8. Checking port 80..."
sudo netstat -tlnp | grep :80 || echo "❌ Nothing listening on port 80"

echo "9. Checking firewall..."
sudo ufw status || echo "❌ UFW not available"

echo "10. Checking AWS Security Group (if possible)..."
curl -s http://169.254.169.254/latest/meta-data/instance-id || echo "❌ Cannot get instance metadata"

EOF

echo "=== Diagnostics Complete ==="
