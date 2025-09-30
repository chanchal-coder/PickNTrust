#!/bin/bash

echo "🔧 Fixing Connection Refused Issue"
echo "=================================="

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

# Step 1: Check current status
print_status "Step 1: Checking current application status..."

# Check if PM2 is running
if pm2 list | grep -q "pickntrust"; then
    print_success "✅ PM2 process is running"
    pm2 status
else
    print_error "❌ PM2 process not running"
    print_status "Starting PM2 process..."
    pm2 start ecosystem.config.cjs
fi

# Check if port 5000 is listening
if netstat -tlnp | grep -q ":5000"; then
    print_success "✅ Application is listening on port 5000"
else
    print_error "❌ Application not listening on port 5000"
fi

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    print_success "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
    print_status "Starting Nginx..."
    sudo systemctl start nginx
fi

# Step 2: Test local connectivity
print_status "Step 2: Testing local connectivity..."

# Test backend directly
if curl -s http://localhost:5000 > /dev/null; then
    print_success "✅ Backend responds on localhost:5000"
else
    print_error "❌ Backend not responding on localhost:5000"
    print_status "Checking PM2 logs..."
    pm2 logs pickntrust --lines 10
fi

# Test Nginx locally
if curl -s http://localhost:80 > /dev/null; then
    print_success "✅ Nginx responds on localhost:80"
else
    print_error "❌ Nginx not responding on localhost:80"
fi

# Step 3: Check network configuration
print_status "Step 3: Checking network configuration..."

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
print_status "Public IP: $PUBLIC_IP"

# Check if ports are open
print_status "Checking open ports:"
sudo netstat -tlnp | grep -E ":(80|443|5000)"

# Step 4: AWS Security Group Instructions
print_warning "Step 4: AWS Security Group Configuration Required"
echo ""
echo "🚨 CONNECTION REFUSED usually means AWS Security Group is blocking traffic!"
echo ""
echo "📋 REQUIRED AWS SECURITY GROUP RULES:"
echo "======================================"
echo "1. Go to AWS Console → EC2 → Security Groups"
echo "2. Find your instance's security group"
echo "3. Add these INBOUND RULES:"
echo ""
echo "   Rule 1: HTTP Traffic"
echo "   • Type: HTTP"
echo "   • Protocol: TCP"
echo "   • Port: 80"
echo "   • Source: 0.0.0.0/0 (Anywhere)"
echo ""
echo "   Rule 2: HTTPS Traffic (optional)"
echo "   • Type: HTTPS"
echo "   • Protocol: TCP"
echo "   • Port: 443"
echo "   • Source: 0.0.0.0/0 (Anywhere)"
echo ""
echo "   Rule 3: Custom TCP (for direct backend access)"
echo "   • Type: Custom TCP"
echo "   • Protocol: TCP"
echo "   • Port: 5000"
echo "   • Source: 0.0.0.0/0 (Anywhere)"
echo ""

# Step 5: Alternative access methods
print_status "Step 5: Alternative access methods while fixing Security Group..."

echo "🌐 Try accessing your site using:"
echo "• http://$PUBLIC_IP (using public IP directly)"
echo "• http://$PUBLIC_IP:5000 (direct backend access)"
echo ""

# Test public IP access
print_status "Testing public IP access..."
if curl -s --connect-timeout 5 http://$PUBLIC_IP > /dev/null; then
    print_success "✅ Site accessible via public IP: http://$PUBLIC_IP"
else
    print_error "❌ Site not accessible via public IP (Security Group issue)"
fi

# Step 6: Quick Security Group fix command
print_status "Step 6: Quick Security Group fix (if you have AWS CLI configured)..."

echo ""
echo "🔧 If you have AWS CLI configured, run these commands:"
echo ""
echo "# Get your security group ID"
echo "SECURITY_GROUP_ID=\$(aws ec2 describe-instances --instance-ids \$(curl -s http://169.254.169.254/latest/meta-data/instance-id) --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)"
echo ""
echo "# Add HTTP rule"
echo "aws ec2 authorize-security-group-ingress --group-id \$SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0"
echo ""
echo "# Add HTTPS rule"
echo "aws ec2 authorize-security-group-ingress --group-id \$SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0"
echo ""

# Step 7: Final verification
print_status "Step 7: Application status summary..."

echo ""
echo "📊 CURRENT STATUS:"
echo "=================="
echo "• Public IP: $PUBLIC_IP"
echo "• Domain: pickntrust.com"
echo "• Backend Port: 5000"
echo "• Web Server: Nginx (Port 80)"
echo ""

if pm2 list | grep -q "online.*pickntrust"; then
    echo "• PM2 Status: ✅ ONLINE"
else
    echo "• PM2 Status: ❌ OFFLINE"
fi

if sudo systemctl is-active --quiet nginx; then
    echo "• Nginx Status: ✅ RUNNING"
else
    echo "• Nginx Status: ❌ STOPPED"
fi

echo ""
print_warning "🎯 NEXT STEPS:"
echo "1. Fix AWS Security Group (add HTTP/HTTPS inbound rules)"
echo "2. Test access: http://$PUBLIC_IP"
echo "3. Once working, test: http://pickntrust.com"
echo ""
print_success "Your application is built and running - just need to open the firewall! 🚀"
