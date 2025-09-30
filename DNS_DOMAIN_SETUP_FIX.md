# 🌐 DNS Domain Setup Fix - Complete Domain Configuration

## 🎯 **ISSUE IDENTIFIED:**
- ❌ `DNS_PROBE_FINISHED_NXDOMAIN` - Domain not resolving
- ❌ `pickntrust.com` not pointing to your server IP
- ❌ DNS records not configured properly
- ❌ Domain registrar settings need updating

## 🚀 **COMPLETE DNS SETUP SOLUTION:**

### **Step 1: Get Your Server IP Address**
```bash
# Get your EC2 server's public IP
curl -s http://checkip.amazonaws.com
# OR
curl -s https://ipinfo.io/ip
# OR check in AWS console

# Your server IP should be something like: 51.20.43.157
```

### **Step 2: Configure DNS Records at Domain Registrar**

You need to configure these DNS records at your domain registrar (where you bought pickntrust.com):

**Required DNS Records:**
```
Type    Name    Value               TTL
A       @       51.20.43.157        300
A       www     51.20.43.157        300
CNAME   *       pickntrust.com      300
```

**Where to configure:**
- **GoDaddy**: DNS Management → DNS Records
- **Namecheap**: Domain List → Manage → Advanced DNS
- **Cloudflare**: DNS → Records
- **Route53**: Hosted Zones → pickntrust.com

### **Step 3: Verify DNS Configuration**
```bash
# Check if DNS is working (run these from your local computer)
nslookup pickntrust.com
nslookup www.pickntrust.com

# Should return your server IP: 51.20.43.157
```

### **Step 4: Alternative - Use IP Address Temporarily**
While DNS propagates, you can access your site directly via IP:

```bash
# Test your website using IP address
curl -I http://51.20.43.157
curl -I https://51.20.43.157

# Or visit in browser (temporarily):
# http://51.20.43.157
```

### **Step 5: Update Nginx for IP Access (Temporary)**
```bash
# Add IP-based server block for immediate access
sudo tee -a /etc/nginx/conf.d/pickntrust.conf << 'EOF'

# Temporary IP-based access
server {
    listen 80;
    server_name 51.20.43.157;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
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
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ IP-based access configured"
```

## 🎯 **IMMEDIATE ACCESS SOLUTION:**

```bash
# Get your server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com)
echo "Your server IP is: $SERVER_IP"

# Configure Nginx for IP access
sudo tee -a /etc/nginx/conf.d/pickntrust.conf << 'EOF'

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
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
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx && \
echo "🎉 Website accessible at: http://$SERVER_IP"
```

## 📊 **DNS Configuration Guide by Registrar:**

### **GoDaddy:**
1. Login to GoDaddy account
2. Go to "My Products" → "DNS"
3. Find pickntrust.com → "Manage DNS"
4. Add these records:
   - **A Record**: Name: `@`, Value: `51.20.43.157`
   - **A Record**: Name: `www`, Value: `51.20.43.157`

### **Namecheap:**
1. Login to Namecheap account
2. Domain List → "Manage" next to pickntrust.com
3. "Advanced DNS" tab
4. Add these records:
   - **A Record**: Host: `@`, Value: `51.20.43.157`
   - **A Record**: Host: `www`, Value: `51.20.43.157`

### **Cloudflare:**
1. Login to Cloudflare
2. Select pickntrust.com domain
3. DNS → Records
4. Add these records:
   - **A**: Name: `pickntrust.com`, IPv4: `51.20.43.157`
   - **A**: Name: `www`, IPv4: `51.20.43.157`

### **AWS Route53:**
```bash
# If using Route53, create hosted zone
aws route53 create-hosted-zone --name pickntrust.com --caller-reference $(date +%s)

# Add A records
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "pickntrust.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "51.20.43.157"}]
    }
  }]
}'
```

## 🔍 **Troubleshooting DNS Issues:**

### **Check DNS Propagation:**
```bash
# Check from different locations
dig pickntrust.com @8.8.8.8
dig pickntrust.com @1.1.1.1
dig www.pickntrust.com @8.8.8.8

# Online tools:
# https://www.whatsmydns.net/#A/pickntrust.com
# https://dnschecker.org/
```

### **If DNS Takes Time to Propagate:**
```bash
# Use hosts file temporarily (on your local computer)
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts

# Add this line:
51.20.43.157 pickntrust.com www.pickntrust.com
```

### **Check Current DNS Settings:**
```bash
# See what DNS records exist
nslookup pickntrust.com
dig pickntrust.com ANY

# Check nameservers
dig NS pickntrust.com
```

## 🎯 **Expected Results:**

**Before DNS Fix:**
- ❌ DNS_PROBE_FINISHED_NXDOMAIN
- ❌ pickntrust.com not accessible
- ❌ Domain not resolving

**After DNS Fix:**
- ✅ pickntrust.com resolves to your server IP
- ✅ www.pickntrust.com works
- ✅ Website accessible via domain
- ✅ SSL certificate works with domain

## 🌐 **Immediate Access Options:**

While waiting for DNS to propagate:

1. **Direct IP Access**: `http://51.20.43.157`
2. **Hosts File**: Add IP mapping locally
3. **Subdomain**: Use existing working subdomain if available

## ⏰ **DNS Propagation Time:**

- **TTL 300 seconds**: 5 minutes minimum
- **Global propagation**: 24-48 hours maximum
- **Most locations**: 2-6 hours typical

## 🎉 **Final Steps After DNS Works:**

Once DNS is working:
1. **Test domain access**: `https://pickntrust.com`
2. **Verify SSL certificate**: Should show green padlock
3. **Test all pages**: Ensure full functionality
4. **Remove IP-based config**: Clean up temporary Nginx rules

## 🔧 **Quick Domain Check:**

```bash
# Run this to check if your domain is working
curl -I http://pickntrust.com 2>/dev/null | head -1 || echo "Domain not resolving yet"

# If working, you should see: HTTP/1.1 200 OK or similar
# If not working: "Domain not resolving yet"
```

## 🎊 **This Will Fix Your Domain Access!**

The issue is that your domain `pickntrust.com` is not pointing to your server's IP address. You need to configure DNS records at your domain registrar to point the domain to your EC2 server's public IP address.

**Configure the DNS records at your domain registrar, and your website will be accessible via pickntrust.com!**

**Immediate workaround: Use your server's IP address directly until DNS propagates.**
