# 🚨 IMMEDIATE FIX FOR CONNECTION REFUSED

## THE REAL PROBLEM
Your application is likely running fine on EC2, but AWS Security Group is blocking external access.

## EXACT FIX STEPS (2 MINUTES)

### Step 1: Open AWS Console
Go to: https://console.aws.amazon.com/ec2/

### Step 2: Find Your Security Group
1. Click **"Security Groups"** in left sidebar
2. Look for the security group attached to instance: `i-0cf17c20d70832aff`
3. It's usually named `launch-wizard-1` or `default`

### Step 3: Add HTTP Rule
1. Select your security group
2. Click **"Edit inbound rules"**
3. Click **"Add rule"**
4. Fill in:
   - **Type**: `HTTP`
   - **Port**: `80`
   - **Source**: `0.0.0.0/0`
5. Click **"Save rules"**

### Step 4: Test Immediately
After saving, test these URLs:
- http://51.20.43.157
- http://pickntrust.com

## WHY THIS FIXES IT
- Your app is running on port 5000 internally
- Nginx should proxy port 80 to port 5000
- AWS Security Group is blocking port 80 from internet
- Adding HTTP rule allows external access

## IF STILL NOT WORKING
Run these commands on your EC2:

```bash
# Check if app is running
pm2 status

# Start if not running
pm2 start ecosystem.config.cjs

# Check nginx
sudo systemctl status nginx

# Start nginx if stopped
sudo systemctl start nginx

# Test locally
curl http://localhost:5000
curl http://localhost:80
```

## ALTERNATIVE: Direct Port 5000 Access
If you want to test the backend directly, add another Security Group rule:
- **Type**: `Custom TCP`
- **Port**: `5000`
- **Source**: `0.0.0.0/0`

Then test: http://51.20.43.157:5000

## 🎯 BOTTOM LINE
The #1 issue is AWS Security Group blocking HTTP traffic. Add the HTTP rule and your site will work immediately.
