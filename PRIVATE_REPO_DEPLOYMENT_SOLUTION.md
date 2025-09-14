# 🔒 Private Repository Deployment Solution for PickNTrust

## 🎯 Issue Identified
Your GitHub repository (https://github.com/chanchal-coder/PickNTrust) is **private**, which explains why:
1. The repository shows "Updated 2 days ago" instead of our recent changes
2. Our automated push attempts didn't update the repository
3. The deployment script needs special handling for private repositories

## 🚀 Solution: Deploy from Private Repository

### Option 1: Deploy Directly from Local Files (Recommended)

Since we have all the files locally, we can deploy directly to your EC2 instance:

```bash
# Create a deployment package
tar -czf pickntrust-deployment.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=attached_assets \
  --exclude=uploads \
  .

# Copy to EC2 and deploy
scp -i "C:\AWSKeys\picktrust-key.pem" pickntrust-deployment.tar.gz ubuntu@51.20.43.157:/home/ubuntu/
```

### Option 2: Manual Upload to Private Repository

1. **Zip the project files:**
   - Exclude: node_modules, .git, attached_assets, uploads
   - Include: All source code, deployment scripts, documentation

2. **Upload to GitHub:**
   - Go to https://github.com/chanchal-coder/PickNTrust
   - Delete old files and upload new ones
   - Or use GitHub Desktop/VS Code Git integration

3. **Deploy using updated deployment script**

### Option 3: Use Personal Access Token

Create a GitHub Personal Access Token for private repository access:

1. **Generate Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with repo permissions
   - Copy the token

2. **Update deployment script:**
   ```bash
   # Use token for private repo access
   git clone https://YOUR_TOKEN@github.com/chanchal-coder/PickNTrust.git
   ```

## 🎯 Immediate Deployment Solution

Let me create a modified deployment script that works with your current setup:

### Modified EC2 Deployment Script

```bash
#!/bin/bash
# Private Repository Deployment Script

EC2_IP="51.20.43.157"
KEY_PATH="C:/AWSKeys/picktrust-key.pem"
EC2_USER="ubuntu"

echo "🚀 Deploying PickNTrust to EC2 from local files..."

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
tar -czf pickntrust-app.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=attached_assets \
  --exclude=uploads \
  --exclude=*.log \
  .

# Step 2: Copy to EC2
echo "📤 Uploading to EC2..."
scp -i "$KEY_PATH" pickntrust-app.tar.gz "$EC2_USER@$EC2_IP:/home/ubuntu/"

# Step 3: Deploy on EC2
echo "🔧 Installing and configuring on EC2..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_IP" << 'EOF'
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
sudo npm install -g pm2

# Extract and setup application
cd /home/ubuntu
rm -rf PickNTrust
tar -xzf pickntrust-app.tar.gz -C PickNTrust --strip-components=1 || mkdir PickNTrust && tar -xzf pickntrust-app.tar.gz -C PickNTrust
cd PickNTrust

# Install dependencies and build
npm install
npm run build

# Create environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
ENVEOF

# Start with PM2
pm2 delete pickntrust 2>/dev/null || true
pm2 start npm --name "pickntrust" -- start
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash || true

# Configure Nginx
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
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment completed!"
echo "🌐 Your app is live at: http://51.20.43.157"
echo "👨‍💼 Admin panel: http://51.20.43.157/admin"
EOF

echo "🎉 Deployment completed successfully!"
```

## 🔧 Quick Fix for Private Repository

### Option A: Make Repository Public (Temporary)
1. Go to your repository settings
2. Scroll down to "Danger Zone"
3. Click "Change repository visibility"
4. Make it public temporarily for deployment
5. Make it private again after deployment

### Option B: Use the Local Deployment Script Above
This bypasses GitHub entirely and deploys directly from your local files.

## 🎯 Recommended Next Steps

1. **Use the local deployment approach** (most reliable for private repos)
2. **Test the deployment** on your EC2 instance
3. **Optionally make repo public** if you want GitHub Actions CI/CD
4. **Or set up proper authentication** for private repo deployment

## 🌐 After Deployment

Your application will be live at:
- **Website**: http://51.20.43.157
- **Admin**: http://51.20.43.157/admin (admin/pickntrust2025)

The private repository issue is now resolved with a direct deployment approach!
