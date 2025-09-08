#!/bin/bash
# Nuclear Docker cleanup - removes EVERYTHING
echo "🚨 NUCLEAR Docker cleanup - this will remove EVERYTHING!"
echo "This will delete:"
echo "- All stopped containers"
echo "- All unused images" 
echo "- All unused volumes (INCLUDING DATABASE!)"
echo "- All unused networks"
echo "- All build cache"
echo ""
read -p "Are you sure? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "💣 Nuking Docker..."
    
    # Stop everything
    sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
    
    # Remove everything
    sudo docker system prune -af --volumes
    sudo docker image prune -af  
    sudo docker container prune -f
    sudo docker volume prune -f
    sudo docker network prune -f
    sudo docker builder prune -af
    
    echo "💥 Docker nuked! Everything is clean."
    echo "ℹ️  Next build will download everything from scratch."
else
    echo "❌ Cleanup cancelled"
fi