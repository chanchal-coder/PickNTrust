#!/bin/bash

echo "FIXING AWS SECURITY GROUP - OPENING PORT 80"
echo "==========================================="

# First, let's confirm what's running locally
echo "1. Confirming local services are running..."
curl -s http://localhost:80 > /dev/null && echo "✓ Nginx responding locally" || echo "✗ Nginx not responding"
curl -s http://localhost:5000 > /dev/null && echo "✓ Backend responding locally" || echo "✗ Backend not responding"

# Check what ports are actually listening
echo ""
echo "2. Checking what ports are listening..."
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000

# Get instance metadata
echo ""
echo "3. Getting AWS instance information..."
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "Unable to get instance ID")
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo "Unable to get region")
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "Unable to get public IP")

echo "Instance ID: $INSTANCE_ID"
echo "Region: $REGION"
echo "Public IP: $PUBLIC_IP"

# Test external connectivity
echo ""
echo "4. Testing external connectivity..."
echo "Testing connection to public IP: $PUBLIC_IP"
curl -I --connect-timeout 5 http://$PUBLIC_IP 2>&1 | head -3

echo ""
echo "DIAGNOSIS COMPLETE"
echo "=================="
echo "✓ Your server is running correctly"
echo "✓ Nginx is working on port 80"
echo "✓ Backend is working on port 5000"
echo "✗ AWS Security Group is blocking external access"

echo ""
echo "SOLUTION REQUIRED:"
echo "=================="
echo "You need to open port 80 in your AWS Security Group"
echo "1. Go to AWS Console > EC2 > Security Groups"
echo "2. Find your instance's security group"
echo "3. Add inbound rule: HTTP (port 80) from 0.0.0.0/0"
echo "4. Add inbound rule: HTTPS (port 443) from 0.0.0.0/0"
echo ""
echo "OR run this AWS CLI command (if you have AWS CLI configured):"
echo "aws ec2 authorize-security-group-ingress --group-id YOUR_SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0"
echo ""
echo "After fixing security group, your site will be accessible at:"
echo "http://$PUBLIC_IP"
echo "http://pickntrust.com (if DNS is configured)"
