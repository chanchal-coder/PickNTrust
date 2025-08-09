# 🔧 502 Bad Gateway Fix - Final Step!

## 🎉 Great Progress!
- ✅ PM2 is now "online" 
- ✅ Nginx is running
- 🔄 Need to fix connection between Nginx and the app

## 🚨 Issue: 502 Bad Gateway
This means Nginx can't connect to your application on port 3000.

## 🔧 **IMMEDIATE FIX - Run These Commands:**

### **Step 1: Check if app is listening on port 3000**
```bash
netstat -tlnp | grep 3000
```

### **Step 2: Check PM2 logs**
```bash
pm2 logs pickntrust --lines 20
```

### **Step 3: Test local connection**
```bash
curl http://localhost:3000
```

## 🎯 **Most Likely Fixes:**

### **Fix 1: App not listening on port 3000**
```bash
# Check if PORT environment variable is set
pm2 delete pickntrust
pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production --env PORT=3000
pm2 save
```

### **Fix 2: Check if app is actually running**
```bash
# Check PM2 detailed status
pm2 show pickntrust

# If app is crashing, check logs
pm2 logs pickntrust
```

### **Fix 3: Restart Nginx**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### **Fix 4: Test Nginx configuration**
```bash
sudo nginx -t
```

## 🔧 **Quick One-Command Fix:**

```bash
pm2 delete pickntrust && pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production --env PORT=3000 && pm2 save && sudo systemctl restart nginx
```

## 📊 **Verification Commands:**

```bash
# 1. Check PM2 status
pm2 status

# 2. Check if port 3000 is listening
netstat -tlnp | grep 3000

# 3. Test local connection
curl http://localhost:3000

# 4. Check Nginx status
sudo systemctl status nginx

# 5. Test the website
curl http://51.20.43.157
```

## 🎯 **Expected Results:**

After the fix:
- `netstat -tlnp | grep 3000` should show the app listening
- `curl http://localhost:3000` should return HTML or JSON
- `curl http://51.20.43.157` should return the website
- Website should load at http://51.20.43.157

## 🔍 **If Still 502 Error:**

### **Check Nginx error logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

### **Check if SELinux is blocking:**
```bash
sudo setsebool -P httpd_can_network_connect 1
```

### **Alternative Nginx config:**
```bash
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo nginx -t
sudo systemctl restart nginx
```

## 🎊 **You're Almost There!**

The 502 error is the final hurdle. Once the app is properly listening on port 3000, your website will be live!

**Most likely solution**: Run the one-command fix above to ensure the app starts with PORT=3000 environment variable.
