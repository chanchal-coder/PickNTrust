# 🚀 Final Deployment Instructions - PickNTrust

## ❌ Issue: Wrong Directory
You tried to run the script from your home directory (`~`), but the script is in your project directory.

## ✅ Correct Steps:

### Step 1: Navigate to Your Project Directory
```bash
cd c:/Users/sharm/Desktop/PickNTrust-debug
```

### Step 2: Run the Deployment Script
```bash
./one-command-deploy.sh
```

## 🎯 Complete Command Sequence:

Copy and paste these commands in your terminal:

```bash
# Navigate to project directory
cd c:/Users/sharm/Desktop/PickNTrust-debug

# Make script executable (if needed)
chmod +x one-command-deploy.sh

# Run the deployment
./one-command-deploy.sh
```

## 🚀 What the Script Will Do:

1. **Test SSH Connection** to your EC2 instance (51.20.43.157)
2. **Clone GitHub Repository** to EC2
3. **Install Dependencies** (Node.js, Git, PM2, Nginx)
4. **Build Application** and configure environment
5. **Start Services** with PM2 and Nginx
6. **Make Website Live** at http://51.20.43.157

## 🌐 Expected Output:

After successful deployment, you'll see:
```
🎉 Full deployment completed! Visit http://51.20.43.157 to see your app.
```

## 📋 Your Live URLs:
- **Website**: http://51.20.43.157
- **Admin Panel**: http://51.20.43.157/admin
- **Login**: admin / pickntrust2025

## 🔧 If You Get Permission Errors:

If you get permission errors, run:
```bash
# For Git Bash/MINGW64
chmod +x one-command-deploy.sh

# For PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🚨 Alternative: Copy-Paste Method

If the script doesn't work, you can use the copy-paste method from `SIMPLE_EC2_DEPLOYMENT.md` - just copy the deployment commands and paste them directly on your EC2 instance.

## ✅ Ready to Deploy!

**Just run these two commands:**
```bash
cd c:/Users/sharm/Desktop/PickNTrust-debug
./one-command-deploy.sh
```

Your PickNTrust application will be live in 5-10 minutes! 🎊
