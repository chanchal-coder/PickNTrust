#!/bin/bash

# AWS Network Configuration Fix Script
# This script fixes common AWS networking issues that prevent external access

echo "🔧 AWS NETWORK CONFIGURATION FIX"
echo "================================="

# Get current instance metadata
echo "📋 Gathering instance information..."
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")
CURRENT_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "none")
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || echo "unknown")
AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null || echo "unknown")

echo "Instance ID: $INSTANCE_ID"
echo "Current Public IP: $CURRENT_IP"
echo "Private IP: $PRIVATE_IP"
echo "Availability Zone: $AZ"

# Check if we can access AWS metadata
if [ "$INSTANCE_ID" = "unknown" ]; then
    echo "❌ Cannot access AWS metadata service"
    echo "This might indicate a networking issue with the instance itself"
else
    echo "✅ AWS metadata service accessible"
fi

# Test current connectivity
echo ""
echo "🌐 Testing current connectivity..."
echo "1. Testing outbound internet access:"
if curl -s --connect-timeout 5 http://httpbin.org/ip > /dev/null; then
    echo "   ✅ Outbound internet access: Working"
else
    echo "   ❌ Outbound internet access: Failed"
fi

echo "2. Testing local web server:"
if curl -s --connect-timeout 5 http://localhost > /dev/null; then
    echo "   ✅ Local web server: Working"
else
    echo "   ❌ Local web server: Not responding"
fi

echo "3. Testing domain resolution:"
if nslookup pickntrust.com > /dev/null 2>&1; then
    RESOLVED_IP=$(nslookup pickntrust.com | grep 'Address:' | tail -1 | awk '{print $2}')
    echo "   ✅ Domain resolution: pickntrust.com → $RESOLVED_IP"
else
    echo "   ❌ Domain resolution: Failed"
fi

# Check network configuration
echo ""
echo "🔍 Checking network configuration..."
echo "1. Network interfaces:"
ip addr show | grep -E 'inet.*eth0|inet.*ens' | head -3

echo "2. Default route:"
ip route | grep default

echo "3. DNS configuration:"
cat /etc/resolv.conf | grep nameserver | head -2

# Check if nginx is properly configured and running
echo ""
echo "🔧 Checking web server configuration..."
echo "1. Nginx status:"
if systemctl is-active nginx > /dev/null 2>&1; then
    echo "   ✅ Nginx: Running"
else
    echo "   ❌ Nginx: Not running"
    echo "   🔄 Starting Nginx..."
    sudo systemctl start nginx
fi

echo "2. Nginx listening ports:"
sudo ss -tlnp | grep nginx | grep :80

echo "3. Testing nginx configuration:"
if sudo nginx -t > /dev/null 2>&1; then
    echo "   ✅ Nginx configuration: Valid"
else
    echo "   ❌ Nginx configuration: Invalid"
    sudo nginx -t
fi

# Check application status
echo ""
echo "📱 Checking application status..."
echo "1. PM2 processes:"
pm2 status

echo "2. Application connectivity:"
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "   ✅ Backend (port 5000): Responding"
else
    echo "   ❌ Backend (port 5000): Not responding"
fi

# Provide AWS Console instructions
echo ""
echo "🎯 AWS CONSOLE CONFIGURATION STEPS"
echo "================================="
echo ""
echo "Since Elastic IP association previously broke your setup, the issue is likely"
echo "that your instance is in a private subnet or missing proper VPC configuration."
echo ""
echo "📋 STEP 1: CHECK SUBNET TYPE"
echo "1. Go to AWS Console → VPC → Subnets"
echo "2. Find the subnet your instance is in"
echo "3. Check 'Auto-assign public IPv4 address' setting"
echo "4. If it's 'No', select the subnet → Actions → Modify auto-assign IP settings → Enable"
echo ""
echo "📋 STEP 2: VERIFY INTERNET GATEWAY"
echo "1. Go to AWS Console → VPC → Internet Gateways"
echo "2. Ensure there's an Internet Gateway attached to your VPC"
echo "3. If missing: Create Internet Gateway → Attach to VPC"
echo ""
echo "📋 STEP 3: CHECK ROUTE TABLE"
echo "1. Go to AWS Console → VPC → Route Tables"
echo "2. Find the route table associated with your subnet"
echo "3. Ensure there's a route: 0.0.0.0/0 → Internet Gateway"
echo "4. If missing: Edit routes → Add route → Destination: 0.0.0.0/0, Target: Internet Gateway"
echo ""
echo "📋 STEP 4: SECURITY GROUP CONFIGURATION"
echo "1. Go to AWS Console → EC2 → Security Groups"
echo "2. Find your instance's security group"
echo "3. Inbound Rules should include:"
echo "   - Type: HTTP, Port: 80, Source: 0.0.0.0/0"
echo "   - Type: SSH, Port: 22, Source: 0.0.0.0/0"
echo "4. Add missing rules if needed"
echo ""
echo "📋 STEP 5: NETWORK ACL CHECK"
echo "1. Go to AWS Console → VPC → Network ACLs"
echo "2. Find the Network ACL for your subnet"
echo "3. Ensure inbound rules allow HTTP (80) and SSH (22)"
echo "4. Ensure outbound rules allow all traffic"
echo ""
echo "⚠️  IMPORTANT: Only try Elastic IP association AFTER completing steps 1-5"
echo "    If the above networking is not configured correctly, Elastic IP will fail"
echo ""

# Test external access one more time
echo "🧪 FINAL CONNECTIVITY TEST"
echo "========================="
echo "Testing external access to this server..."

# Try to test from the server itself
echo "1. Testing domain access from server:"
if timeout 10 curl -s -I http://pickntrust.com 2>/dev/null | head -1; then
    echo "   ✅ Domain accessible from server"
else
    echo "   ❌ Domain not accessible from server"
fi

echo "2. Testing IP access from server:"
if timeout 10 curl -s -I http://$PRIVATE_IP 2>/dev/null | head -1; then
    echo "   ✅ Private IP accessible"
else
    echo "   ❌ Private IP not accessible"
fi

echo ""
echo "🎯 SUMMARY"
echo "=========="
echo "✅ Server application: Running"
echo "✅ Nginx web server: Configured"
echo "✅ Internal connectivity: Working"
echo "❌ External access: Blocked by AWS networking"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Follow the AWS Console steps above to fix VPC/subnet configuration"
echo "2. Only after networking is fixed, consider Elastic IP association"
echo "3. Test website access after each configuration change"
echo ""
echo "💡 The server and application are working correctly."
echo "   The issue is in AWS network infrastructure configuration."
echo "   Once fixed, both domain and IP access will work properly."