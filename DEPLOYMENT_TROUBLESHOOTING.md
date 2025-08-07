# 🚨 PickNTrust Deployment Troubleshooting

## Issue: ERR_CONNECTION_TIMED_OUT for www.pickntrust.com

The connection timeout indicates one of these issues:

### 1. DNS Not Configured
**Problem**: Domain not pointing to EC2 instance
**Solution**: Update DNS records with your EC2 public IP

### 2. EC2 Instance Not Running
**Problem**: Deployment script didn't complete or instance stopped
**Solution**: Check AWS console for instance status

### 3. Application Not Started
**Problem**: Application failed to start on EC2
**Solution**: SSH into instance and check application status

## 🔧 Manual Deployment Steps

Since AWS CLI isn't configured in this environment, follow these manual steps:

### Step 1: Create EC2 Instance Manually

1. **Go to AWS EC2 Console**
2. **Launch Instance**:
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.small
   - Key Pair: Create new "pickntrust-key"
   - Security Group: Allow ports 22, 80, 443, 5000

### Step 2: Configure Security Group

Add these inbound rules:
```
SSH (22) - 0.0.0.0/0
HTTP (80) - 0.0.0.0/0
HTTPS (443) - 0.0.0.0/0
Custom TCP (5000) - 0.0.0.0/0
```

### Step 3: SSH into Instance

```bash
ssh -i pickntrust-key.pem ubuntu@[YOUR_EC2_PUBLIC_IP]
```

### Step 4: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2, Git, Nginx
sudo npm install -g pm2
sudo apt-get install -y git nginx certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /opt/pickntrust
sudo chown -R ubuntu:ubuntu /opt/pickntrust
```

### Step 5: Deploy Application

```bash
# Navigate to app directory
cd /opt/pickntrust

# Clone or upload your application files
# (You'll need to upload the built application)

# Create environment file
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

# Install dependencies and build
npm install --production
npm run build

# Start with PM2
pm2 start dist/server/index.js --name "pickntrust-app"
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

### Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.pickntrust.com pickntrust.com;

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

# Enable site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Configure DNS

Update your domain DNS records:
```
Type: A
Name: www.pickntrust.com
Value: [YOUR_EC2_PUBLIC_IP]

Type: A
Name: pickntrust.com
Value: [YOUR_EC2_PUBLIC_IP]
```

### Step 8: Enable SSL

```bash
sudo certbot --nginx -d www.pickntrust.com -d pickntrust.com
sudo systemctl reload nginx
```

## 🔍 Debugging Commands

If site still doesn't work, check these:

```bash
# Check PM2 status
pm2 status
pm2 logs

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check if app is listening on port 5000
sudo netstat -tulpn | grep :5000

# Check application logs
pm2 logs pickntrust-app

# Test local connection
curl http://localhost:5000/api/categories
```

## 📋 Quick Checklist

- [ ] EC2 instance running
- [ ] Security group allows ports 22, 80, 443, 5000
- [ ] DNS records point to EC2 public IP
- [ ] Application running on port 5000
- [ ] Nginx configured and running
- [ ] SSL certificate installed

## 🆘 If Still Not Working

1. **Check EC2 Public IP**: Ensure DNS points to correct IP
2. **Wait for DNS Propagation**: Can take up to 24 hours
3. **Test Direct IP**: Try http://[EC2_PUBLIC_IP]:5000
4. **Check Logs**: PM2 and Nginx logs for errors
5. **Verify Environment**: Ensure all secrets are correct
