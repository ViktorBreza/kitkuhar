#!/bin/bash

# ============================================================================
# PRODUCTION DEPLOYMENT SCRIPT - Deploy with nginx configuration fix
# ============================================================================
#
# This script deploys the updated nginx configuration that fixes API routing
# 
# CHANGES:
# - Fixed nginx proxy_pass to preserve /api/ prefix
# - Updated production containers with latest code
# - Properly handles API routing for structured recipes
#

set -e

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run from project root."
    exit 1
fi

# Backup current configuration
echo "📦 Creating backup..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp -r nginx/ backups/$(date +%Y%m%d_%H%M%S)/ || echo "⚠️  No existing nginx config to backup"

# Build and deploy
echo "🏗️  Building and deploying containers..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Pull latest images
echo "📥 Pulling base images..."
docker-compose pull

# Build new containers
echo "🔨 Building containers..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check nginx
if docker-compose exec nginx wget --no-verbose --tries=1 --spider http://localhost/health 2>/dev/null; then
    echo "✅ Nginx is healthy"
else
    echo "❌ Nginx health check failed"
    docker-compose logs nginx
fi

# Check backend
if docker-compose exec backend curl -f http://localhost:8000/api/monitoring/health 2>/dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
fi

# Check frontend
if docker-compose exec frontend curl -f http://localhost 2>/dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
fi

# Test API routing
echo "🧪 Testing API routing..."
if docker-compose exec nginx curl -f http://localhost/api/recipes/ 2>/dev/null; then
    echo "✅ API routing is working"
else
    echo "❌ API routing test failed"
    echo "📋 Showing nginx logs:"
    docker-compose logs nginx | tail -20
    echo "📋 Showing backend logs:"
    docker-compose logs backend | tail -20
fi

echo "🎉 Production deployment complete!"
echo "🌐 Site should be available at: https://kitkuhar.com"
echo "📚 API docs at: https://kitkuhar.com/docs"
echo "💚 Health check: https://kitkuhar.com/health"

echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🔧 To view logs: docker-compose logs [service_name]"
echo "🔧 To stop: docker-compose down"