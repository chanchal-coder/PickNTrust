# Deployment Guide for PickTrustDeals

## Prerequisites
1. An AWS EC2 instance (Ubuntu 20.04 LTS or Amazon Linux 2 recommended)
2. SSH access to the EC2 instance
3. A domain name (optional, but recommended)

## Deployment Steps

### 1. Launch an EC2 Instance
1. Go to the AWS EC2 Console
2. Click "Launch Instance"
3. Choose "Ubuntu Server 20.04 LTS" or "Amazon Linux 2"
4. Select an instance type (t3.micro or larger recommended)
5. Configure security groups to allow:
   - HTTP (port 80)
   - HTTPS (port 443)
   - SSH (port 22) - only from your IP for security
6. Launch the instance and download the key pair

### 2. Connect to Your EC2 Instance
```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Install Required Dependencies
```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm nginx git

# For Amazon Linux 2
sudo yum update
sudo yum install -y nodejs npm nginx git
```

### 4. Transfer Application Files
You can transfer the application files using SCP:
```bash
# From your local machine, run this command:
scp -i /path/to/your-key.pem -r deploy/* ubuntu@your-ec2-public-ip:/home/ubuntu/picktrustdeals
```

### 5. Set Up the Application on EC2
```bash
# Connect to your EC2 instance
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip

# Navigate to the application directory
cd /home/ubuntu/picktrustdeals

# Install production dependencies
npm install --production

# Install PM2 globally to manage the Node.js application
sudo npm install -g pm2
```

### 6. Configure Nginx
Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/picktrustdeals
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP

    location / {
        root /home/ubuntu/picktrustdeals/dist/public;
        index index.html;
        try_files $uri $uri/ =404;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/picktrustdeals /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Start the Application
```bash
# Start the backend server with PM2
pm2 start dist/server/index.js --name picktrustdeals

# Save the PM2 process list
pm2 save

# Configure PM2 to start on system boot
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 8. Configure SSL (Optional but Recommended)
Install Let's Encrypt for free SSL certificates:
```bash
# For Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# For Amazon Linux 2
sudo yum install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Useful PM2 Commands
- `pm2 status` - View application status
- `pm2 logs` - View application logs
- `pm2 restart picktrustdeals` - Restart the application
- `pm2 stop picktrustdeals` - Stop the application

## Troubleshooting
1. If the application doesn't start, check the logs with `pm2 logs`
2. If Nginx shows a 502 error, ensure the backend server is running with `pm2 status`
3. Check Nginx configuration with `sudo nginx -t`
4. Restart Nginx with `sudo systemctl restart nginx`

## Updating the Application
1. Build the application locally with `npm run build`
2. Transfer the updated files to EC2
3. Restart the application with `pm2 restart picktrustdeals`
