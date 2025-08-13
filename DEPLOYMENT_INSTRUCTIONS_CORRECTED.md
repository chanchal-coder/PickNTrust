# 🚨 IMPORTANT: Deployment Instructions Correction

## ❌ What You Did (Incorrect):
You tried to run the deployment script **ON** the EC2 instance itself:
```bash
[ec2-user@ip-172-31-16-190 ~]$ ./deploy-private-repo.sh
```

## ✅ What You Should Do (Correct):

### The deployment script should be run from your **LOCAL MACHINE** (Windows), NOT on the EC2 instance!

## 🎯 Correct Deployment Steps:

### Step 1: On Your Windows Machine
Open **Command Prompt** or **PowerShell** on your Windows machine and navigate to your project:
```cmd
cd c:\Users\sharm\Desktop\PickNTrust-debug
```

### Step 2: Run the Deployment Script from Windows
```cmd
./deploy-private-repo.sh
```

OR if you're using PowerShell:
```powershell
bash ./deploy-private-repo.sh
```

## 🔄 How the Script Works:

1. **Runs on Windows** (your local machine)
2. **Packages** your project files locally
3. **Uploads** the package to EC2 via SCP
4. **SSH into EC2** and runs installation commands
5. **Configures** everything on EC2 automatically

## 🚨 Alternative: Manual Deployment on EC2

If you prefer to work directly on the EC2 instance, here's what to do:

### Step 1: Stay on EC2 and Install Dependencies
```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git and other tools
sudo yum install -y git nginx
sudo npm install -g pm2
```

### Step 2: Clone Your Private Repository
Since your repo is private, you'll need to authenticate:

**Option A: Use GitHub CLI**
```bash
# Install GitHub CLI
sudo yum install -y gh
gh auth login
gh repo clone chanchal-coder/PickNTrust
```

**Option B: Use Personal Access Token**
```bash
# Replace YOUR_TOKEN with your GitHub Personal Access Token
git clone https://YOUR_TOKEN@github.com/chanchal-coder/PickNTrust.git
```

**Option C: Upload Files Manually**
From your Windows machine, create a zip file and upload:
```cmd
# On Windows, create zip file (exclude node_modules, .git, etc.)
# Then upload via SCP:
scp -i "C:\AWSKeys\picktrust-key.pem" pickntrust.zip ec2-user@51.20.43.157:/home/ec2-user/
```

### Step 3: Setup Application on EC2
```bash
cd PickNTrust

# Install dependencies
npm install

# Build application
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
pm2 start npm --name "pickntrust" -- start
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
```bash
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

sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🎯 Recommended Approach:

**Option 1 (Easiest)**: Run the deployment script from your Windows machine:
```cmd
cd c:\Users\sharm\Desktop\PickNTrust-debug
./deploy-private-repo.sh
```

**Option 2 (Manual)**: Follow the manual steps above directly on the EC2 instance.

## 🌐 After Deployment:
Your app will be live at: **http://51.20.43.157**
Admin panel: **http://51.20.43.157/admin** (admin/pickntrust2025)

Which approach would you like to use?
