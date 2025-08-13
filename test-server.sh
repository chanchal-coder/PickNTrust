#!/bin/bash

echo "🧪 Testing server connectivity..."

# Test if ports are open
echo "📡 Checking port availability..."
netstat -tlnp 2>/dev/null | grep -E ":5000|:5173" || echo "No processes found on ports 5000/5173"

# Test backend
echo "🔍 Testing backend (port 5000)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|404\|500"; then
    echo "✅ Backend is responding"
    curl -I http://localhost:5000
else
    echo "❌ Backend not responding"
fi

# Test frontend
echo "🔍 Testing frontend (port 5173)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|404"; then
    echo "✅ Frontend is responding"
    curl -I http://localhost:5173
else
    echo "❌ Frontend not responding"
fi

# Show running processes
echo "📊 Running Node processes:"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "No Node processes found"

echo "🏁 Server test completed"
