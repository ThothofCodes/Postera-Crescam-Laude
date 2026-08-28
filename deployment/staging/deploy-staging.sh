#!/bin/bash
# ============================================================================
# Staging Environment Deployment Script
# ============================================================================
# This script manages the staging environment deployment.
# It sets up the staging MongoDB, deploys services, and runs migrations.
#
# Usage:
#   ./deploy-staging.sh <command> [options]
#
# Commands:
#   setup       Initial setup (create .env, run migrations, seed data)
#   start       Start all staging services
#   stop        Stop all staging services
#   restart     Restart all staging services
#   status      Show staging environment status
#   logs        View staging service logs
#   deploy      Deploy new version to staging
#   migrate     Run database migrations
#   seed        Seed database with test data
#   reset       Reset staging database (WARNING: destroys data)
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}]")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
STAGING_DIR="$SCRIPT_DIR"
DOCKER_COMPOSE_FILE="$STAGING_DIR/docker-compose.staging.yml"
ENV_FILE="$STAGING_DIR/.env.staging"
PROJECT_ENV_FILE="$PROJECT_ROOT/backend/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

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

# ============================================================================
# Environment Setup
# ============================================================================

setup_environment() {
    log_info "Setting up staging environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Creating .env.staging from template..."
        cp "$STAGING_DIR/.env.staging.template" "$ENV_FILE"
        log_warning "Please edit $ENV_FILE with your staging configuration"
    fi
    
    # Copy .env to backend if needed
    if [ ! -f "$PROJECT_ENV_FILE" ] || ! grep -q "staging" "$PROJECT_ENV_FILE"; then
        log_info "Updating backend .env for staging..."
        cp "$ENV_FILE" "$PROJECT_ENV_FILE"
    fi
    
    log_success "Environment setup complete"
}

# ============================================================================
# Database Operations
# ============================================================================

run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Run migrations
    if node migrations/migrate.js up; then
        log_success "Migrations completed successfully"
    else
        log_error "Migrations failed"
        return 1
    fi
    
    cd "$STAGING_DIR"
}

seed_database() {
    log_info "Seeding staging database..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Run staging seed
    if node seeds/seed-dev.js; then
        log_success "Database seeded successfully"
    else
        log_error "Database seeding failed"
        return 1
    fi
    
    cd "$STAGING_DIR"
}

reset_database() {
    log_warning "WARNING: This will destroy all staging data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        log_info "Resetting staging database..."
        
        # Drop database
        docker exec -i mongo-staging mongosh --eval "db.dropDatabase()" pcl_staging
        
        # Re-run migrations and seed
        run_migrations
        seed_database
        
        log_success "Database reset complete"
    else
        log_info "Database reset cancelled"
    fi
}

# ============================================================================
# Service Management
# ============================================================================

start_services() {
    log_info "Starting staging services..."
    
    cd "$STAGING_DIR"
    
    # Start services
    if docker-compose -f "$DOCKER_COMPOSE_FILE" up -d; then
        log_success "Staging services started"
        
        # Wait for services to be healthy
        log_info "Waiting for services to be healthy..."
        sleep 10
        
        # Check health
        check_services_health
    else
        log_error "Failed to start staging services"
        return 1
    fi
}

stop_services() {
    log_info "Stopping staging services..."
    
    cd "$STAGING_DIR"
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" down; then
        log_success "Staging services stopped"
    else
        log_error "Failed to stop staging services"
        return 1
    fi
}

restart_services() {
    log_info "Restarting staging services..."
    
    stop_services
    start_services
}

# ============================================================================
# Health Checks
# ============================================================================

check_services_health() {
    log_info "Checking service health..."
    
    local services=(
        "backend-staging:5001:/api/health"
        "frontend-staging:80:/"
        "techhub-staging:80:/"
        "mongo-staging:27017"
        "redis-staging:6379"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port path <<< "$service"
        
        if [ -n "$path" ]; then
            if curl -sf "http://localhost:$port$path" > /dev/null 2>&1; then
                log_success "$name is healthy"
            else
                log_warning "$name is not responding"
            fi
        else
            # For TCP services, just check if port is open
            if nc -z localhost "$port" 2>/dev/null; then
                log_success "$name is listening on port $port"
            else
                log_warning "$name is not listening on port $port"
            fi
        fi
    done
}

# ============================================================================
# Deployment
# ============================================================================

deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Stop existing services
    stop_services
    
    # Rebuild and start
    cd "$STAGING_DIR"
    
    # Build new images
    log_info "Building new images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Start services
    start_services
    
    # Run migrations
    run_migrations
    
    # Seed database if needed
    seed_database
    
    log_success "Staging deployment complete"
}

# ============================================================================
# Logs
# ============================================================================

view_logs() {
    local service=${1:-""}
    
    cd "$STAGING_DIR"
    
    if [ -n "$service" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f "$service"
    else
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
    fi
}

# ============================================================================
# Status
# ============================================================================

show_status() {
    log_info "Staging environment status:"
    
    cd "$STAGING_DIR"
    
    # Show running containers
    echo ""
    echo "============================================================================"
    echo "                    Staging Environment Status"
    echo "============================================================================"
    echo ""
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    echo "============================================================================"
    echo ""
    
    # Check health
    check_services_health
    
    echo ""
    echo "  Access URLs:"
    echo "    Frontend:  http://localhost:3010"
    echo "    Backend:   http://localhost:5010/api/health"
    echo "    Tech Hub:  http://localhost:4330"
    echo "    Grafana:   http://localhost:3002"
    echo "    Prometheus: http://localhost:9090"
    echo ""
    echo "============================================================================"
    echo ""
}

# ============================================================================
# Main Command Handler
# ============================================================================

case "${1:-help}" in
    setup)
        setup_environment
        ;;
    
    start)
        start_services
        ;;
    
    stop)
        stop_services
        ;;
    
    restart)
        restart_services
        ;;
    
    status)
        show_status
        ;;
    
    logs)
        view_logs "${2:-}"
        ;;
    
    deploy)
        deploy_staging
        ;;
    
    migrate)
        run_migrations
        ;;
    
    seed)
        seed_database
        ;;
    
    reset)
        reset_database
        ;;
    
    health)
        check_services_health
        ;;
    
    help|*)
        echo ""
        echo "============================================================================"
        echo "                    Staging Environment Deployment"
        echo "============================================================================"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  setup       Initial setup (create .env, run migrations, seed data)"
        echo "  start       Start all staging services"
        echo "  stop        Stop all staging services"
        echo "  restart     Restart all staging services"
        echo "  status      Show staging environment status"
        echo "  logs [svc]  View staging service logs (optional: specify service)"
        echo "  deploy      Deploy new version to staging"
        echo "  migrate     Run database migrations"
        echo "  seed        Seed database with test data"
        echo "  reset       Reset staging database (WARNING: destroys data)"
        echo "  health      Check service health"
        echo "  help        Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 setup           # Initial setup"
        echo "  $0 start           # Start staging"
        echo "  $0 deploy          # Deploy new version"
        echo "  $0 logs backend-staging  # View backend logs"
        echo ""
        echo "============================================================================"
        echo ""
        ;;
esac
