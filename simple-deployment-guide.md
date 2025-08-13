# 🚀 Simple PickNTrust Deployment Steps

Follow these steps exactly to deploy your PickNTrust project on EC2.

## Step 1: Connect to EC2
Open your terminal and run:
```bash
ssh -i "./picktrust-key.pem" ubuntu@51.20.43.157
```

## Step 2: Install Dependencies (Run on EC2)
```bash
# Update system
sudo apt update -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version
npm --version
pm2 --version
```

## Step 3: Upload Project (Run from your local machine)
Open a new terminal on your local machine and run:
```bash
scp -i "./picktrust-key.pem" pickntrust-app.tar.gz ubuntu@51.20.43.157:/home/ubuntu/
```

## Step 4: Extract and Setup Project (Back on EC2)
```bash
# Go to home directory
cd /home/ubuntu

# Remove old project if exists
rm -rf PickNTrust

# Create project directory and extract
mkdir PickNTrust
tar -xzf pickntrust-app.tar.gz -C PickNTrust

# Go to project directory
cd PickNTrust

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 5: Create Environment File (On EC2)
```bash
cd /home/ubuntu/PickNTrust

cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://byhevspaetryxpmnkyxd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU
JWT_SECRET=X9f3!aK2lLp#2025_TrustSecureKey
ADMIN_PASSWORD=pickntrust2025
EOF
```

## Step 6: Start Backend with PM2 (On EC2)
```bash
cd /home/ubuntu/PickNTrust

# Stop any existing processes
pm2 delete all 2>/dev/null || true

# Start backend on port 5000
pm2 start npm --name "pickntrust-backend" -- start

# Check status
pm2 status
```

## Step 7: Start Frontend with PM2 (On EC2)
```bash
cd /home/ubuntu/PickNTrust

# Start frontend on port 5173
pm2 start npx --name "pickntrust-frontend" --cwd /home/ubuntu/PickNTrust/client -- vite --host 0.0.0.0 --port 5173

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run the command that PM2 outputs
```

## Step 8: Configure Nginx (On EC2)
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

    # Frontend (port 5173)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (port 5000)
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
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 9: Test Your Deployment (On EC2)
```bash
# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:5173

# Test through Nginx
curl http://localhost:80

# Check what's running on ports
sudo netstat -tlnp | grep -E ':(80|5000|5173)'

# Check PM2 status
pm2 status

# Check PM2 logs if needed
pm2 logs
```

## Step 10: Fix AWS Security Group
1. Go to AWS Console → EC2 → Security Groups
2. Find your instance's security group
3. Add these inbound rules:
   - **HTTP**: Port 80, Source: 0.0.0.0/0
   - **Custom TCP**: Port 5000, Source: 0.0.0.0/0  
   - **Custom TCP**: Port 5173, Source: 0.0.0.0/0

## Step 11: Access Your Application
- **Main Site**: http://51.20.43.157
- **Admin Panel**: http://51.20.43.157/admin
- **Backend API**: http://51.20.43.157/api/health

## Troubleshooting Commands
```bash
# Check PM2 processes
pm2 status
pm2 logs

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check ports
sudo netstat -tlnp | grep -E ':(80|5000|5173)'

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

---

**That's it! Your PickNTrust application should now be running with:**
- ✅ Backend on port 5000 (managed by PM2)
- ✅ Frontend on port 5173 (managed by PM2)  
- ✅ Nginx reverse proxy on port 80
- ✅ Auto-restart on server reboot
