# Domain Configuration for www.pickntrust.com

## DNS Setup Required

Before running the deployment script, ensure your domain DNS is configured:

### DNS Records to Add:
```
Type: A
Name: www.pickntrust.com
Value: [YOUR_EC2_PUBLIC_IP]
TTL: 300

Type: A  
Name: pickntrust.com
Value: [YOUR_EC2_PUBLIC_IP]
TTL: 300
```

## SSL Certificate Setup

After deployment, run these commands on your EC2 instance to enable HTTPS:

```bash
# SSH into your EC2 instance
ssh -i pickntrust-key.pem ubuntu@[YOUR_EC2_IP]

# Install SSL certificate
sudo certbot --nginx -d www.pickntrust.com -d pickntrust.com

# Reload Nginx
sudo systemctl reload nginx
```

## Environment Variables

The deployment script will automatically create these environment variables:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./sqlite.db
ADMIN_PASSWORD=pickntrust2025
DOMAIN=www.pickntrust.com
```

## Final URLs

After successful deployment and SSL setup:
- **Main Site**: https://www.pickntrust.com
- **Admin Panel**: https://www.pickntrust.com/admin
- **API**: https://www.pickntrust.com/api

## Security Features Enabled

- HTTPS redirect from HTTP
- Security headers (HSTS, X-Frame-Options, etc.)
- SSL/TLS 1.2+ only
- Secure cipher suites
- Session security
