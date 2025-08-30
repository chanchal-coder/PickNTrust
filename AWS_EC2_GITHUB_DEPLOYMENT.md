# 🚀 AWS EC2 GitHub Deployment Guide for PickNTrust

## 📋 Instance Details
- **IP Address**: 51.20.43.157
- **Key File**: C:\AWSKeys\picktrust-key.pem
- **Deployment Method**: GitHub Repository

## 🎯 Step 1: Connect to Your EC2 Instance

```bash
# Connect via SSH
ssh -i "C:\AWSKeys\picktrust-key.pem" ubuntu@51.20.43.157
```

## 🎯 Step 2: Setup EC2 Environment

Once connected to your EC2 instance, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Verify installations
node --version
npm --version
git --version
```

## 🎯 Step 3: Clone Repository from GitHub

```bash
# Navigate to home directory
cd /home/ubuntu

# Clone your repository (replace with your actual GitHub repo URL)
git clone https://github.com/YOUR_USERNAME/PickNTrust.git

# Navigate to project directory
cd PickNTrust

# Install dependencies
npm install

# Build the application
npm run build
```

## 🎯 Step 4: Environment Configuration

Create environment file:

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

## 🎯 Step 5: Start Application with PM2

```bash
# Start application with PM2
pm2 start npm --name "pickntrust" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Follow the command it outputs (copy and run the sudo command)

# Check application status
pm2 status
pm2 logs pickntrust
```

## 🎯 Step 6: Configure Nginx Reverse Proxy

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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🎯 Step 7: Configure Security Group

Make sure your AWS Security Group allows:
- **Port 22** (SSH) - Your IP only
- **Port 80** (HTTP) - 0.0.0.0/0
- **Port 443** (HTTPS) - 0.0.0.0/0
- **Port 3000** (App) - 0.0.0.0/0 (optional, for direct access)

## 🎯 Step 8: Test Deployment

```bash
# Check if application is running
curl http://localhost:3000

# Check Nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status

# View application logs
pm2 logs pickntrust --lines 50
```

## 🌐 Access Your Application

- **Main Website**: http://51.20.43.157
- **Admin Panel**: http://51.20.43.157/admin
- **API Endpoints**: http://51.20.43.157/api/*

## 🔑 Admin Credentials

- **Username**: admin
- **Password**: pickntrust2025

## 🔄 Future Updates via GitHub

To update your application:

```bash
# SSH into EC2
ssh -i "C:\AWSKeys\picktrust-key.pem" ubuntu@51.20.43.157

# Navigate to project
cd /home/ubuntu/PickNTrust

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Restart PM2 process
pm2 restart pickntrust

# Check status
pm2 status
```

## 🛠️ Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs pickntrust

# Check if port 3000 is in use
sudo netstat -tlnp | grep :3000

# Restart application
pm2 restart pickntrust
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

### Database Connection Issues
```bash
# Test database connection
cd /home/ubuntu/PickNTrust
node -e "
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);
console.log('Database connected successfully');
client.end();
"
```

## 🔒 Security Recommendations

1. **Firewall Setup**:
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

2. **SSL Certificate** (Optional):
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com
```

3. **Regular Updates**:
```bash
# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Monitoring

```bash
# Monitor system resources
htop

# Monitor application logs
pm2 monit

# Check disk usage
df -h

# Check memory usage
free -h
```

## ✅ Deployment Checklist

- [ ] EC2 instance accessible via SSH
- [ ] Node.js, Git, PM2, Nginx installed
- [ ] Repository cloned from GitHub
- [ ] Dependencies installed and application built
- [ ] Environment variables configured
- [ ] Application started with PM2
- [ ] Nginx configured as reverse proxy
- [ ] Security group configured
- [ ] Application accessible via browser
- [ ] Admin panel working
- [ ] Database connection verified

Your PickNTrust application should now be live at **http://51.20.43.157**!
