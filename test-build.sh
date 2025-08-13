#!/bin/bash

echo "🔍 Testing Build Process"
echo "========================"

# Clean any existing build
echo "Cleaning previous builds..."
rm -rf dist/

# Test Vite build with verbose output
echo "Testing Vite build..."
npx vite build --logLevel info

# Check if build succeeded
if [ -d "dist" ]; then
    echo "✅ Dist directory created"
    ls -la dist/
    
    if [ -d "dist/public" ]; then
        echo "✅ dist/public directory exists"
        ls -la dist/public/
        
        if [ -f "dist/public/index.html" ]; then
            echo "✅ index.html found in dist/public"
        else
            echo "❌ index.html NOT found in dist/public"
        fi
    else
        echo "❌ dist/public directory NOT found"
    fi
else
    echo "❌ Dist directory NOT created - build failed"
fi

# Test server build
echo "Testing server build..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outbase=.

if [ -f "dist/server/index.js" ]; then
    echo "✅ Server built successfully"
else
    echo "❌ Server build failed"
fi

echo "Build test completed!"
