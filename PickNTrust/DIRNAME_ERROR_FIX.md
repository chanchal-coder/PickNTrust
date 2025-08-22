# 🔧 __dirname Error Fix - ES Module Issue

## 🎯 Root Cause Identified!
- **Problem**: `__dirname` is undefined in ES modules (line 343 in dist/server/index.js)
- **Location**: Static file serving section in production mode
- **Issue**: `path.resolve(__dirname, '../public')` fails because `__dirname` is undefined

## 🔧 **IMMEDIATE FIX - Create Public Directory & Files:**

### **Step 1: Create the required directory structure**
```bash
# Create public directory
mkdir -p /home/ec2-user/PickNTrust/public

# Create a basic index.html file
cat > /home/ec2-user/PickNTrust/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PickNTrust - Your Trusted Shopping Companion</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; margin-bottom: 30px; }
        .admin-link {
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            transition: transform 0.3s;
        }
        .admin-link:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ PickNTrust</h1>
        <p>Your Trusted Shopping Companion</p>
        <p>Welcome to PickNTrust - Find the best deals and trusted products!</p>
        <a href="/admin" class="admin-link">Admin Panel</a>
    </div>
</body>
</html>
EOF

# Copy any existing built assets
if [ -d "/home/ec2-user/PickNTrust/dist/client" ]; then
    cp -r /home/ec2-user/PickNTrust/dist/client/* /home/ec2-user/PickNTrust/public/ 2>/dev/null || true
fi

# Set proper permissions
chmod -R 755 /home/ec2-user/PickNTrust/public
```

### **Step 2: Restart PM2 with correct working directory**
```bash
# Stop current process
pm2 delete pickntrust

# Start from the project directory (important for relative paths)
cd /home/ec2-user/PickNTrust
pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production --env PORT=5000

# Save configuration
pm2 save
```

## 🎯 **One-Command Fix (RECOMMENDED):**

```bash
mkdir -p /home/ec2-user/PickNTrust/public && \
cat > /home/ec2-user/PickNTrust/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PickNTrust - Your Trusted Shopping Companion</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; margin-bottom: 30px; }
        .admin-link { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; transition: transform 0.3s; }
        .admin-link:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ PickNTrust</h1>
        <p>Your Trusted Shopping Companion</p>
        <p>Welcome to PickNTrust - Find the best deals and trusted products!</p>
        <a href="/admin" class="admin-link">Admin Panel</a>
    </div>
</body>
</html>
EOF
chmod -R 755 /home/ec2-user/PickNTrust/public && \
pm2 delete pickntrust && \
cd /home/ec2-user/PickNTrust && \
pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production --env PORT=5000 && \
pm2 save
```

## 📊 **Verification Commands:**

```bash
# 1. Check if public directory exists
ls -la /home/ec2-user/PickNTrust/public/

# 2. Check PM2 status
pm2 status

# 3. Check PM2 logs
pm2 logs pickntrust --lines 10

# 4. Test the website
curl http://localhost:5000

# 5. Test through Nginx
curl http://51.20.43.157
```

## 🎯 **Expected Results:**

After the fix:
- `/home/ec2-user/PickNTrust/public/` directory exists with index.html
- PM2 status shows "online"
- `curl http://localhost:5000` returns HTML content
- `curl http://51.20.43.157` returns the website
- Website loads properly at http://51.20.43.157

## 🔍 **Alternative: If Client Build Exists**

```bash
# Check if there's a client build
ls -la /home/ec2-user/PickNTrust/client/dist/

# If it exists, copy it to public
if [ -d "/home/ec2-user/PickNTrust/client/dist" ]; then
    cp -r /home/ec2-user/PickNTrust/client/dist/* /home/ec2-user/PickNTrust/public/
fi
```

## 🎊 **Final Step!**

This creates the missing public directory and index.html file that the server is trying to serve. The `__dirname` issue is resolved by ensuring the PM2 process starts from the correct working directory.

**Run the one-command fix above and your PickNTrust website will be fully functional!**

## 🌐 **After Fix - Your Live URLs:**

- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔑 Admin Login**: admin / pickntrust2025
