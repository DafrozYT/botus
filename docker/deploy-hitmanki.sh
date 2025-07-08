#!/bin/bash

# Hitmanki.store Production Deployment Script
# This script handles the complete deployment of the case opening platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="hitmanki.store"
SUBDOMAINS=("admin" "api")
PROJECT_DIR="/opt/hitmanki"
BACKUP_DIR="/opt/hitmanki-backups"
COMPOSE_FILE="docker-compose.production.yml"

echo -e "${BLUE}🚀 Starting Hitmanki.store deployment...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found, copying from .env.production"
    cp .env.production .env
    print_warning "Please edit .env file with your production values before continuing"
    read -p "Press Enter to continue after editing .env file..."
fi

# Validate required environment variables
print_status "Validating environment variables..."
source .env

required_vars=("STEAM_API_KEY" "JWT_SECRET" "MONGO_ROOT_PASSWORD" "MYSQL_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_actual_steam_api_key_here" ] || [ "${!var}" = "GENERATE_WITH_ARTISAN_KEY_GENERATE" ]; then
        print_error "Required environment variable $var is not set or has default value"
        exit 1
    fi
done

print_status "Environment variables validated"

# Check SSL certificates
print_status "Checking SSL certificates..."
if [ ! -f "ssl/${DOMAIN}.crt" ] || [ ! -f "ssl/${DOMAIN}.key" ]; then
    print_warning "SSL certificates not found"
    echo "Setting up SSL certificates with Let's Encrypt..."
    
    # Create SSL directory
    mkdir -p ssl
    
    # Stop nginx if running
    docker-compose -f $COMPOSE_FILE down nginx 2>/dev/null || true
    
    # Get certificates using certbot
    sudo certbot certonly --standalone \
        -d $DOMAIN \
        -d admin.$DOMAIN \
        -d api.$DOMAIN \
        --agree-tos \
        --no-eff-email \
        --email admin@$DOMAIN
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/$DOMAIN.crt
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/$DOMAIN.key
    sudo chown $USER:$USER ssl/$DOMAIN.*
    
    print_status "SSL certificates configured"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl mongo redis mysql

# Create backup before deployment
if [ -d "$BACKUP_DIR" ]; then
    print_status "Creating backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_name="hitmanki_backup_$timestamp"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR/$backup_name"
    
    # Backup databases
    if docker ps | grep -q hitmanki_mongo; then
        docker exec hitmanki_mongo_prod mongodump --archive="$BACKUP_DIR/$backup_name/mongodb.archive" --gzip
        print_status "MongoDB backup created"
    fi
    
    if docker ps | grep -q hitmanki_mysql; then
        docker exec hitmanki_mysql_prod mysqldump --all-databases --routines --triggers > "$BACKUP_DIR/$backup_name/mysql.sql"
        print_status "MySQL backup created"
    fi
fi

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Build custom images
print_status "Building application images..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Start services
print_status "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check service health
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE ps $service | grep -q "Up"; then
            print_status "$service is running"
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service failed to start"
    return 1
}

# Check all services
services=("mongodb" "redis" "mysql" "backend" "frontend" "admin" "nginx")
for service in "${services[@]}"; do
    check_service $service
done

# Run database migrations
print_status "Running database migrations..."
docker-compose -f $COMPOSE_FILE exec -T frontend php artisan migrate --force
docker-compose -f $COMPOSE_FILE exec -T admin php artisan migrate --force

# Optimize Laravel applications
print_status "Optimizing Laravel applications..."
docker-compose -f $COMPOSE_FILE exec -T frontend php artisan config:cache
docker-compose -f $COMPOSE_FILE exec -T frontend php artisan route:cache
docker-compose -f $COMPOSE_FILE exec -T frontend php artisan view:cache

docker-compose -f $COMPOSE_FILE exec -T admin php artisan config:cache
docker-compose -f $COMPOSE_FILE exec -T admin php artisan route:cache
docker-compose -f $COMPOSE_FILE exec -T admin php artisan view:cache

# Test endpoints
print_status "Testing endpoints..."
test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "https://$url" | grep -q "200\|301\|302"; then
        print_status "$name is accessible"
    else
        print_warning "$name may not be accessible"
    fi
}

test_endpoint "$DOMAIN" "Frontend"
test_endpoint "admin.$DOMAIN" "Admin Panel"
test_endpoint "api.$DOMAIN/api/health" "Backend API"

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/hitmanki > /dev/null <<EOF
$PWD/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f $PWD/$COMPOSE_FILE restart nginx
    endscript
}
EOF

# Setup SSL renewal cron job
print_status "Setting up SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd $PWD && docker-compose -f $COMPOSE_FILE restart nginx'") | crontab -

# Display final status
echo
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "Frontend: ${GREEN}https://$DOMAIN${NC}"
echo -e "Admin Panel: ${GREEN}https://admin.$DOMAIN${NC}"
echo -e "API: ${GREEN}https://api.$DOMAIN${NC}"

echo
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Configure Steam API key in .env file"
echo "2. Setup payment processors (Stripe, etc.)"
echo "3. Create admin user via admin panel"
echo "4. Configure case data and items"
echo "5. Setup monitoring and alerts"

echo
echo -e "${YELLOW}📋 Useful Commands:${NC}"
echo "View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
echo "Stop all: docker-compose -f $COMPOSE_FILE down"
echo "Update: ./deploy-hitmanki.sh"

print_status "Hitmanki.store is now live! 🚀"