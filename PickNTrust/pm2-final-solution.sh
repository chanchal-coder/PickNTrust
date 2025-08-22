#!/bin/bash

echo "🎯 FINAL PM2 SOLUTION - Backend on 5000, Frontend on 5173"

# Complete cleanup
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true

# Create PM2 ecosystem file (CommonJS format)
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './node_modules/.bin/tsx',
      args: 'server/index.ts',
      env: {
        NODE_ENV: 'development',
        PORT: '5000'
      },
      watch: false,
      max_restarts: 3,
      min_uptime: '10s'
    },
    {
      name: 'frontend',
      script: './node_modules/.bin/vite',
      args: '--host 0.0.0.0 --port 5173',
      cwd: './client',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
};
EOF

echo "✅ Created PM2 ecosystem config"

# Start with PM2
echo "🚀 Starting backend and frontend with PM2..."
pm2 start ecosystem.config.cjs

# Wait and check
sleep 10

echo "📊 PM2 Status:"
pm2 status

echo "🔍 Testing connections..."
echo "Backend (5000): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "FAILED")"
echo "Frontend (5173): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FAILED")"

echo "✅ FINAL PM2 SOLUTION COMPLETED!"
echo "🌐 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:5173"
echo "📋 Check status: pm2 status"
echo "📋 View logs: pm2 logs"
