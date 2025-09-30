# Cross-Platform Deployment Guide

## Overview

This guide explains how to deploy PickNTrust on both Windows development environments and Linux EC2 production servers without Windows-specific PowerShell commands.

## The Problem

Previous build scripts used Windows-specific PowerShell commands like `Copy-Item` which fail on Linux EC2 instances:

```bash
# ❌ PROBLEMATIC (Windows-only)
"build": "vite build && esbuild ... && rm -rf dist/public && Copy-Item -Recurse dist/client dist/public"
```

## The Solution

We've implemented cross-platform build scripts that work on both Windows and Linux:

```bash
# ✅ CROSS-PLATFORM
"build:client": "vite build"  # Vite handles cross-platform building
"build:server": "esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --outbase=. --packages=external --minify --target=node18"
```

## Available Deployment Methods

### 1. Local Cross-Platform Build

```bash
# Works on Windows (Git Bash/WSL) and Linux
npm run deploy:local
# or
bash deploy-cross-platform.sh
```

### 2. EC2 Linux Deployment

```bash
# Deploy directly to EC2 from your local machine
npm run deploy:ec2
# or
bash deploy-ec2-linux.sh
```

### 3. Simple Server Deployment

```bash
# On the server (EC2 or any Linux server)
bash deploy.sh
```

## Build Process Explanation

### Client Build (Vite)
- **Input**: `client/` directory with React/TypeScript code
- **Output**: `dist/public/` with optimized static files
- **Command**: `vite build` (cross-platform)

### Server Build (esbuild)
- **Input**: `server/index.ts` and dependencies
- **Output**: `dist/server/index.js` bundled server
- **Command**: `esbuild` with Node.js target (cross-platform)

### No File Copying Required
- Vite automatically outputs to `dist/public/`
- esbuild outputs to `dist/server/`
- No need for `cp`, `Copy-Item`, or manual file operations

## Environment Setup

### Windows Development

1. **Use Git Bash or WSL** for running deployment scripts
2. **Avoid PowerShell** for deployment commands
3. **Use npm scripts** which are cross-platform

```bash
# ✅ Cross-platform
npm run build
npm run start

# ❌ Windows-specific
Copy-Item -Recurse dist\client dist\public
```

### Linux Production (EC2)

1. **Amazon Linux 2023** or **Ubuntu** recommended
2. **Node.js 18+** installed via NodeSource
3. **PM2** for process management
4. **Nginx** for reverse proxy

## Deployment Scripts Overview

### `deploy-cross-platform.sh`
- Works on any Unix-like system (Linux, macOS, WSL)
- Builds client and server
- Sets up environment
- Configures permissions
- Starts with PM2 if available

### `deploy-ec2-linux.sh`
- Connects to EC2 via SSH
- Installs system dependencies
- Clones/updates repository
- Builds application on server
- Configures Nginx
- Starts services

### `deploy.sh`
- Simple server-side deployment
- Updates code and rebuilds
- Restarts PM2 process
- Includes build verification

## Package.json Scripts

```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --platform=node --bundle --format=esm --outdir=dist --outbase=. --packages=external --minify --target=node18",
    "start": "NODE_ENV=production node dist/server/index.js",
    "start:pm2": "pm2 start dist/server/index.js --name pickntrust",
    "deploy:local": "bash deploy-cross-platform.sh",
    "deploy:ec2": "bash deploy-ec2-linux.sh",
    "clean": "rm -rf dist/ node_modules/.cache/",
    "verify": "node -e \"console.log('Node.js:', process.version); console.log('Platform:', process.platform);\""
  }
}
```

## Build Verification

All deployment scripts include build verification:

```bash
# Check that build outputs exist
if [ ! -d "dist/public" ] || [ ! -f "dist/server/index.js" ]; then
    echo "❌ Build verification failed"
    exit 1
fi
```

## Common Issues and Solutions

### Issue: "Copy-Item not found"
**Solution**: Use Linux-compatible commands or npm scripts

```bash
# ❌ Windows PowerShell
Copy-Item -Recurse src dest

# ✅ Cross-platform
cp -r src dest
# or better: let build tools handle file placement
```

### Issue: "Half-working site"
**Cause**: Build process failed silently or incomplete file copying
**Solution**: Use build verification in deployment scripts

### Issue: "Permission denied"
**Solution**: Set proper file permissions in deployment script

```bash
chmod 755 uploads/
chmod 644 sqlite.db
chmod 644 .env
```

## Best Practices

1. **Use npm scripts** for cross-platform compatibility
2. **Let build tools handle file placement** (Vite, esbuild)
3. **Avoid manual file copying** in build process
4. **Include build verification** in deployment scripts
5. **Use bash scripts** for deployment automation
6. **Test on target platform** before production deployment

## Quick Start

### For Development (Windows/Linux/macOS)
```bash
npm install
npm run build
npm run start
```

### For EC2 Deployment
```bash
# From your local machine
npm run deploy:ec2
```

### For Server Updates
```bash
# On the server
bash deploy.sh
```

## Troubleshooting

### Build Fails
1. Check Node.js version: `node --version` (should be 18+)
2. Clear cache: `npm run clean`
3. Reinstall dependencies: `npm ci`
4. Check build outputs: `ls -la dist/`

### Deployment Fails
1. Verify SSH connection to EC2
2. Check security group settings (ports 22, 80, 5000)
3. Ensure EC2 instance is running
4. Check deployment script permissions: `chmod +x deploy-*.sh`

### Application Not Accessible
1. Check PM2 status: `pm2 list`
2. Check Nginx status: `sudo systemctl status nginx`
3. Check port availability: `sudo netstat -tlnp | grep :80`
4. Check application logs: `pm2 logs pickntrust`

## Support

If you encounter issues:
1. Check this guide first
2. Verify your environment matches requirements
3. Test build process locally before deploying
4. Check server logs for specific error messages

The cross-platform approach ensures consistent builds across development and production environments while avoiding Windows-specific commands that cause deployment failures.