# 🚀 Complete PickNTrust Deployment Solution

## 🎯 Goal: Get www.pickntrust.com Working

Your website is currently showing ERR_CONNECTION_TIMED_OUT. Here's the complete solution to get it working.

## 📋 Step-by-Step Deployment Guide

### Step 1: Access Your AWS Console
1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Check if you have a running instance for PickNTrust
3. If no instance exists, create one following Step 2

### Step 2: Create/Check EC2 Instance

**If you need to create a new instance:**
1. Click "Launch Instance"
2. **Name**: PickNTrust-App
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance Type**: t3.small
5. **Key Pair**: Create new "pickntrust-key" (download .pem file)
6. **Security Group**: Create new with these rules:
   ```
   SSH (22) - Source: 0.0.0.0/0
   HTTP (80) - Source: 0.0.0.0/0
   HTTPS (443) - Source: 0.0.0.0/0
   Custom TCP (5000) - Source: 0.0.0.0/0
   ```
7. Click "Launch Instance"

### Step 3: Get Your EC2 Public IP
1. In EC2 console, find your instance
2. Copy the **Public IPv4 address** (e.g., 3.15.123.456)
3. **IMPORTANT**: Save this IP - you'll need it for DNS

### Step 4: Update DNS Records
**This is CRITICAL - your domain must point to your EC2 IP**

Go to your domain registrar (GoDaddy, Namecheap, etc.) and update:
```
Type: A Record
Name: www.pickntrust.com
Value: [YOUR_EC2_PUBLIC_IP]
TTL: 300

Type: A Record
Name: pickntrust.com
Value: [YOUR_EC2_PUBLIC_IP]
TTL: 300
```

### Step 5: SSH into Your EC2 Instance
```bash
# Make key file secure
chmod 400 pickntrust-key.pem

# SSH into instance
ssh -i pickntrust-key.pem ubuntu@[YOUR_EC2_PUBLIC_IP]
```

### Step 6: Complete Server Setup Script

**Copy and paste this entire script into your EC2 terminal:**

```bash
#!/bin/bash
set -e

echo "🚀 Setting up PickNTrust on EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2, Git, Nginx, Certbot
sudo npm install -g pm2
sudo apt-get install -y git nginx certbot python3-certbot-nginx unzip

# Stop any existing services
sudo systemctl stop nginx || true
pm2 stop all || true
pm2 delete all || true
pm2 kill || true

# Clean up previous installations
sudo rm -rf /opt/pickntrust
sudo mkdir -p /opt/pickntrust
sudo chown -R ubuntu:ubuntu /opt/pickntrust

# Remove old nginx configs
sudo rm -f /etc/nginx/sites-enabled/pickntrust
sudo rm -f /etc/nginx/sites-available/pickntrust
sudo rm -f /etc/nginx/sites-enabled/default

cd /opt/pickntrust

echo "✅ Server setup complete!"
```

### Step 7: Upload and Deploy Application

**Option A: If you have the deployment package locally**
```bash
# From your local machine, upload the package
scp -i pickntrust-key.pem pickntrust-deployment-package.tar.gz ubuntu@[EC2_IP]:/opt/pickntrust/

# SSH back into EC2 and extract
ssh -i pickntrust-key.pem ubuntu@[EC2_IP]
cd /opt/pickntrust
tar -xzf pickntrust-deployment-package.tar.gz
```

**Option B: Clone from repository**
```bash
# If your code is in a Git repository
cd /opt/pickntrust
git clone [YOUR_REPOSITORY_URL] .
```

### Step 8: Configure Application

**Create environment file with all your secrets:**
```bash
cd /opt/pickntrust

cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
DOMAIN=www.pickntrust.com
FRONTEND_URL=https://www.pickntrust.com
EOF
```

### Step 9: Build and Start Application

```bash
# Install dependencies
npm install --production

# Build the application
npm run build

# Start with PM2
pm2 start dist/server/index.js --name "pickntrust-app"
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Check if app is running
pm2 status
```

### Step 10: Configure Nginx

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.pickntrust.com pickntrust.com;

    # Serve static files
    location /uploads/ {
        alias /opt/pickntrust/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /assets/ {
        alias /opt/pickntrust/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve the React app
    location / {
        proxy_pass http://localhost:5000;
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
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 11: Test Your Website

```bash
# Test if app is running locally
curl http://localhost:5000/api/categories

# Test if Nginx is working
curl http://localhost/api/categories

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx
```

### Step 12: Enable HTTPS (After DNS propagates)

**Wait 10-30 minutes for DNS to propagate, then:**
```bash
# Install SSL certificate
sudo certbot --nginx -d www.pickntrust.com -d pickntrust.com

# Reload Nginx
sudo systemctl reload nginx
```

## 🔍 Troubleshooting Commands

**If website still doesn't work:**

```bash
# Check if app is listening on port 5000
sudo netstat -tulpn | grep :5000

# Check PM2 logs
pm2 logs pickntrust-app

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart everything
pm2 restart all
sudo systemctl restart nginx

# Test direct IP access
curl http://[YOUR_EC2_IP]:5000
```

## 📋 Quick Checklist

- [ ] EC2 instance running with correct security group
- [ ] DNS A records point to EC2 public IP
- [ ] Application running on port 5000 (check with `pm2 status`)
- [ ] Nginx running and configured (check with `sudo systemctl status nginx`)
- [ ] Environment variables set correctly
- [ ] Wait 10-30 minutes for DNS propagation

## 🎯 Expected Results

After completing all steps:
- **http://www.pickntrust.com** - Should load your website
- **http://www.pickntrust.com/admin** - Admin panel
- **http://www.pickntrust.com/api/categories** - API endpoint

After SSL setup:
- **https://www.pickntrust.com** - Secure website

## 🆘 If Still Not Working

1. **Check EC2 Public IP**: Make sure DNS points to the correct current IP
2. **Wait for DNS**: Can take up to 24 hours but usually 10-30 minutes
3. **Test Direct IP**: Try `http://[EC2_IP]:5000` to bypass DNS
4. **Check Security Group**: Ensure ports 80, 443, 5000 are open
5. **Check Application Logs**: `pm2 logs pickntrust-app`

## 💡 Pro Tips

- DNS changes can take time - be patient
- Test with direct IP first to isolate DNS issues
- Keep PM2 and Nginx logs open while testing
- Use `pm2 monit` for real-time monitoring

**Your website WILL work after following these steps!** 🚀
