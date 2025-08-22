#!/bin/bash
# Manual deployment steps - run each section individually

echo "=== STEP 1: Test SSH Connection ==="
echo "Run this command to test SSH:"
echo "ssh -i './picktrust-key.pem' ubuntu@51.20.43.157"
echo ""

echo "=== STEP 2: If SSH works, run this on EC2 ==="
cat << 'EOF'
# Update system
sudo apt update -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other tools
sudo apt-get install -y git nginx
sudo npm install -g pm2

# Check versions
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"
EOF

echo ""
echo "=== STEP 3: Upload and extract project ==="
echo "From your local machine, run:"
echo "scp -i './picktrust-key.pem' pickntrust-app.tar.gz ubuntu@51.20.43.157:/home/ubuntu/"
echo ""
echo "Then on EC2:"
cat << 'EOF'
cd /home/ubuntu
tar -xzf pickntrust-app.tar.gz -C PickNTrust || mkdir PickNTrust && tar -xzf pickntrust-app.tar.gz -C PickNTrust
cd PickNTrust
ls -la
EOF

echo ""
echo "=== STEP 4: Install dependencies and build ==="
cat << 'EOF'
cd /home/ubuntu/PickNTrust
npm install
npm run build
EOF

echo ""
echo "=== STEP 5: Create environment file ==="
cat << 'EOF'
cd /home/ubuntu/PickNTrust
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
ENVEOF
EOF

echo ""
echo "=== STEP 6: Start application ==="
cat << 'EOF'
cd /home/ubuntu/PickNTrust
pm2 delete pickntrust 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save
pm2 status
EOF

echo ""
echo "=== STEP 7: Configure Nginx ==="
cat << 'EOF'
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name 51.20.43.157;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
EOF

echo ""
echo "=== STEP 8: Test deployment ==="
cat << 'EOF'
# Test locally on EC2
curl http://localhost:3000
curl http://localhost:80

# Check what's listening on ports
sudo netstat -tlnp | grep -E ':(80|3000)'
EOF

echo ""
echo "=== AWS Security Group Fix ==="
echo "If the above works but you still can't access from outside:"
echo "1. Go to AWS Console > EC2 > Security Groups"
echo "2. Find your instance's security group"
echo "3. Add inbound rule: HTTP (port 80) from 0.0.0.0/0"
echo "4. Add inbound rule: Custom TCP (port 3000) from 0.0.0.0/0"
