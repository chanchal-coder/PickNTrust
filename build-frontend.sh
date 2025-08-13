#!/bin/bash

echo "🏗️ Building frontend for production..."

# Clean previous builds
rm -rf dist/public
rm -rf public/assets

# Build the frontend using Vite
echo "📦 Running Vite build..."
npx vite build

# Check if build was successful - Vite outputs to dist/public/
if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build successful!"
    
    # Create public directory structure
    mkdir -p public
    
    # Copy built files to public directory
    cp -r dist/public/* public/
    
    # Also create dist/client for the npm build script compatibility
    mkdir -p dist/client
    cp -r dist/public/* dist/client/
    
    echo "📁 Files copied to both public and dist/client directories"
    ls -la public/
    ls -la dist/client/
elif [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Frontend build successful (alternative path)!"
    
    # Create public directory structure
    mkdir -p public
    
    # Copy built files to public directory
    cp -r dist/* public/
    
    # Also create dist/client for the npm build script compatibility
    mkdir -p dist/client
    cp -r dist/* dist/client/
    
    echo "📁 Files copied to both public and dist/client directories"
    ls -la public/
    ls -la dist/client/
else
    echo "❌ Frontend build failed!"
    echo "Expected files not found. Directory contents:"
    ls -la dist/ 2>/dev/null || echo "dist/ directory not found"
    ls -la dist/public/ 2>/dev/null || echo "dist/public/ directory not found"
    exit 1
fi

echo "🎉 Frontend build completed successfully!"
