#!/bin/bash
# Kitkuhar Production Deployment Script
# Run this script on the server to deploy the application

set -e

echo "🚀 Deploying Kitkuhar to production..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Kitkuhar Production Environment Configuration

# Database Configuration
POSTGRES_DB=kitkuhar
POSTGRES_USER=kitkuhar_user
POSTGRES_PASSWORD=kitkuhar_prod_db_password_2024_very_secure_random_string

# Redis Configuration
REDIS_PASSWORD=kitkuhar_redis_prod_2024_secure_password_random

# Backend Security
SECRET_KEY=kitkuhar_jwt_secret_prod_2024_very_secure_random_string_at_least_32_characters_long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=https://kitkuhar.com,https://www.kitkuhar.com

# Environment Settings
ENVIRONMENT=production
LOG_LEVEL=INFO

# Admin User
ADMIN_EMAIL=brezaviktor@gmail.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_kitkuhar_2024_secure

# Database URL
DATABASE_URL=postgresql://kitkuhar_user:kitkuhar_prod_db_password_2024_very_secure_random_string@database:5432/kitkuhar

# Redis URL
REDIS_URL=redis://:kitkuhar_redis_prod_2024_secure_password_random@redis:6379
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
sudo docker-compose down --remove-orphans || true

# Safe cleanup - remove unused data but preserve database volumes
echo "🧹 Safe Docker cleanup (preserves database volumes)..."
sudo docker system prune -af || true
sudo docker image prune -af || true
sudo docker container prune -f || true
sudo docker network prune -f || true
sudo docker builder prune -af || true

# Remove only specific volumes (NOT database volumes)
echo "🗂️ Cleaning up non-database volumes..."
sudo docker volume rm kitkuhar_nginx_logs_prod 2>/dev/null || true
sudo docker volume rm kitkuhar_app_logs_prod 2>/dev/null || true
sudo docker volume rm kitkuhar_media_files_prod 2>/dev/null || true
echo "✅ Database volumes preserved (postgres_data_prod, redis_data_prod)"

# Build and start new containers
echo "🔨 Building and starting containers..."
sudo docker-compose up -d --build

# Wait a moment for containers to start
echo "⏳ Waiting for containers to initialize..."
sleep 10

# Check container status
echo "📊 Container status:"
sudo docker-compose ps

# Check logs for any immediate errors
echo "📋 Recent logs:"
sudo docker-compose logs --tail=20

# Test health endpoints
echo "🏥 Testing health endpoints..."
sleep 5

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx health check passed"
else
    echo "❌ Nginx health check failed"
fi

echo "🎉 Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Check logs: sudo docker-compose logs -f"
echo "2. Monitor status: sudo docker-compose ps" 
echo "3. Test website: http://your-server-ip"
echo "4. Check admin panel: http://your-server-ip/docs"