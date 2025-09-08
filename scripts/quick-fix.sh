#!/bin/bash

# Quick Fix Script for 502 Errors
# Run this on the production server to quickly resolve 502 issues

echo "🐱 Кіт Кухар - Quick 502 Fix Script"
echo "=================================="

# Check if services are running
echo "1. Checking service status..."
docker-compose ps

# Check backend health directly
echo -e "\n2. Testing backend health..."
if curl -f http://localhost:8000/health 2>/dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is NOT responding"
    
    echo -e "\n3. Restarting backend service..."
    docker-compose restart backend
    echo "Waiting 15 seconds..."
    sleep 15
    
    if curl -f http://localhost:8000/health 2>/dev/null; then
        echo "✅ Backend is now responding after restart"
    else
        echo "❌ Backend still not responding. Checking logs..."
        docker-compose logs --tail=20 backend
    fi
fi

# Check nginx
echo -e "\n4. Testing nginx connectivity to backend..."
if docker-compose exec -T nginx wget --spider -q http://backend:8000/health 2>/dev/null; then
    echo "✅ Nginx can reach backend"
else
    echo "❌ Nginx cannot reach backend"
    
    echo "Restarting nginx..."
    docker-compose restart nginx
    sleep 5
fi

# Final test
echo -e "\n5. Final site test..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://kitkuhar.com/ || curl -s -o /dev/null -w "%{http_code}" http://kitkuhar.com/)

case $HTTP_CODE in
    200)
        echo "✅ Site is working! HTTP $HTTP_CODE"
        ;;
    502)
        echo "❌ Still getting 502 error"
        echo "Try: docker-compose down && docker-compose up -d"
        ;;
    *)
        echo "⚠️  Site returned HTTP $HTTP_CODE"
        ;;
esac

echo -e "\nFor more detailed diagnostics, run: ./scripts/diagnose-502.sh"