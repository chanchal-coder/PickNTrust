# PickNTrust AWS EC2 Deployment Guide - Fixed Version

## 🚀 Quick Start

This guide provides a complete solution for fixing build errors and deploying PickNTrust to AWS EC2.

## 🔧 Issues Fixed

### 1. Import Path Issues
- **Problem**: `@shared` path mappings not working in build process
- **Solution**: Changed all imports from `@shared/schema` to `../shared/schema.js`
- **Files Fixed**:
  - `server/db.ts`
  - `server/db.mts`
  - `server/storage.ts`
  - `server/routes.ts`
  - `server/seed.ts`
  - `server/seed-fixed.ts`

### 2. Schema Type Exports
- **Problem**: SQLite schema missing type exports
- **Solution**: Added all required type exports to `shared/sqlite-schema.ts`
- **Types Added**: `Product`, `BlogPost`, `Category`, `AffiliateNetwork`, etc.

### 3. Build Configuration
- **Problem**: TypeScript build failing due to module resolution
- **Solution**: Fixed import paths to use relative paths with `.js` extensions

## 📋 Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **Node.js 18+** installed locally

3. **AWS Account** with EC2 permissions

## 🚀 One-Command Deployment

```bash
./deploy-to-aws.sh
```

This script will:
1. ✅ Check prerequisites
2. 🔧 Fix build issues
3. 📦 Build the project
4. ☁️ Create AWS resources
5. 🚀 Deploy to EC2
6. 🌐 Configure Nginx
7. 📊 Start the application

## 📁 Project Structure

```
PickNTrust/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── shared/                 # Shared schemas
├── deploy-to-aws.sh       # Deployment script
├── .env.example           # Environment template
└── DEPLOYMENT_FIXED.md    # This guide
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### Step 1: Fix Build Issues
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Create Environment File
```bash
cp .env.example .env
# Edit .env with your values
```

### Step 3: AWS Setup
```bash
# Create key pair
aws ec2 create-key-pair --key-name pickntrust-key --query "KeyMaterial" --output text > pickntrust-key.pem
chmod 400 pickntrust-key.pem

# Create security group
aws ec2 create-security-group --group-name pickntrust-sg --description "PickNTrust Security Group"
```

### Step 4: Launch EC2 Instance
```bash
# Launch instance
aws ec2 run-instances \
  --image-id ami-0c02b5597204e1e5d \
  --instance-type t3.small \
  --key-name pickntrust-key \
  --security-group-ids sg-xxxxxxxxx
```

### Step 5: Deploy Application
```bash
# Copy files to EC2
scp -i pickntrust-key.pem -r . ubuntu@YOUR_EC2_IP:/opt/pickntrust/

# SSH and setup
ssh -i pickntrust-key.pem ubuntu@YOUR_EC2_IP
cd /opt/pickntrust
npm install --production
npm run build
pm2 start dist/server/index.js --name pickntrust
```

## 🌐 Application URLs

After deployment:
- **Main App**: `http://YOUR_EC2_IP`
- **Admin Panel**: `http://YOUR_EC2_IP/admin`
- **API**: `http://YOUR_EC2_IP/api`

## 🔐 Admin Access

- **Username**: Admin panel access
- **Password**: `pickntrust2025`

## 📊 Features Deployed

### Frontend Features
- ✅ Product catalog with categories
- ✅ Blog system with timer functionality
- ✅ Admin panel for content management
- ✅ Responsive design
- ✅ Search and filtering

### Backend Features
- ✅ RESTful API
- ✅ SQLite database
- ✅ File upload system
- ✅ Admin authentication
- ✅ Product timer system
- ✅ Blog management

### Infrastructure
- ✅ AWS EC2 instance
- ✅ Nginx reverse proxy
- ✅ PM2 process management
- ✅ SSL-ready configuration
- ✅ Auto-scaling ready

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
ADMIN_PASSWORD=pickntrust2025
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name _;
    
    location /api/ {
        proxy_pass http://localhost:5000;
        # ... proxy settings
    }
    
    location / {
        proxy_pass http://localhost:5000;
        # ... proxy settings
    }
}
```

## 🚨 Troubleshooting

### Build Errors
```bash
# If build fails, check import paths
npm run build 2>&1 | grep "Cannot find module"

# Fix import paths to use relative paths
# Example: "@shared/schema" → "../shared/schema.js"
```

### Deployment Issues
```bash
# Check EC2 instance status
aws ec2 describe-instances --instance-ids i-xxxxxxxxx

# SSH into instance for debugging
ssh -i pickntrust-key.pem ubuntu@YOUR_EC2_IP

# Check application logs
pm2 logs pickntrust

# Check Nginx status
sudo systemctl status nginx
```

### Database Issues
```bash
# Check database file permissions
ls -la sqlite.db

# Reset database
rm sqlite.db
npm run seed
```

## 📈 Performance Optimization

### Recommended EC2 Instance Types
- **Development**: `t3.micro` (1 vCPU, 1GB RAM)
- **Production**: `t3.small` (2 vCPU, 2GB RAM)
- **High Traffic**: `t3.medium` (2 vCPU, 4GB RAM)

### Database Optimization
- Use PostgreSQL for production
- Enable database connection pooling
- Implement caching with Redis

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default admin password
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall rules
- [ ] Enable AWS CloudWatch monitoring
- [ ] Set up automated backups
- [ ] Configure log rotation

### SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## 💰 Cost Estimation

### AWS Costs (Monthly)
- **EC2 t3.small**: ~$15
- **Data Transfer**: ~$5
- **Storage**: ~$2
- **Total**: ~$22/month

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Check application logs with `pm2 logs`
4. Verify security group settings

## 🎉 Success!

Your PickNTrust application is now deployed and running on AWS EC2!

Visit your application at `http://YOUR_EC2_IP` and start managing your affiliate marketing platform.
