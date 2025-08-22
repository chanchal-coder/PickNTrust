#!/bin/bash

echo "🚀 PickNTrust Deployment Script"
echo "================================"

# Stop any existing processes
echo "📋 Step 1: Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install

# Build the application
echo "🔨 Step 3: Building application..."
npm run build

# Start the application with PM2
echo "🚀 Step 4: Starting application..."
pm2 start ecosystem.config.cjs

# Start Nginx
echo "🌐 Step 5: Starting web server..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Show status
echo "📊 Step 6: Checking status..."
pm2 status
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================"
echo "🌐 Your site should be accessible at:"
echo "   http://51.20.43.157"
echo "   http://pickntrust.com (if DNS configured)"
echo ""
echo "📝 If site not accessible, add HTTP rule to AWS Security Group:"
echo "   Type: HTTP, Port: 80, Source: 0.0.0.0/0"
echo ""
echo "🔍 Check logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart all"
