# 🚀 Alternative Deployment Methods for PickNTrust

Since SSH connection is failing, here are **multiple alternative ways** to deploy your application:

## 🔧 Method 1: Manual SSH + Copy-Paste Commands

**Step 1**: Manually SSH into your EC2 instance:
```bash
ssh -i "C:/AWSKeys/picktrust-key.pem" ec2-user@51.20.43.157
```

**Step 2**: Once connected, copy and paste these commands one by one:

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2 and Nginx
sudo npm install -g pm2
sudo yum install -y nginx

# Clone repository
rm -rf PickNTrust
git clone https://github.com/chanchal-coder/PickNTrust.git PickNTrust
cd PickNTrust

# Install dependencies and build
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
pm2 startup

# Configure Nginx
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'EOF'
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
EOF

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Deployment completed! Visit http://51.20.43.157"
```

## 🔧 Method 2: Docker Deployment

**Step 1**: SSH into EC2 manually, then run:

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Clone and deploy with Docker
git clone https://github.com/chanchal-coder/PickNTrust.git
cd PickNTrust
docker build -t pickntrust .
docker run -d -p 80:3000 --name pickntrust-app pickntrust
```

## 🔧 Method 3: Use AWS Systems Manager (No SSH needed)

**Step 1**: Go to AWS Console → Systems Manager → Session Manager
**Step 2**: Start a session with your EC2 instance
**Step 3**: Run the deployment commands from Method 1

## 🔧 Method 4: Create User Data Script for New Instance

If you want to launch a fresh EC2 instance with auto-deployment:

```bash
#!/bin/bash
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git nginx
npm install -g pm2

cd /home/ec2-user
git clone https://github.com/chanchal-coder/PickNTrust.git PickNTrust
cd PickNTrust
npm install
npm run build

cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
EOF

chown -R ec2-user:ec2-user /home/ec2-user/PickNTrust
sudo -u ec2-user pm2 start npm --name "pickntrust" -- start
sudo -u ec2-user pm2 save

tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

systemctl start nginx
systemctl enable nginx
```

## 🔧 Method 5: Use EC2 Instance Connect

**Step 1**: Go to AWS Console → EC2 → Instances
**Step 2**: Select your instance → Connect → EC2 Instance Connect
**Step 3**: Use the browser-based terminal to run deployment commands

## 🎯 Recommended Approach:

**Try Method 1 first** - Manual SSH + Copy-Paste Commands. This is the most reliable approach when automated scripts fail.

## 🌐 After Successful Deployment:

- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔑 Admin Login**: admin / pickntrust2025

## 🔍 Troubleshooting SSH Issues:

1. **Check SSH key permissions**: `chmod 400 "C:/AWSKeys/picktrust-key.pem"`
2. **Verify EC2 security group**: Port 22 should be open
3. **Check EC2 instance status**: Should be running
4. **Try different SSH client**: Use PuTTY on Windows
5. **Use EC2 Instance Connect**: Browser-based SSH alternative
