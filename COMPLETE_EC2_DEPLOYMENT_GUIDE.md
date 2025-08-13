# 🚀 Complete AWS EC2 Deployment Guide for PickNTrust

## 📋 Deployment Overview

**Your AWS EC2 Instance:**
- **IP Address**: 51.20.43.157
- **SSH Key**: C:\AWSKeys\picktrust-key.pem
- **GitHub Repository**: https://github.com/chanchal-coder/PickNTrust

## 🎯 Quick Deployment Options

### Option 1: Automated Script Deployment (Recommended)

1. **Make the script executable:**
```bash
chmod +x deploy-to-ec2.sh
```

2. **Run the deployment script:**
```bash
./deploy-to-ec2.sh
```

This script will automatically:
- ✅ Test SSH connection
- ✅ Install all dependencies (Node.js, Git, PM2, Nginx)
- ✅ Clone your GitHub repository
- ✅ Install npm dependencies and build the app
- ✅ Configure environment variables
- ✅ Start the application with PM2
- ✅ Configure Nginx reverse proxy
- ✅ Test the deployment

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Connect to EC2
```bash
ssh -i "C:\AWSKeys\picktrust-key.pem" ubuntu@51.20.43.157
```

#### Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other dependencies
sudo apt-get install -y git nginx
sudo npm install -g pm2
```

#### Step 3: Clone and Setup Application
```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/chanchal-coder/PickNTrust.git
cd PickNTrust

# Install dependencies
npm install

# Build application
npm run build
```

#### Step 4: Configure Environment
```bash
# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
EOF
```

#### Step 5: Start with PM2
```bash
# Start application
pm2 start npm --name "pickntrust" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Run the sudo command it outputs
```

#### Step 6: Configure Nginx
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
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

    location /api {
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

    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 🌐 Access Your Application

After successful deployment:

- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔌 API Endpoints**: http://51.20.43.157/api/*

## 🔑 Admin Credentials

- **Username**: admin
- **Password**: pickntrust2025

## 🔄 GitHub Actions Auto-Deployment

I've created a GitHub Actions workflow (`.github/workflows/deploy.yml`) that will automatically deploy your application when you push to the main branch.

### Setup GitHub Actions:

1. **Add SSH Key to GitHub Secrets:**
   - Go to your repository: https://github.com/chanchal-coder/PickNTrust
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EC2_SSH_KEY`
   - Value: Copy the content of your `C:\AWSKeys\picktrust-key.pem` file

2. **Push the workflow file:**
```bash
# Add the workflow file to your repository
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

3. **Automatic Deployment:**
   - Every push to `main` branch will trigger automatic deployment
   - You can also manually trigger deployment from GitHub Actions tab

## 🛠️ Management Commands

### SSH into EC2:
```bash
ssh -i "C:\AWSKeys\picktrust-key.pem" ubuntu@51.20.43.157
```

### PM2 Management:
```bash
# Check status
pm2 status

# View logs
pm2 logs pickntrust

# Restart application
pm2 restart pickntrust

# Stop application
pm2 stop pickntrust

# Monitor resources
pm2 monit
```

### Update Application:
```bash
# SSH into EC2
ssh -i "C:\AWSKeys\picktrust-key.pem" ubuntu@51.20.43.157

# Navigate to project
cd /home/ubuntu/PickNTrust

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2
pm2 restart pickntrust
```

## 🔒 Security Checklist

### AWS Security Group Configuration:
Ensure your security group allows:
- **Port 22** (SSH) - Your IP only
- **Port 80** (HTTP) - 0.0.0.0/0
- **Port 443** (HTTPS) - 0.0.0.0/0

### Server Security:
```bash
# Enable firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Regular updates
sudo apt update && sudo apt upgrade -y
```

## 🚨 Troubleshooting

### Application Won't Start:
```bash
# Check PM2 logs
pm2 logs pickntrust

# Check if port is in use
sudo netstat -tlnp | grep :3000

# Restart PM2
pm2 restart pickntrust
```

### Nginx Issues:
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### Database Connection Issues:
```bash
# Test database connection
cd /home/ubuntu/PickNTrust
node -e "
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const client = postgres(process.env.DATABASE_URL);
console.log('Database connected successfully');
client.end();
"
```

## 📊 Monitoring

### System Resources:
```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# Memory usage
free -h
```

### Application Monitoring:
```bash
# PM2 monitoring
pm2 monit

# Application logs
pm2 logs pickntrust --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## ✅ Deployment Verification

After deployment, verify these work:

1. **Homepage loads**: http://51.20.43.157
2. **Admin panel accessible**: http://51.20.43.157/admin
3. **API endpoints respond**: http://51.20.43.157/api/products
4. **Database connection working**
5. **File uploads functional**
6. **PM2 process running**
7. **Nginx proxy working**

## 🎉 Success!

Your PickNTrust e-commerce application is now successfully deployed on AWS EC2!

**Live URLs:**
- **Website**: http://51.20.43.157
- **Admin**: http://51.20.43.157/admin

**Features Available:**
- ✅ Product management
- ✅ Blog system
- ✅ Admin dashboard
- ✅ Newsletter subscription
- ✅ File uploads
- ✅ Database persistence
- ✅ Auto-scaling with PM2
- ✅ Nginx reverse proxy
- ✅ GitHub Actions CI/CD

Your application is production-ready and accessible to users worldwide!
