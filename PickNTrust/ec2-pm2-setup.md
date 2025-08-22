# 🚀 PM2 Setup for PickNTrust (Already Cloned from GitHub)

Since you already have the project cloned from GitHub on your EC2 instance, follow these steps directly on your EC2 server.

## Step 1: Connect to Your EC2 Instance
```bash
ssh -i "your-key.pem" ubuntu@51.20.43.157
```

## Step 2: Navigate to Your Project Directory
```bash
cd /path/to/your/PickNTrust
# or wherever you cloned the GitHub repo
```

## Step 3: Install Dependencies
```bash
# Install project dependencies
npm install

# Build the project
npm run build
```

## Step 4: Install PM2 (if not already installed)
```bash
sudo npm install -g pm2
```

## Step 5: Create Environment File
```bash
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

## Step 6: Start Backend with PM2 (Port 5000)
```bash
# Stop any existing processes
pm2 delete all 2>/dev/null || true

# Start backend on port 5000
pm2 start npm --name "pickntrust-backend" -- start

# Check if it's running
pm2 status
```

## Step 7: Start Frontend with PM2 (Port 5173)
```bash
# Start frontend development server on port 5173
pm2 start npx --name "pickntrust-frontend" --cwd $(pwd)/client -- vite --host 0.0.0.0 --port 5173

# Alternative if client folder doesn't exist:
# pm2 start npx --name "pickntrust-frontend" -- vite --host 0.0.0.0 --port 5173

# Check both processes are running
pm2 status
```

## Step 8: Save PM2 Configuration
```bash
# Save current PM2 processes
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run the sudo command that PM2 outputs
```

## Step 9: Test Your Applications
```bash
# Test backend (should show API response)
curl http://localhost:5000/api/health

# Test frontend (should show HTML)
curl http://localhost:5173

# Check what's running on your ports
sudo netstat -tlnp | grep -E ':(5000|5173)'
```

## Step 10: Configure Nginx (Optional - for port 80 access)
```bash
# Install Nginx if not installed
sudo apt install nginx -y

# Create Nginx config
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

    # Frontend on port 5173
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API on port 5000
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
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
```

## Step 11: Open AWS Security Group Ports
In AWS Console → EC2 → Security Groups, add these inbound rules:
- **HTTP**: Port 80, Source: 0.0.0.0/0
- **Custom TCP**: Port 5000, Source: 0.0.0.0/0
- **Custom TCP**: Port 5173, Source: 0.0.0.0/0

## Access Your Application:
- **Frontend**: http://51.20.43.157:5173 (direct) or http://51.20.43.157 (via Nginx)
- **Backend**: http://51.20.43.157:5000
- **Admin Panel**: http://51.20.43.157/admin

## Useful PM2 Commands:
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all processes
pm2 restart all

# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all

# Monitor in real-time
pm2 monit
```

That's it! Your PickNTrust application is now running with PM2 managing both frontend (port 5173) and backend (port 5000).
