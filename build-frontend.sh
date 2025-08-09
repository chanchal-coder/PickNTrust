#!/bin/bash

echo "🏗️ Building frontend for production..."

# Clean previous builds
rm -rf dist/public
rm -rf public/assets

# Build the frontend using Vite
echo "📦 Running Vite build..."
npx vite build

# Check if build was successful
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Frontend build successful!"
    
    # Create public directory structure
    mkdir -p public
    
    # Copy built files to public directory
    cp -r dist/* public/
    
    echo "📁 Files copied to public directory"
    ls -la public/
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "🎉 Frontend build completed successfully!"
