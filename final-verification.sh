#!/bin/bash

echo "🔍 Final Deployment Verification"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get instance details
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

echo "📊 INSTANCE DETAILS:"
echo "==================="
echo "• Public IP: $PUBLIC_IP"
echo "• Instance ID: $INSTANCE_ID"
echo ""

# Step 1: Check application status
print_status "Step 1: Checking application status..."

# Check PM2
if pm2 list | grep -q "online.*pickntrust"; then
    print_success "✅ PM2 Process: ONLINE"
    PM2_STATUS="ONLINE"
else
    print_error "❌ PM2 Process: OFFLINE"
    PM2_STATUS="OFFLINE"
    print_status "Starting PM2 process..."
    pm2 start ecosystem.config.cjs
    sleep 3
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    print_success "✅ Nginx: RUNNING"
    NGINX_STATUS="RUNNING"
else
    print_error "❌ Nginx: STOPPED"
    NGINX_STATUS="STOPPED"
    print_status "Starting Nginx..."
    sudo systemctl start nginx
fi

# Check port 5000
if netstat -tlnp | grep -q ":5000"; then
    print_success "✅ Backend: LISTENING on port 5000"
    BACKEND_STATUS="LISTENING"
else
    print_error "❌ Backend: NOT LISTENING on port 5000"
    BACKEND_STATUS="NOT_LISTENING"
fi

# Check port 80
if netstat -tlnp | grep -q ":80"; then
    print_success "✅ Port 80: LISTENING"
    PORT80_STATUS="LISTENING"
else
    print_error "❌ Port 80: NOT LISTENING"
    PORT80_STATUS="NOT_LISTENING"
fi

echo ""

# Step 2: Test local connectivity
print_status "Step 2: Testing local connectivity..."

# Test backend directly
if curl -s --connect-timeout 5 http://localhost:5000 > /dev/null; then
    print_success "✅ Backend responds on localhost:5000"
    LOCAL_BACKEND="WORKING"
else
    print_error "❌ Backend not responding on localhost:5000"
    LOCAL_BACKEND="NOT_WORKING"
    print_status "Checking PM2 logs..."
    pm2 logs pickntrust --lines 5
fi

# Test Nginx locally
if curl -s --connect-timeout 5 http://localhost:80 > /dev/null; then
    print_success "✅ Nginx responds on localhost:80"
    LOCAL_NGINX="WORKING"
else
    print_error "❌ Nginx not responding on localhost:80"
    LOCAL_NGINX="NOT_WORKING"
fi

echo ""

# Step 3: Test external connectivity
print_status "Step 3: Testing external connectivity..."

# Test public IP
if curl -s --connect-timeout 10 http://$PUBLIC_IP > /dev/null; then
    print_success "✅ Site accessible via public IP: http://$PUBLIC_IP"
    PUBLIC_ACCESS="WORKING"
else
    print_error "❌ Site not accessible via public IP: http://$PUBLIC_IP"
    PUBLIC_ACCESS="NOT_WORKING"
fi

# Test domain
if curl -s --connect-timeout 10 http://pickntrust.com > /dev/null; then
    print_success "✅ Site accessible via domain: http://pickntrust.com"
    DOMAIN_ACCESS="WORKING"
else
    print_error "❌ Site not accessible via domain: http://pickntrust.com"
    DOMAIN_ACCESS="NOT_WORKING"
fi

echo ""

# Step 4: Diagnose issues
print_status "Step 4: Diagnosis and recommendations..."

echo ""
echo "📋 CURRENT STATUS SUMMARY:"
echo "=========================="
echo "• PM2 Process: $PM2_STATUS"
echo "• Nginx Service: $NGINX_STATUS"
echo "• Backend Port 5000: $BACKEND_STATUS"
echo "• Web Port 80: $PORT80_STATUS"
echo "• Local Backend: $LOCAL_BACKEND"
echo "• Local Nginx: $LOCAL_NGINX"
echo "• Public IP Access: $PUBLIC_ACCESS"
echo "• Domain Access: $DOMAIN_ACCESS"
echo ""

# Provide specific recommendations
if [[ "$PUBLIC_ACCESS" == "WORKING" ]]; then
    print_success "🎉 SUCCESS! Your site is accessible at:"
    echo "• http://$PUBLIC_IP"
    if [[ "$DOMAIN_ACCESS" == "WORKING" ]]; then
        echo "• http://pickntrust.com"
        echo "• http://www.pickntrust.com"
        print_success "🚀 DEPLOYMENT COMPLETE! Your site is fully live!"
    else
        print_warning "⚠️ Domain not working - check DNS configuration:"
        echo "• Ensure pickntrust.com points to $PUBLIC_IP"
        echo "• DNS changes can take up to 24 hours"
        echo "• Use http://$PUBLIC_IP in the meantime"
    fi
elif [[ "$LOCAL_BACKEND" == "WORKING" && "$LOCAL_NGINX" == "WORKING" ]]; then
    print_warning "⚠️ Application working locally but not externally"
    echo ""
    echo "🔧 POSSIBLE ISSUES:"
    echo "1. AWS Security Group - Double check HTTP rule:"
    echo "   • Type: HTTP, Port: 80, Source: 0.0.0.0/0"
    echo "2. Network ACLs - Check if default ACL allows traffic"
    echo "3. Instance firewall - Check if iptables is blocking"
    echo ""
    echo "🧪 QUICK TESTS:"
    echo "• Test from another server: curl http://$PUBLIC_IP"
    echo "• Check AWS Security Group in console"
    echo "• Check iptables: sudo iptables -L"
else
    print_error "❌ Application not working properly"
    echo ""
    echo "🔧 IMMEDIATE FIXES NEEDED:"
    if [[ "$PM2_STATUS" != "ONLINE" ]]; then
        echo "• Fix PM2: pm2 start ecosystem.config.cjs"
    fi
    if [[ "$NGINX_STATUS" != "RUNNING" ]]; then
        echo "• Fix Nginx: sudo systemctl start nginx"
    fi
    if [[ "$BACKEND_STATUS" != "LISTENING" ]]; then
        echo "• Check backend logs: pm2 logs pickntrust"
    fi
fi

echo ""
print_status "🌐 Test URLs:"
echo "• Direct IP: http://$PUBLIC_IP"
echo "• Domain: http://pickntrust.com"
echo "• Backend: http://$PUBLIC_IP:5000"
echo ""

if [[ "$PUBLIC_ACCESS" == "WORKING" ]]; then
    print_success "✅ DEPLOYMENT SUCCESSFUL! Your PickNTrust app is live! 🎉"
else
    print_warning "⚠️ Almost there! Check the recommendations above."
fi
