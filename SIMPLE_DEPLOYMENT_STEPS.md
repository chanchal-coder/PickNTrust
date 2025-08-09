# 🚀 Simple PickNTrust Deployment - Step by Step

Since automated SSH scripts are failing, here's the **simplest way** to deploy your application:

## 🔧 Method 1: Manual SSH Connection (RECOMMENDED)

### Step 1: Connect to EC2 Manually
```bash
ssh -i "C:/AWSKeys/picktrust-key.pem" ec2-user@51.20.43.157
```

### Step 2: Copy the Deployment Script to EC2
Once connected to EC2, create the deployment script:

```bash
cat > deploy.sh << 'SCRIPT_END'
#!/bin/bash
set -e

echo "🚀 Starting PickNTrust deployment..."

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git nginx
sudo npm install -g pm2

# Clone repository
cd /home/ec2-user
rm -rf PickNTrust
git clone https://github.com/chanchal-coder/PickNTrust.git PickNTrust
cd PickNTrust

# Install and build
npm install
npm run build

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
EOF

# Start with PM2
pm2 delete pickntrust 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save

# Configure Nginx
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name 51.20.43.157;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Deployment completed! Visit http://51.20.43.157"
SCRIPT_END
```

### Step 3: Run the Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Method 2: AWS Console (No SSH needed)

### Step 1: Use EC2 Instance Connect
1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Click "Connect" → "EC2 Instance Connect"
4. Click "Connect" to open browser terminal

### Step 2: Run Commands in Browser Terminal
Copy and paste the deployment script from Method 1, Step 2.

## 🔧 Method 3: Systems Manager Session Manager

### Step 1: Use Session Manager
1. Go to AWS Console → Systems Manager → Session Manager
2. Click "Start session"
3. Select your EC2 instance
4. Click "Start session"

### Step 2: Run Deployment Commands
Use the same script from Method 1, Step 2.

## 🔧 Method 4: Upload Script via SCP (if SSH works for file transfer)

### Step 1: Upload the Script
```bash
scp -i "C:/AWSKeys/picktrust-key.pem" ec2-copy-paste-deploy.sh ec2-user@51.20.43.157:~/
```

### Step 2: SSH and Run
```bash
ssh -i "C:/AWSKeys/picktrust-key.pem" ec2-user@51.20.43.157
chmod +x ec2-copy-paste-deploy.sh
./ec2-copy-paste-deploy.sh
```

## 🎯 What to Expect After Deployment:

- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔑 Admin Login**: admin / pickntrust2025
- **📊 API Health**: http://51.20.43.157/api/health

## 🔍 Troubleshooting:

### If SSH Still Fails:
1. **Check SSH key permissions**: `chmod 400 "C:/AWSKeys/picktrust-key.pem"`
2. **Verify EC2 security group**: Port 22 should be open to your IP
3. **Check EC2 instance status**: Should be running and accessible
4. **Try EC2 Instance Connect**: Browser-based alternative
5. **Use Systems Manager**: No SSH required

### If Deployment Fails:
1. **Check Node.js version**: `node --version` (should be 18.x)
2. **Check PM2 status**: `pm2 status`
3. **Check Nginx status**: `sudo systemctl status nginx`
4. **View application logs**: `pm2 logs pickntrust`

## 📋 Quick Commands for Troubleshooting:

```bash
# Check if app is running
pm2 status

# View app logs
pm2 logs pickntrust

# Restart app
pm2 restart pickntrust

# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Check if port 3000 is listening
netstat -tlnp | grep 3000
```

## 🎊 Success Indicators:

✅ PM2 shows "pickntrust" as "online"
✅ Nginx is "active (running)"
✅ Port 3000 is listening
✅ Website loads at http://51.20.43.157
✅ Admin panel accessible at http://51.20.43.157/admin

Choose the method that works best for your setup!
