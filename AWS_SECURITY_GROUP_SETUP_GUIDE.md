# 🚨 CRITICAL: AWS Security Group Setup Required

## Current Status
✅ Your PickNTrust application is **FULLY WORKING** on the server  
✅ PM2, Nginx, and Node.js are all running correctly  
❌ AWS Security Group is **BLOCKING** external traffic  

## The Problem
You keep getting "connection refused" because AWS firewall is blocking port 80.

## MANDATORY STEPS TO FIX

### Step 1: Open AWS Console
1. Go to https://console.aws.amazon.com
2. Navigate to **EC2** service
3. Click **"Instances"** in the left sidebar

### Step 2: Find Your Instance
1. Look for instance with **Private IP**: `172.31.16.190`
2. **Public IP**: `51.20.43.157`
3. Click on this instance

### Step 3: Edit Security Group
1. Click the **"Security"** tab
2. Click on the **Security Group** link (looks like `sg-xxxxxxxxx`)
3. Click **"Edit inbound rules"** button

### Step 4: Add Required Rules
Click **"Add rule"** and add these **EXACT** rules:

**Rule 1:**
- Type: `HTTP`
- Port: `80`
- Source: `0.0.0.0/0`
- Description: `Allow HTTP traffic`

**Rule 2:**
- Type: `HTTPS` 
- Port: `443`
- Source: `0.0.0.0/0`
- Description: `Allow HTTPS traffic`

**Rule 3:** (Should already exist)
- Type: `SSH`
- Port: `22`
- Source: `Your IP` or `0.0.0.0/0`

### Step 5: Save Changes
1. Click **"Save rules"**
2. Wait 30 seconds for changes to apply

### Step 6: Test IP Address (NOT Domain)
**IMPORTANT**: Test the IP address first, NOT the domain:
- ✅ Try: `http://51.20.43.157`
- ❌ Don't try: `pickntrust.com` (won't work until DNS is configured)

## After IP Works: Configure Domain DNS

### Step 7: Configure DNS (Only after IP works)
In your domain registrar (GoDaddy, Namecheap, etc.):
1. Add **A Record**: `pickntrust.com` → `51.20.43.157`
2. Add **A Record**: `www.pickntrust.com` → `51.20.43.157`
3. Wait 5-60 minutes for DNS propagation

## Troubleshooting

### If IP Still Doesn't Work:
1. Double-check Security Group rules are saved
2. Try different browser/incognito mode
3. Check if your ISP blocks port 80

### If Domain Doesn't Work (After IP Works):
1. Check DNS propagation: https://dnschecker.org
2. Wait longer for DNS to propagate
3. Clear browser DNS cache

## Summary
1. **Fix AWS Security Group** (CRITICAL - blocks all traffic)
2. **Test IP address**: http://51.20.43.157
3. **Configure DNS** for pickntrust.com
4. **Test domain**: http://pickntrust.com

Your server is 100% ready - AWS just needs to allow traffic through!
