#!/bin/bash
# Fix deployment issues - Run this on your EC2 instance

echo "🔧 Fixing PickNTrust deployment issues..."

# Step 1: Fix the backend to serve static files properly
echo "1. Updating backend configuration..."

# Check if we're in production mode and serving static files
cd /home/ec2-user/PickNTrust

# Stop current processes
pm2 delete all

# Check if dist/public exists (where static files should be)
echo "Checking build output..."
ls -la dist/
ls -la dist/public/ 2>/dev/null || echo "❌ dist/public not found"

# The issue is likely that the backend is running in development mode
# Let's force production mode and ensure static files are served

# Create a proper production start script
cat > start-production.js << 'EOF'
// Production starter script
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

// Import and start the server
import('./dist/server/index.js').catch(console.error);
EOF

# Alternative: Start backend in production mode directly
echo "2. Starting backend in production mode..."
pm2 start dist/server/index.js --name "pickntrust-backend" --env NODE_ENV=production --env PORT=5000

# Check if backend is serving static files
sleep 3
echo "3. Testing backend static file serving..."
curl -I http://localhost:5000/ || echo "❌ Backend not serving static files"

# If backend isn't serving static files, we need to use Nginx to serve them
echo "4. Configuring Nginx to serve static files..."

# Update Nginx config to serve static files directly
sudo tee /etc/nginx/sites-available/pickntrust > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name 51.20.43.157;

    # Serve static files directly from Nginx
    location /assets/ {
        alias /home/ec2-user/PickNTrust/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve other static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        root /home/ec2-user/PickNTrust/dist/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes to backend
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

    # All other routes to backend (which should serve the React app)
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
}
NGINXEOF

# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/pickntrust /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "5. Testing static file access..."
curl -I http://localhost/assets/style-Clbwe4xK.css || echo "❌ Static files not accessible"

# Save PM2 config
pm2 save

echo "6. Current PM2 status:"
pm2 status

echo "7. Testing endpoints:"
echo "Backend API:"
curl -I http://localhost:5000/api/health || echo "❌ Backend API not responding"

echo "Frontend via Nginx:"
curl -I http://localhost/ || echo "❌ Frontend not accessible via Nginx"

echo ""
echo "🔧 Fix completed! Now you need to:"
echo "1. Open AWS Security Group ports 80, 5000, 5173"
echo "2. Test: http://51.20.43.157"
echo ""
echo "If still having issues, check PM2 logs:"
echo "pm2 logs"
