#!/bin/bash
# Safe Docker cleanup - removes everything EXCEPT database volumes
echo "🧹 Safe Docker cleanup - preserves database!"
echo "This will delete:"
echo "- All stopped containers"
echo "- All unused images" 
echo "- All build cache"
echo "- Log and media volumes"
echo "- All unused networks"
echo ""
echo "🛡️  PRESERVES: postgres_data_prod, redis_data_prod"
echo ""
read -p "Proceed with safe cleanup? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧽 Safe cleaning Docker..."
    
    # Stop everything
    sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
    
    # Remove everything EXCEPT volumes
    sudo docker system prune -af
    sudo docker image prune -af  
    sudo docker container prune -f
    sudo docker network prune -f
    sudo docker builder prune -af
    
    # Remove only non-database volumes
    sudo docker volume rm kitkuhar_nginx_logs_prod 2>/dev/null || true
    sudo docker volume rm kitkuhar_app_logs_prod 2>/dev/null || true
    sudo docker volume rm kitkuhar_media_files_prod 2>/dev/null || true
    
    echo "✅ Safe cleanup completed!"
    echo "🛡️  Database preserved: postgres_data_prod, redis_data_prod"
else
    echo "❌ Cleanup cancelled"
fi