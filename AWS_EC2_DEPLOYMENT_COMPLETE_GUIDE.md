# PickNTrust AWS EC2 Deployment Guide

## Prerequisites
- AWS Account with EC2 access
- Domain name (optional but recommended)
- SSH key pair for EC2 access

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
```bash
# Launch Ubuntu 22.04 LTS instance
# Recommended: t3.medium or larger (2 vCPU, 4GB RAM)
# Storage: 20GB+ SSD
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
```

### 1.2 Security Group Configuration
```bash
# Inbound Rules:
# SSH (22) - Your IP
# HTTP (80) - 0.0.0.0/0
# HTTPS (443) - 0.0.0.0/0
# Custom TCP (5000) - 0.0.0.0/0 (for backend API)
# Custom TCP (5173) - 0.0.0.0/0 (for development, optional)
```

## Step 2: Connect to EC2 Instance

```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

## Step 3: Install Required Software

### 3.1 Install Node.js and npm
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.2 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3.3 Install Nginx (Web Server)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.4 Install Git
```bash
sudo apt install git -y
```

## Step 4: Deploy Application

### 4.1 Clone Repository
```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your repo URL)
sudo git clone https://github.com/yourusername/PickNTrust.git
sudo chown -R ubuntu:ubuntu PickNTrust
cd PickNTrust
```

### 4.2 Install Dependencies
```bash
# Install all dependencies
npm install

# Install production dependencies
npm ci --only=production
```

### 4.3 Build Application
```bash
# Build the frontend
npm run build

# Verify build files exist
ls -la dist/public/
```

## Step 5: Configure Environment

### 5.1 Create Environment File
```bash
# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db

# Optional: Add your domain
DOMAIN=your-domain.com
EOF
```

### 5.2 Initialize Database
```bash
# Create database directory
mkdir -p data

# Initialize database (if needed)
npm run db:push
```

## Step 6: Configure PM2

### 6.1 Create PM2 Ecosystem File
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pickntrust',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
```

### 6.2 Create Logs Directory
```bash
mkdir -p logs
```

### 6.3 Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 7: Configure Nginx

### 7.1 Create Nginx Configuration
```bash
sudo tee /etc/nginx/sites-available/pickntrust << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or EC2 IP
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Serve static files
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Handle API routes
    location /api {
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
    
    # Handle uploads
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 7.2 Enable Site and Restart Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Step 8: Setup SSL Certificate (Optional but Recommended)

### 8.1 Install Certbot
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 8.2 Obtain SSL Certificate
```bash
# Replace with your domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 9: Setup Firewall

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 10: Monitoring and Maintenance

### 10.1 Monitor Application
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs pickntrust

# Monitor resources
pm2 monit
```

### 10.2 Update Application
```bash
# Create update script
cat > update-app.sh << 'EOF'
#!/bin/bash
cd /var/www/PickNTrust

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Restart PM2
pm2 restart pickntrust

echo "Application updated successfully!"
EOF

chmod +x update-app.sh
```

## Step 11: Backup Strategy

### 11.1 Database Backup
```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/pickntrust"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup SQLite database
cp /var/www/PickNTrust/sqlite.db $BACKUP_DIR/sqlite_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "sqlite_*.db" -mtime +7 -delete

echo "Database backup completed: sqlite_$DATE.db"
EOF

chmod +x backup-db.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/PickNTrust/backup-db.sh") | crontab -
```

## Step 12: Performance Optimization

### 12.1 Enable Nginx Caching
```bash
# Add to nginx configuration
sudo tee -a /etc/nginx/nginx.conf << 'EOF'
# Cache settings
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
EOF

sudo systemctl restart nginx
```

### 12.2 Setup Log Rotation
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## Troubleshooting

### Common Issues and Solutions

1. **Application not starting:**
   ```bash
   pm2 logs pickntrust
   # Check for errors in logs
   ```

2. **Nginx 502 Bad Gateway:**
   ```bash
   # Check if application is running
   pm2 status
   
   # Check nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Database issues:**
   ```bash
   # Check database file permissions
   ls -la sqlite.db
   
   # Ensure proper ownership
   sudo chown ubuntu:ubuntu sqlite.db
   ```

4. **Port conflicts:**
   ```bash
   # Check what's using port 5000
   sudo netstat -tulpn | grep :5000
   ```

## Final Verification

1. **Check application status:**
   ```bash
   pm2 status
   curl -I http://localhost:5000
   ```

2. **Test from browser:**
   - Visit `http://your-ec2-ip` or `http://your-domain.com`
   - Test all major features
   - Check browser console for errors

3. **Monitor performance:**
   ```bash
   pm2 monit
   htop
   ```

## Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Application logs monitored
- [ ] Non-root user for application
- [ ] Nginx security headers configured

Your PickNTrust application should now be successfully deployed on AWS EC2!

## Support Commands

```bash
# Restart everything
sudo systemctl restart nginx
pm2 restart pickntrust

# View all logs
pm2 logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Update system
sudo apt update && sudo apt upgrade -y
