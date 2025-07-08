#!/bin/bash

# Hitmanki.store Configuration Checker
# This script validates all configuration before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Проверка конфигурации Hitmanki.store...${NC}"
echo

# Function to print status
print_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration check results
ERRORS=0
WARNINGS=0

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env файл не найден"
    echo "   Выполните: cp .env.production .env"
    ((ERRORS++))
else
    print_ok ".env файл найден"
    source .env
fi

echo -e "\n${BLUE}📋 Проверка обязательных параметров...${NC}"

# Check Steam API Key
if [ -z "$STEAM_API_KEY" ] || [ "$STEAM_API_KEY" = "your_actual_steam_api_key_here" ]; then
    print_error "STEAM_API_KEY не настроен"
    echo "   Получите ключ на: https://steamcommunity.com/dev/apikey"
    ((ERRORS++))
else
    print_ok "STEAM_API_KEY настроен"
fi

# Check database passwords
if [ -z "$MONGO_ROOT_PASSWORD" ] || [ "$MONGO_ROOT_PASSWORD" = "hitmanki_mongo_secure_2024_!@#" ]; then
    print_error "MONGO_ROOT_PASSWORD использует значение по умолчанию"
    echo "   Создайте уникальный пароль для MongoDB"
    ((ERRORS++))
else
    print_ok "MONGO_ROOT_PASSWORD настроен"
fi

if [ -z "$MYSQL_PASSWORD" ] || [ "$MYSQL_PASSWORD" = "hitmanki_mysql_laravel_2024_!@#" ]; then
    print_error "MYSQL_PASSWORD использует значение по умолчанию"
    echo "   Создайте уникальный пароль для MySQL"
    ((ERRORS++))
else
    print_ok "MYSQL_PASSWORD настроен"
fi

# Check JWT secret
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "hitmanki_jwt_super_secret_production_2024_change_me" ]; then
    print_error "JWT_SECRET использует значение по умолчанию"
    echo "   Создайте уникальный JWT секрет (минимум 32 символа)"
    ((ERRORS++))
else
    if [ ${#JWT_SECRET} -lt 32 ]; then
        print_warning "JWT_SECRET слишком короткий (рекомендуется минимум 32 символа)"
        ((WARNINGS++))
    else
        print_ok "JWT_SECRET настроен"
    fi
fi

# Check Server Seed Secret
if [ -z "$SERVER_SEED_SECRET" ] || [ "$SERVER_SEED_SECRET" = "hitmanki_provably_fair_production_secret_2024" ]; then
    print_error "SERVER_SEED_SECRET использует значение по умолчанию"
    echo "   Создайте уникальный секрет для Provably Fair"
    ((ERRORS++))
else
    print_ok "SERVER_SEED_SECRET настроен"
fi

# Check Laravel APP_KEY
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:GENERATE_WITH_ARTISAN_KEY_GENERATE" ]; then
    print_error "APP_KEY не сгенерирован"
    echo "   Выполните: cd ../frontend && php artisan key:generate --show"
    ((ERRORS++))
else
    print_ok "APP_KEY настроен"
fi

if [ -z "$ADMIN_APP_KEY" ] || [ "$ADMIN_APP_KEY" = "base64:GENERATE_WITH_ARTISAN_KEY_GENERATE" ]; then
    print_error "ADMIN_APP_KEY не сгенерирован"
    echo "   Выполните: cd ../admin && php artisan key:generate --show"
    ((ERRORS++))
else
    print_ok "ADMIN_APP_KEY настроен"
fi

echo -e "\n${BLUE}🌐 Проверка DNS настроек...${NC}"

# Check DNS resolution
domains=("hitmanki.store" "admin.hitmanki.store" "api.hitmanki.store")
for domain in "${domains[@]}"; do
    if nslookup "$domain" > /dev/null 2>&1; then
        print_ok "$domain резолвится"
    else
        print_warning "$domain не резолвится"
        echo "   Настройте DNS записи у вашего провайдера"
        ((WARNINGS++))
    fi
done

echo -e "\n${BLUE}🔧 Проверка системных требований...${NC}"

# Check Docker
if command -v docker &> /dev/null; then
    print_ok "Docker установлен ($(docker --version))"
else
    print_error "Docker не установлен"
    echo "   Выполните: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    ((ERRORS++))
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    print_ok "Docker Compose установлен"
else
    print_error "Docker Compose не установлен"
    echo "   Выполните: sudo apt install docker-compose-plugin"
    ((ERRORS++))
fi

# Check available disk space
available_space=$(df . | tail -1 | awk '{print $4}')
required_space=10485760  # 10GB in KB

if [ "$available_space" -gt "$required_space" ]; then
    print_ok "Достаточно места на диске ($(( available_space / 1024 / 1024 )) GB доступно)"
else
    print_warning "Мало места на диске ($(( available_space / 1024 / 1024 )) GB доступно, рекомендуется минимум 10 GB)"
    ((WARNINGS++))
fi

# Check RAM
total_ram=$(free -m | awk 'NR==2{print $2}')
if [ "$total_ram" -gt 3500 ]; then
    print_ok "Достаточно RAM ($total_ram MB)"
else
    print_warning "Мало RAM ($total_ram MB, рекомендуется минимум 4 GB)"
    ((WARNINGS++))
fi

echo -e "\n${BLUE}📁 Проверка файловой структуры...${NC}"

# Check required directories
required_dirs=("../backend" "../frontend" "../admin")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_ok "Директория $dir существует"
    else
        print_error "Директория $dir не найдена"
        ((ERRORS++))
    fi
done

# Check required files
required_files=("docker-compose.production.yml" "nginx.conf" "deploy-hitmanki.sh")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_ok "Файл $file существует"
    else
        print_error "Файл $file не найден"
        ((ERRORS++))
    fi
done

# Check if necessary directories exist
if [ ! -d "ssl" ]; then
    print_warning "Директория ssl не существует"
    echo "   Будет создана автоматически при развертывании"
    ((WARNINGS++))
else
    print_ok "Директория ssl существует"
fi

if [ ! -d "logs" ]; then
    print_warning "Директория logs не существует"
    echo "   Будет создана автоматически при развертывании"
    ((WARNINGS++))
else
    print_ok "Директория logs существует"
fi

echo -e "\n${BLUE}🔐 Проверка безопасности...${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Вы запущены под root пользователем"
    echo "   Рекомендуется создать отдельного пользователя"
    ((WARNINGS++))
else
    print_ok "Запущено под обычным пользователем"
fi

# Check if user is in docker group
if groups | grep -q "docker"; then
    print_ok "Пользователь в группе docker"
else
    print_warning "Пользователь не в группе docker"
    echo "   Выполните: sudo usermod -aG docker \$USER && перезайдите в систему"
    ((WARNINGS++))
fi

echo -e "\n${BLUE}📧 Проверка опциональных настроек...${NC}"

# Check email configuration
if [ -n "$MAIL_USERNAME" ] && [ "$MAIL_USERNAME" != "noreply@hitmanki.store" ]; then
    if [ -n "$MAIL_PASSWORD" ] && [ "$MAIL_PASSWORD" != "your_email_password" ]; then
        print_ok "Email настройки конфигурированы"
    else
        print_warning "Email username настроен, но пароль по умолчанию"
        ((WARNINGS++))
    fi
else
    print_warning "Email настройки не конфигурированы"
    echo "   Email уведомления не будут работать"
    ((WARNINGS++))
fi

# Check payment configuration
if [ -n "$STRIPE_PUBLIC_KEY" ] && [ "$STRIPE_PUBLIC_KEY" != "pk_live_your_stripe_public_key" ]; then
    if [ -n "$STRIPE_SECRET_KEY" ] && [ "$STRIPE_SECRET_KEY" != "sk_live_your_stripe_secret_key" ]; then
        print_ok "Stripe платежи настроены"
    else
        print_warning "Stripe публичный ключ настроен, но секретный ключ по умолчанию"
        ((WARNINGS++))
    fi
else
    print_warning "Stripe платежи не настроены"
    echo "   Пополнение баланса не будет работать"
    ((WARNINGS++))
fi

# Summary
echo -e "\n${BLUE}📊 Результат проверки:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Отлично! Все проверки пройдены успешно.${NC}"
    echo -e "${GREEN}✅ Конфигурация готова к развертыванию.${NC}"
    echo
    echo -e "${BLUE}Для развертывания выполните:${NC}"
    echo -e "${YELLOW}./deploy-hitmanki.sh${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Конфигурация готова к развертыванию с предупреждениями.${NC}"
    echo -e "${YELLOW}Предупреждений: $WARNINGS${NC}"
    echo
    echo -e "${BLUE}Рекомендуется исправить предупреждения, но развертывание возможно:${NC}"
    echo -e "${YELLOW}./deploy-hitmanki.sh${NC}"
else
    echo -e "${RED}❌ Найдены критические ошибки конфигурации.${NC}"
    echo -e "${RED}Ошибок: $ERRORS${NC}"
    echo -e "${YELLOW}Предупреждений: $WARNINGS${NC}"
    echo
    echo -e "${RED}Исправьте все ошибки перед развертыванием!${NC}"
    exit 1
fi

echo
echo -e "${BLUE}💡 Полезные команды:${NC}"
echo "Редактировать конфигурацию: nano .env"
echo "Проверить DNS: nslookup hitmanki.store"
echo "Сгенерировать Laravel ключ: cd ../frontend && php artisan key:generate --show"
echo "Получить Steam API ключ: https://steamcommunity.com/dev/apikey"

exit 0