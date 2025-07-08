#!/bin/bash

# Hitmanki.store Secrets Generator
# This script generates secure passwords and secrets for configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Генератор секретов для Hitmanki.store${NC}"
echo

# Function to generate random password
generate_password() {
    local length=${1:-32}
    tr -dc 'A-Za-z0-9!@#$%^&*()_+' < /dev/urandom | head -c $length
}

# Function to generate base64 key
generate_base64_key() {
    openssl rand -base64 32
}

# Function to generate hex key
generate_hex_key() {
    openssl rand -hex 32
}

echo -e "${BLUE}📝 Сгенерированные секреты:${NC}"
echo "════════════════════════════════════════════════════════════════"

# MongoDB password
MONGO_PASSWORD=$(generate_password 24)
echo -e "${GREEN}MongoDB пароль:${NC}"
echo "MONGO_ROOT_PASSWORD=$MONGO_PASSWORD"
echo

# MySQL password
MYSQL_PASSWORD=$(generate_password 24)
echo -e "${GREEN}MySQL пароль:${NC}"
echo "MYSQL_PASSWORD=$MYSQL_PASSWORD"
echo

# JWT Secret
JWT_SECRET=$(generate_password 48)
echo -e "${GREEN}JWT секрет:${NC}"
echo "JWT_SECRET=$JWT_SECRET"
echo

# Server Seed Secret
SERVER_SEED=$(generate_password 48)
echo -e "${GREEN}Server Seed секрет:${NC}"
echo "SERVER_SEED_SECRET=$SERVER_SEED"
echo

# Laravel APP_KEY equivalent
APP_KEY_RAW=$(generate_base64_key)
echo -e "${GREEN}Laravel APP_KEY:${NC}"
echo "APP_KEY=base64:$APP_KEY_RAW"
echo

# Laravel ADMIN_APP_KEY equivalent
ADMIN_APP_KEY_RAW=$(generate_base64_key)
echo -e "${GREEN}Laravel ADMIN_APP_KEY:${NC}"
echo "ADMIN_APP_KEY=base64:$ADMIN_APP_KEY_RAW"
echo

# Session secret
SESSION_SECRET=$(generate_hex_key)
echo -e "${GREEN}Session секрет:${NC}"
echo "SESSION_SECRET=$SESSION_SECRET"
echo

# Redis password
REDIS_PASSWORD=$(generate_password 20)
echo -e "${GREEN}Redis пароль:${NC}"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo

echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}💡 Инструкции:${NC}"
echo "1. Скопируйте значения выше в ваш .env файл"
echo "2. Обязательно добавьте ваш STEAM_API_KEY"
echo "3. Сохраните эти секреты в надежном месте"
echo

# Option to automatically update .env file
if [ -f ".env" ]; then
    echo -e "${BLUE}🔄 Автоматическое обновление .env файла${NC}"
    read -p "Обновить .env файл автоматически? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create backup
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✅ Создана резервная копия .env файла${NC}"
        
        # Update passwords in .env file
        sed -i "s/^MONGO_ROOT_PASSWORD=.*/MONGO_ROOT_PASSWORD=$MONGO_PASSWORD/" .env
        sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$MYSQL_PASSWORD/" .env
        sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/^SERVER_SEED_SECRET=.*/SERVER_SEED_SECRET=$SERVER_SEED/" .env
        sed -i "s/^APP_KEY=.*/APP_KEY=base64:$APP_KEY_RAW/" .env
        sed -i "s/^ADMIN_APP_KEY=.*/ADMIN_APP_KEY=base64:$ADMIN_APP_KEY_RAW/" .env
        sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
        
        # Add Redis password if not exists
        if ! grep -q "REDIS_PASSWORD=" .env; then
            echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env
        else
            sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
        fi
        
        echo -e "${GREEN}✅ .env файл обновлен с новыми секретами${NC}"
        echo -e "${YELLOW}⚠️  Не забудьте добавить STEAM_API_KEY!${NC}"
    else
        echo -e "${YELLOW}Ручное обновление: скопируйте значения выше в .env файл${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env файл не найден. Создайте его из .env.production${NC}"
    echo "   cp .env.production .env"
fi

echo
echo -e "${BLUE}🔍 Проверьте конфигурацию:${NC}"
echo "./check-config.sh"
echo
echo -e "${GREEN}🎉 Секреты сгенерированы успешно!${NC}"