# 🔧 Port 5000 Fix - Final Step!

## 🎉 Great! App is running on port 5000
- ✅ PM2 is "online" 
- ✅ App is listening on port 5000
- 🔄 Need to update Nginx to proxy to port 5000 instead of 3000

## 🔧 **IMMEDIATE FIX - Update Nginx Configuration:**

### **One-Command Fix:**
```bash
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.20.43.157;

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

sudo nginx -t && sudo systemctl restart nginx
```

## 📊 **Verification Commands:**

```bash
# 1. Check if port 5000 is listening
netstat -tlnp | grep 5000

# 2. Test local connection to port 5000
curl http://localhost:5000

# 3. Test Nginx configuration
sudo nginx -t

# 4. Check Nginx status
sudo systemctl status nginx

# 5. Test the website
curl http://51.20.43.157
```

## 🎯 **Expected Results:**

After running the fix:
- `netstat -tlnp | grep 5000` should show the app listening
- `curl http://localhost:5000` should return HTML/JSON
- `curl http://51.20.43.157` should return the website
- Website should load at http://51.20.43.157

## 🔍 **Alternative: Change App Port to 3000 (if preferred):**

If you want to keep Nginx config as is and change the app to port 3000:

```bash
pm2 delete pickntrust
pm2 start dist/server/index.js --name "pickntrust" --env NODE_ENV=production --env PORT=3000
pm2 save
```

## 🎊 **You're There!**

This is the final fix! The app is working on port 5000, we just need to update Nginx to proxy to the correct port.

**Run the one-command fix above and your website will be live!**

## 🌐 **After Fix - Your Live URLs:**

- **🏠 Main Website**: http://51.20.43.157
- **👨‍💼 Admin Panel**: http://51.20.43.157/admin
- **🔑 Admin Login**: admin / pickntrust2025
