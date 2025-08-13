#!/bin/bash
echo "Checking deployment status..."

# Test if we can reach the server
echo "Testing connection to 51.20.43.157..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://51.20.43.157 || echo "Connection failed"

# Test SSH connection
echo "Testing SSH connection..."
ssh -i "./picktrust-key.pem" -o ConnectTimeout=5 ubuntu@51.20.43.157 "echo 'SSH works'; pm2 status; curl -s http://localhost:3000 | head -5" || echo "SSH failed"

echo "Check complete."
