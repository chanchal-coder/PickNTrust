# 🚨 URGENT: AWS Security Group Fix for ERR_CONNECTION_REFUSED

## THE PROBLEM
Your site shows "ERR_CONNECTION_REFUSED" because AWS Security Group is blocking HTTP traffic on port 80.

## IMMEDIATE SOLUTION (2 MINUTES)

### Step 1: Open AWS Console
Go to: https://console.aws.amazon.com/ec2/

### Step 2: Navigate to Security Groups
1. In the left sidebar, click **"Security Groups"**
2. Find the security group attached to your EC2 instance `i-0cf17c20d70832aff`
3. It's usually named `launch-wizard-1` or `default`

### Step 3: Add HTTP Rule
1. **Select** your security group
2. Click **"Edit inbound rules"** button
3. Click **"Add rule"** button
4. Configure the new rule:
   - **Type**: Select `HTTP` from dropdown
   - **Port**: Will auto-fill to `80`
   - **Source**: Select `Anywhere-IPv4` or enter `0.0.0.0/0`
5. Click **"Save rules"**

### Step 4: Test Immediately
After saving, test these URLs in your browser:
- http://51.20.43.157
- http://pickntrust.com

## ALTERNATIVE: Add Custom Port Rule
If you want to test the backend directly:
1. Add another rule with:
   - **Type**: `Custom TCP`
   - **Port**: `5000`
   - **Source**: `0.0.0.0/0`
2. Test: http://51.20.43.157:5000

## WHY THIS FIXES IT
- Your application is running correctly on EC2
- Nginx is proxying port 80 to your app on port 5000
- AWS Security Group is the firewall blocking external access
- Adding HTTP rule allows internet traffic to reach your server

## VERIFICATION COMMANDS
After adding the HTTP rule, run these on your EC2:

```bash
# Check if services are running
pm2 status
sudo systemctl status nginx

# Test local access
curl http://localhost:80
curl http://localhost:5000

# Check what's listening on ports
netstat -tlnp | grep -E ":(80|5000)"
```

## 🎯 BOTTOM LINE
The deployment is successful - you just need to open the HTTP port in AWS Security Group. This is a common AWS configuration step that's often missed.

**Add the HTTP rule and your site will be accessible immediately!**
