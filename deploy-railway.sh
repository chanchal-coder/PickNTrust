#!/bin/bash
# Railway Deployment Script for PickNTrust

set -e

echo "🚀 Deploying PickNTrust to Railway (Free Hosting)"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (will open browser)
echo "🔐 Please login to Railway in the browser that opens..."
railway login

# Initialize Railway project
echo "🎯 Initializing Railway project..."
railway init

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set DATABASE_URL="postgresql://postgres.byhevspaetryxpmnkyxd:cvpmaa123pnt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
railway variables set SUPABASE_URL="https://byhevspaetryxpmnkyxd.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU"
railway variables set JWT_SECRET="X9f3!aK2lLp#2025_TrustSecureKey"
railway variables set ADMIN_PASSWORD="pickntrust2025"
railway variables set DOMAIN="pickntrust.up.railway.app"
railway variables set FRONTEND_URL="https://pickntrust.up.railway.app"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "🌐 Your app will be available at: https://pickntrust.up.railway.app"
echo "📊 Admin panel: https://pickntrust.up.railway.app/admin"
echo "🔑 Admin credentials: admin / pickntrust2025"
