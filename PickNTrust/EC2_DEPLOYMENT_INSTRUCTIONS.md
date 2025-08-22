# 🚀 EC2 Deployment Instructions

## Step 1: SSH into your EC2 instance
```bash
ssh -i "C:\AWSKeys\picktrust-key.pem" ec2-user@51.20.43.157
```

## Step 2: Navigate to your project directory
```bash
cd PickNTrust
```

## Step 3: Download and run the complete check script
```bash
# Make sure you have the latest files
git pull origin main

# Or if you need to copy the script manually, create it:
nano EC2_COMPLETE_CHECK_AND_FIX.sh
# Then paste the script content and save (Ctrl+X, Y, Enter)

# Make it executable and run
chmod +x EC2_COMPLETE_CHECK_AND_FIX.sh
bash EC2_COMPLETE_CHECK_AND_FIX.sh
```

## Step 4: What the script will do
The script will automatically:
- ✅ Check system resources and dependencies
- ✅ Install/update npm packages
- ✅ Build the application (frontend + backend)
- ✅ Stop any conflicting services
- ✅ Start backend with PM2
- ✅ Configure and start Nginx
- ✅ Test all connections (local and external)
- ✅ Create monitoring tools
- ✅ Provide final status report

## Step 5: Expected Output
You should see:
```
🎉 DEPLOYMENT CHECK COMPLETE!
=============================
✅ Dependencies installed
✅ Application built successfully
✅ Backend running on port 5000
✅ Nginx configured and running on port 80
✅ External access configured
✅ Monitoring script created (./monitor.sh)

🌐 Your site should be accessible at:
   http://51.20.43.157
   http://pickntrust.com (if DNS configured)
```

## Step 6: Verify your site is working
Open your browser and go to: **http://51.20.43.157**

## Step 7: Monitor your application
```bash
# Quick status check
./monitor.sh

# View logs
pm2 logs

# Restart if needed
pm2 restart all
sudo systemctl restart nginx
```

## 🆘 If Something Goes Wrong

### Common Issues and Fixes:

1. **Permission denied errors:**
   ```bash
   sudo chown -R ec2-user:ec2-user /home/ec2-user/PickNTrust
   ```

2. **Port already in use:**
   ```bash
   sudo fuser -k 80/tcp
   sudo fuser -k 5000/tcp
   ```

3. **Nginx won't start:**
   ```bash
   sudo nginx -t  # Check config
   sudo systemctl status nginx  # Check status
   sudo tail -f /var/log/nginx/error.log  # Check logs
   ```

4. **PM2 issues:**
   ```bash
   pm2 kill  # Kill all PM2 processes
   pm2 start ecosystem.config.cjs  # Restart
   ```

5. **Build fails:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## 📞 Need Help?
If you encounter any issues, run these commands and share the output:
```bash
./monitor.sh
pm2 logs --lines 20
sudo tail -20 /var/log/nginx/error.log
```

---

**After running the script, your PickNTrust application should be fully deployed and accessible at http://51.20.43.157**
