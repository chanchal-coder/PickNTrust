# 🔍 Complete Troubleshooting Checklist

## Current Issue: Connection Refused Despite AWS Security Group Configuration

Since you mentioned AWS Security Group is already configured but still getting connection refused, we need to systematically check everything.

## STEP 1: SSH Into Your EC2 Server

```bash
ssh -i "C:/AWSKeys/picktrust-key.pem" ec2-user@51.20.43.157
```

## STEP 2: Run These Diagnostic Commands

Copy and paste each command one by one:

### Check Services Status
```bash
pm2 status
```
```bash
sudo systemctl status nginx
```

### Check Port Bindings
```bash
sudo netstat -tlnp | grep :80
```
```bash
sudo netstat -tlnp | grep :5000
```

### Test Local Connectivity
```bash
curl -I http://localhost:80
```
```bash
curl -I http://localhost:5000
```

### Check Nginx Configuration
```bash
sudo nginx -t
```
```bash
cat /etc/nginx/conf.d/pickntrust.conf
```

### Check What's Using Port 80
```bash
sudo lsof -i :80
```

### Check System Firewall (iptables)
```bash
sudo iptables -L
```

## STEP 3: AWS Security Group Double-Check

In AWS Console:
1. Go to EC2 → Security Groups
2. Find your security group
3. Verify these EXACT rules exist:

**Inbound Rules:**
- Type: HTTP, Port: 80, Source: 0.0.0.0/0
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0  
- Type: SSH, Port: 22, Source: Your IP

## STEP 4: Test Different Access Methods

Try these URLs in your browser:
1. `http://51.20.43.157` (IP directly)
2. `http://pickntrust.com`
3. `http://www.pickntrust.com`

## STEP 5: Network Troubleshooting

### From Your Local Machine:
```bash
# Test if port 80 is reachable
telnet 51.20.43.157 80
```

```bash
# Check DNS resolution
nslookup pickntrust.com
```

```bash
# Ping the server
ping 51.20.43.157
```

## STEP 6: Alternative Testing

1. **Try from mobile data** (different network)
2. **Try incognito/private browsing**
3. **Try different browser**

## Common Issues and Solutions

### Issue 1: Services Not Running
**Solution**: Restart services
```bash
pm2 restart all
sudo systemctl restart nginx
```

### Issue 2: Wrong Nginx Configuration
**Solution**: Reconfigure nginx
```bash
sudo tee /etc/nginx/conf.d/pickntrust.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name pickntrust.com www.pickntrust.com 51.20.43.157;

    location / {
        proxy_pass http://127.0.0.1:5000;
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
sudo nginx -t
sudo systemctl reload nginx
```

### Issue 3: System Firewall Blocking
**Solution**: Disable iptables temporarily
```bash
sudo iptables -F
```

### Issue 4: DNS Not Propagated
**Solution**: Wait or use IP directly
- Test with IP: `http://51.20.43.157`
- Check DNS: https://dnschecker.org

## PLEASE RUN ALL COMMANDS AND REPORT RESULTS

I need the output of each command to identify the exact issue. The problem could be:
- Services crashed
- Nginx misconfiguration  
- System firewall
- AWS Network ACL
- DNS issues
- ISP blocking

**Run the commands and paste the results here!**
