#!/bin/bash
# Script to update GitHub repository with all deployment files

set -e

echo "🔄 Updating GitHub repository with deployment files..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git remote add origin https://github.com/chanchal-coder/PickNTrust.git
fi

# Configure git user (if not already configured)
git config user.name "chanchal-coder" 2>/dev/null || true
git config user.email "chanchal-coder@users.noreply.github.com" 2>/dev/null || true

# Add all files
echo "📦 Adding all files to Git..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "Complete PickNTrust deployment setup with AWS EC2 integration

- Fixed all application errors and dependencies
- Added private repository deployment scripts
- Created comprehensive deployment documentation
- Configured environment variables for production
- Added GitHub Actions workflow for CI/CD
- Implemented manual and automated deployment options
- Ready for AWS EC2 deployment at 51.20.43.157

Deployment files included:
- deploy-private-repo.sh (automated deployment)
- ec2-manual-deploy.sh (manual deployment)
- SIMPLE_EC2_DEPLOYMENT.md (copy-paste method)
- Complete documentation and troubleshooting guides"

# Try to push to main branch
echo "🚀 Pushing to GitHub..."
if git push origin main 2>/dev/null; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "⚠️ Push failed. Trying to force push..."
    if git push origin main --force 2>/dev/null; then
        echo "✅ Force push successful!"
    else
        echo "❌ Push failed. This might be due to:"
        echo "   1. Private repository authentication required"
        echo "   2. Need to create Personal Access Token"
        echo "   3. Repository permissions"
        echo ""
        echo "🔧 Manual steps to update GitHub:"
        echo "   1. Go to https://github.com/chanchal-coder/PickNTrust"
        echo "   2. Click 'Upload files' or use GitHub Desktop"
        echo "   3. Upload all the deployment files manually"
        echo ""
        echo "📋 Key files to upload:"
        echo "   - deploy-private-repo.sh"
        echo "   - ec2-manual-deploy.sh" 
        echo "   - SIMPLE_EC2_DEPLOYMENT.md"
        echo "   - All documentation files"
    fi
fi

echo "📊 Repository status:"
git status --short
