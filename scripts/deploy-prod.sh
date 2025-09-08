#!/bin/bash

# Production Deployment Script for Кіт Кухар
# This script handles safe production deployment with rollback capability

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups/deploy-$(date +%Y%m%d-%H%M%S)"

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if docker and docker-compose are installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please copy .env.example to .env and configure your settings"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file $COMPOSE_FILE not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_backup() {
    log_info "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if running
    if docker-compose -f "$COMPOSE_FILE" ps database | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose -f "$COMPOSE_FILE" exec -T database pg_dump \
            -U kitkuhar_user kitkuhar > "$BACKUP_DIR/database_backup.sql"
    fi
    
    # Backup media files
    if [ -d "./media" ]; then
        log_info "Backing up media files..."
        cp -r ./media "$BACKUP_DIR/"
    fi
    
    # Backup current environment file
    cp "$ENV_FILE" "$BACKUP_DIR/"
    
    log_success "Backup created at $BACKUP_DIR"
}

validate_environment() {
    log_info "Validating environment configuration..."
    
    # Source environment file
    source "$ENV_FILE"
    
    # Check critical environment variables
    if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "your_super_secret_jwt_key_must_be_at_least_32_characters_long_and_random" ]; then
        log_error "SECRET_KEY is not set or using default value"
        log_info "Please set a secure SECRET_KEY in $ENV_FILE"
        exit 1
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_very_secure_database_password_here_min_20_chars" ]; then
        log_error "POSTGRES_PASSWORD is not set or using default value"
        exit 1
    fi
    
    if [ -z "$REDIS_PASSWORD" ] || [ "$REDIS_PASSWORD" = "your_very_secure_redis_password_here_min_20_chars" ]; then
        log_error "REDIS_PASSWORD is not set or using default value"
        exit 1
    fi
    
    if [ -z "$ALLOWED_ORIGINS" ]; then
        log_warning "ALLOWED_ORIGINS is not set - this may cause CORS issues"
    fi
    
    log_success "Environment validation passed"
}

build_images() {
    log_info "Building Docker images..."
    
    # Build images with no cache for production
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    log_success "Images built successfully"
}

deploy_services() {
    log_info "Deploying services..."
    
    # Pull latest images if any
    docker-compose -f "$COMPOSE_FILE" pull --ignore-pull-failures
    
    # Start services in the correct order
    log_info "Starting database and Redis..."
    docker-compose -f "$COMPOSE_FILE" up -d database redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    timeout 60 bash -c 'until docker-compose -f '"$COMPOSE_FILE"' exec -T database pg_isready -U kitkuhar_user -d kitkuhar; do sleep 2; done'
    
    # Wait for Redis to be ready
    log_info "Waiting for Redis to be ready..."
    timeout 30 bash -c 'until docker-compose -f '"$COMPOSE_FILE"' exec -T redis redis-cli ping | grep -q PONG; do sleep 2; done'
    
    # Start backend
    log_info "Starting backend..."
    docker-compose -f "$COMPOSE_FILE" up -d backend
    
    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    timeout 120 bash -c 'until curl -f http://localhost:8000/monitoring/health &>/dev/null; do sleep 5; done'
    
    # Start frontend and nginx
    log_info "Starting frontend and proxy..."
    docker-compose -f "$COMPOSE_FILE" up -d frontend nginx
    
    log_success "Services deployed successfully"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Check if all services are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_error "Some services are not running"
        docker-compose -f "$COMPOSE_FILE" ps
        exit 1
    fi
    
    # Check backend health
    if ! curl -f http://localhost:8000/monitoring/health &>/dev/null; then
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check if nginx is responding
    if ! curl -f http://localhost/health &>/dev/null; then
        log_error "Nginx health check failed"
        exit 1
    fi
    
    log_success "All health checks passed"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    log_success "Cleanup completed"
}

rollback() {
    log_error "Deployment failed. Rolling back..."
    
    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore backup if available
    if [ -d "$BACKUP_DIR" ]; then
        log_info "Restoring from backup..."
        
        # Restore database
        if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
            docker-compose -f "$COMPOSE_FILE" up -d database
            sleep 10
            docker-compose -f "$COMPOSE_FILE" exec -T database psql \
                -U kitkuhar_user -d kitkuhar < "$BACKUP_DIR/database_backup.sql"
        fi
        
        # Restore media files
        if [ -d "$BACKUP_DIR/media" ]; then
            rm -rf ./media
            cp -r "$BACKUP_DIR/media" ./
        fi
        
        # Restore environment file
        if [ -f "$BACKUP_DIR/$ENV_FILE" ]; then
            cp "$BACKUP_DIR/$ENV_FILE" ./
        fi
    fi
    
    log_error "Rollback completed. Please check the logs and fix the issues before retrying."
    exit 1
}

main() {
    log_info "Starting production deployment of Кіт Кухар..."
    
    # Set trap to handle failures
    trap rollback ERR
    
    check_prerequisites
    validate_environment
    create_backup
    build_images
    deploy_services
    run_health_checks
    cleanup_old_images
    
    log_success "Deployment completed successfully!"
    log_info "Application is now running at your configured domain"
    log_info "Backup created at: $BACKUP_DIR"
    
    # Show running services
    echo -e "\n${BLUE}Running services:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Show useful commands
    echo -e "\n${BLUE}Useful commands:${NC}"
    echo "View logs: docker-compose -f $COMPOSE_FILE logs -f [service_name]"
    echo "Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "View metrics: curl http://localhost/api/monitoring/metrics (admin only)"
}

# Run main function with all arguments
main "$@"