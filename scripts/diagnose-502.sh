#!/bin/bash

# 502 Error Diagnostics Script for Кіт Кухар
# This script helps diagnose and fix 502 Bad Gateway errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
DOMAIN="kitkuhar.com"
BACKEND_PORT="8000"
NGINX_PORT="80"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker_services() {
    log_info "Checking Docker services status..."
    
    if ! docker-compose ps | grep -q "Up"; then
        log_error "No Docker services are running!"
        log_info "Starting services..."
        docker-compose up -d
        sleep 30
    fi
    
    echo -e "\n${BLUE}Docker services status:${NC}"
    docker-compose ps
    
    # Check individual services
    local failed_services=()
    
    if ! docker-compose ps backend | grep -q "Up"; then
        failed_services+=("backend")
    fi
    
    if ! docker-compose ps frontend | grep -q "Up"; then
        failed_services+=("frontend")
    fi
    
    if ! docker-compose ps nginx | grep -q "Up"; then
        failed_services+=("nginx")
    fi
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "Failed services: ${failed_services[*]}"
        return 1
    fi
    
    log_success "All Docker services are running"
}

check_backend_health() {
    log_info "Checking backend health..."
    
    # Try to connect to backend directly
    if curl -f http://localhost:${BACKEND_PORT}/health &>/dev/null; then
        log_success "Backend is responding on port ${BACKEND_PORT}"
    else
        log_error "Backend is not responding on port ${BACKEND_PORT}"
        
        # Check backend container logs
        log_info "Backend container logs (last 20 lines):"
        docker-compose logs --tail=20 backend
        return 1
    fi
    
    # Try API endpoints
    if curl -f http://localhost:${BACKEND_PORT}/docs &>/dev/null; then
        log_success "Backend API docs accessible"
    else
        log_warning "Backend API docs not accessible"
    fi
}

check_nginx_config() {
    log_info "Checking Nginx configuration..."
    
    # Test nginx configuration
    if docker-compose exec nginx nginx -t &>/dev/null; then
        log_success "Nginx configuration is valid"
    else
        log_error "Nginx configuration is invalid"
        docker-compose exec nginx nginx -t
        return 1
    fi
    
    # Check if nginx can reach backend
    if docker-compose exec nginx wget --spider http://backend:8000/health &>/dev/null; then
        log_success "Nginx can reach backend service"
    else
        log_error "Nginx cannot reach backend service"
        log_info "Checking network connectivity..."
        docker-compose exec nginx nslookup backend || true
        return 1
    fi
}

check_network_connectivity() {
    log_info "Checking network connectivity..."
    
    # Check if services can communicate
    if docker-compose exec backend curl -f http://nginx/health &>/dev/null; then
        log_success "Backend can reach Nginx"
    else
        log_warning "Backend cannot reach Nginx (this might be normal)"
    fi
    
    # Check external connectivity
    if curl -I http://${DOMAIN} 2>/dev/null | head -1 | grep -q "502"; then
        log_error "Site returns 502 Bad Gateway"
    elif curl -I http://${DOMAIN} &>/dev/null; then
        log_success "Site is responding"
    else
        log_error "Site is not accessible"
    fi
}

check_logs() {
    log_info "Checking service logs for errors..."
    
    echo -e "\n${BLUE}Nginx error logs (last 10 lines):${NC}"
    docker-compose logs --tail=10 nginx | grep -i error || echo "No nginx errors found"
    
    echo -e "\n${BLUE}Backend error logs (last 10 lines):${NC}"
    docker-compose logs --tail=10 backend | grep -i error || echo "No backend errors found"
    
    echo -e "\n${BLUE}Database logs (last 5 lines):${NC}"
    docker-compose logs --tail=5 database || echo "Database service not found"
}

check_resources() {
    log_info "Checking system resources..."
    
    # Check disk space
    df -h . | tail -1 | awk '{print "Disk usage: " $5 " used, " $4 " available"}'
    
    # Check memory usage
    free -h | grep "Mem:" | awk '{print "Memory usage: " $3 "/" $2}'
    
    # Check Docker resources
    docker system df
}

suggest_fixes() {
    log_info "Suggested fixes for 502 errors:"
    
    echo -e "${YELLOW}1. Restart all services:${NC}"
    echo "   docker-compose down && docker-compose up -d"
    
    echo -e "${YELLOW}2. Check backend service specifically:${NC}"
    echo "   docker-compose restart backend"
    echo "   docker-compose logs -f backend"
    
    echo -e "${YELLOW}3. Rebuild services if code changed:${NC}"
    echo "   docker-compose up -d --build"
    
    echo -e "${YELLOW}4. Check environment variables:${NC}"
    echo "   docker-compose exec backend env | grep -E '(DATABASE_URL|SECRET_KEY)'"
    
    echo -e "${YELLOW}5. Manual health check:${NC}"
    echo "   curl -v http://localhost:8000/health"
    echo "   curl -v http://localhost/health"
    
    echo -e "${YELLOW}6. If all else fails - full reset:${NC}"
    echo "   docker-compose down -v"
    echo "   docker system prune -f"
    echo "   docker-compose up -d --build"
}

fix_common_issues() {
    log_info "Attempting to fix common issues..."
    
    # Restart backend service
    log_info "Restarting backend service..."
    docker-compose restart backend
    sleep 10
    
    # Check if it's working now
    if curl -f http://localhost:${BACKEND_PORT}/health &>/dev/null; then
        log_success "Backend restart fixed the issue!"
        
        # Restart nginx to clear any cached connections
        docker-compose restart nginx
        sleep 5
        
        if curl -I http://${DOMAIN} 2>/dev/null | head -1 | grep -q "200"; then
            log_success "Site is now working!"
            return 0
        fi
    fi
    
    # Try full service restart
    log_info "Trying full service restart..."
    docker-compose restart
    sleep 30
    
    if curl -f http://localhost:${BACKEND_PORT}/health &>/dev/null; then
        log_success "Full restart fixed the issue!"
        return 0
    fi
    
    log_warning "Automatic fixes didn't work. Manual intervention needed."
    return 1
}

main() {
    echo -e "${BLUE}=== Кіт Кухар 502 Error Diagnostics ===${NC}\n"
    
    # Run diagnostic checks
    local issues=0
    
    check_docker_services || ((issues++))
    echo
    
    check_backend_health || ((issues++))
    echo
    
    check_nginx_config || ((issues++))
    echo
    
    check_network_connectivity || ((issues++))
    echo
    
    check_logs
    echo
    
    check_resources
    echo
    
    if [ $issues -gt 0 ]; then
        log_error "Found $issues issue(s). Attempting fixes..."
        echo
        
        if fix_common_issues; then
            log_success "Issues resolved automatically!"
        else
            suggest_fixes
        fi
    else
        log_success "No obvious issues found. The 502 error might be intermittent."
        
        # Still try a gentle restart
        log_info "Performing preventive restart..."
        docker-compose restart nginx backend
    fi
    
    echo -e "\n${BLUE}Final status check:${NC}"
    sleep 5
    
    if curl -I http://${DOMAIN} 2>/dev/null | head -1; then
        log_info "Current site status shown above"
    else
        log_error "Site is still not accessible"
    fi
}

# Handle script arguments
case "${1:-}" in
    "logs")
        check_logs
        ;;
    "services")
        check_docker_services
        ;;
    "health")
        check_backend_health
        ;;
    "fix")
        fix_common_issues
        ;;
    *)
        main "$@"
        ;;
esac