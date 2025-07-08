#!/bin/bash

# Hitmanki.store VDS Setup Script
# Автоматическая настройка чистого VDS сервера для платформы hitmanki.store

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PROJECT_USER="hitmanki"
PROJECT_REPO="https://github.com/ваш-пользователь/hitmanki-cases.git"
SSH_PORT=22
TIMEZONE="Europe/Moscow"

echo -e "${BLUE}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    HITMANKI.STORE VDS SETUP                      ║"
echo "║              Автоматическая настройка сервера                    ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print status
print_step() {
    echo -e "\n${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Этот скрипт должен быть запущен под root"
        echo "Выполните: sudo bash setup-vds.sh"
        exit 1
    fi
}

# Function to get server info
show_server_info() {
    print_step "Информация о сервере"
    echo "Операционная система: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
    echo "CPU ядра: $(nproc)"
    echo "RAM: $(free -h | awk 'NR==2{print $2}')"
    echo "Диск: $(df -h / | awk 'NR==2{print $2}')"
    echo "IP адрес: $(curl -s ifconfig.me || echo 'Недоступен')"
    echo
}

# Function to update system
update_system() {
    print_step "Обновление системы"
    apt update -qq
    apt upgrade -y -qq
    apt install -y curl wget git nano htop unzip software-properties-common \
        apt-transport-https ca-certificates gnupg lsb-release dnsutils ufw
    print_success "Система обновлена"
}

# Function to setup timezone and locale
setup_locale() {
    print_step "Настройка временной зоны и локали"
    timedatectl set-timezone $TIMEZONE
    locale-gen ru_RU.UTF-8 2>/dev/null || true
    update-locale LANG=ru_RU.UTF-8 2>/dev/null || true
    print_success "Временная зона установлена: $TIMEZONE"
}

# Function to create user
create_user() {
    print_step "Создание пользователя $PROJECT_USER"
    
    if id "$PROJECT_USER" &>/dev/null; then
        print_warning "Пользователь $PROJECT_USER уже существует"
        return
    fi
    
    echo -e "${YELLOW}Введите пароль для пользователя $PROJECT_USER:${NC}"
    adduser --gecos "" $PROJECT_USER
    usermod -aG sudo $PROJECT_USER
    
    print_success "Пользователь $PROJECT_USER создан"
}

# Function to setup SSH security
setup_ssh_security() {
    print_step "Настройка безопасности SSH"
    
    # Backup original config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Update SSH config
    cat > /etc/ssh/sshd_config.new << EOF
# Hitmanki.store SSH Configuration
Port $SSH_PORT
Protocol 2

# Authentication
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Security
AllowUsers $PROJECT_USER
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Logging
SyslogFacility AUTH
LogLevel INFO

# Feature restrictions
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
PrintMotd no
EOF
    
    mv /etc/ssh/sshd_config.new /etc/ssh/sshd_config
    systemctl restart sshd
    
    print_success "SSH настроен безопасно"
}

# Function to setup firewall
setup_firewall() {
    print_step "Настройка файрвола"
    
    # Reset UFW
    ufw --force reset >/dev/null
    
    # Default policies
    ufw default deny incoming >/dev/null
    ufw default allow outgoing >/dev/null
    
    # Allow SSH
    ufw allow $SSH_PORT/tcp >/dev/null
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp >/dev/null
    ufw allow 443/tcp >/dev/null
    
    # Enable firewall
    ufw --force enable >/dev/null
    
    print_success "Файрвол настроен и активирован"
}

# Function to disable unnecessary services
disable_services() {
    print_step "Отключение ненужных сервисов"
    
    services_to_disable=("apache2" "mysql" "postgresql" "nginx")
    
    for service in "${services_to_disable[@]}"; do
        if systemctl is-active --quiet $service 2>/dev/null; then
            systemctl stop $service >/dev/null 2>&1 || true
            systemctl disable $service >/dev/null 2>&1 || true
            echo "Остановлен: $service"
        fi
    done
    
    print_success "Ненужные сервисы отключены"
}

# Function to install Docker
install_docker() {
    print_step "Установка Docker"
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh >/dev/null
    rm get-docker.sh
    
    # Add user to docker group
    usermod -aG docker $PROJECT_USER
    
    # Install Docker Compose
    apt install -y docker-compose-plugin
    
    # Enable Docker
    systemctl enable docker
    systemctl start docker
    
    print_success "Docker установлен"
}

# Function to setup project directory
setup_project() {
    print_step "Настройка проекта"
    
    # Switch to project user
    sudo -u $PROJECT_USER bash << EOF
cd /home/$PROJECT_USER

# Clone repository
if [ ! -d "hitmanki-cases" ]; then
    echo "Клонирование репозитория..."
    git clone $PROJECT_REPO
else
    echo "Репозиторий уже существует"
fi

cd hitmanki-cases
chmod +x docker/*.sh

# Create necessary directories
mkdir -p docker/ssl docker/logs
chmod 755 docker/ssl docker/logs

# Copy environment template
cd docker
if [ ! -f ".env" ]; then
    cp .env.production .env
fi
EOF
    
    print_success "Проект настроен"
}

# Function to show next steps
show_next_steps() {
    echo -e "\n${GREEN}${BOLD}🎉 Базовая настройка VDS завершена!${NC}\n"
    
    echo -e "${BLUE}📋 Следующие шаги:${NC}"
    echo -e "${YELLOW}1.${NC} Настройте DNS записи:"
    echo "   A     hitmanki.store      → $(curl -s ifconfig.me)"
    echo "   CNAME admin.hitmanki.store → hitmanki.store"
    echo "   CNAME api.hitmanki.store   → hitmanki.store"
    echo
    echo -e "${YELLOW}2.${NC} Получите Steam API ключ:"
    echo "   https://steamcommunity.com/dev/apikey"
    echo
    echo -e "${YELLOW}3.${NC} Переключитесь на пользователя $PROJECT_USER:"
    echo -e "${GREEN}   su - $PROJECT_USER${NC}"
    echo
    echo -e "${YELLOW}4.${NC} Перейдите в проект и настройте конфигурацию:"
    echo -e "${GREEN}   cd ~/hitmanki-cases/docker${NC}"
    echo -e "${GREEN}   ./generate-secrets.sh${NC}"
    echo -e "${GREEN}   nano .env${NC}"
    echo
    echo -e "${YELLOW}5.${NC} Проверьте конфигурацию:"
    echo -e "${GREEN}   ./check-config.sh${NC}"
    echo
    echo -e "${YELLOW}6.${NC} Разверните платформу:"
    echo -e "${GREEN}   ./deploy-hitmanki.sh${NC}"
    echo
    echo -e "${BLUE}💡 Полная документация:${NC}"
    echo "   - VDS_INSTALL.md - Подробное руководство"
    echo "   - QUICK_START.md - Быстрый запуск"
    echo "   - INSTALL.md     - Пошаговая установка"
    echo
    echo -e "${GREEN}🔗 Результат:${NC}"
    echo "   Frontend: https://hitmanki.store"
    echo "   Admin:    https://admin.hitmanki.store"
    echo "   API:      https://api.hitmanki.store"
}

# Function to create monitoring script
create_monitoring() {
    print_step "Создание скрипта мониторинга"
    
    sudo -u $PROJECT_USER bash << 'EOF'
cat > /home/hitmanki/monitor.sh << 'MONITOR_EOF'
#!/bin/bash

# Hitmanki.store Server Monitor

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    HITMANKI.STORE MONITOR                        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo

# Server Resources
echo "🖥️  РЕСУРСЫ СЕРВЕРА:"
echo "CPU: $(nproc) ядер"
echo "RAM: $(free -h | awk 'NR==2{printf "Использовано: %s / %s (%.1f%%)\n", $3, $2, $3/$2*100}')"
echo "Диск: $(df -h / | awk 'NR==2{printf "Использовано: %s / %s (%s)\n", $3, $2, $5}')"
echo "Uptime: $(uptime -p)"
echo

# Docker Services
echo "🐳 DOCKER СЕРВИСЫ:"
if [ -f "/home/hitmanki/hitmanki-cases/docker/docker-compose.production.yml" ]; then
    cd /home/hitmanki/hitmanki-cases/docker
    docker-compose -f docker-compose.production.yml ps
else
    echo "Проект еще не развернут"
fi
echo

# Network
echo "🌐 СЕТЬ:"
echo "Внешний IP: $(curl -s ifconfig.me || echo 'Недоступен')"
echo "DNS hitmanki.store: $(nslookup hitmanki.store 2>/dev/null | grep 'Address:' | tail -1 | awk '{print $2}' || echo 'Не настроен')"
echo

# SSL Certificates
echo "🔐 SSL СЕРТИФИКАТЫ:"
if [ -d "/etc/letsencrypt/live/hitmanki.store" ]; then
    echo "Статус: Установлены"
    echo "Срок действия: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/hitmanki.store/cert.pem 2>/dev/null | cut -d= -f2 || echo 'Неизвестно')"
else
    echo "Статус: Не установлены"
fi
echo

# Recent Logs
echo "📋 ПОСЛЕДНИЕ ЛОГИ:"
if [ -f "/home/hitmanki/hitmanki-cases/docker/docker-compose.production.yml" ]; then
    cd /home/hitmanki/hitmanki-cases/docker
    docker-compose -f docker-compose.production.yml logs --tail=5 2>/dev/null || echo "Сервисы не запущены"
else
    echo "Проект еще не развернут"
fi

echo "╚══════════════════════════════════════════════════════════════════╝"
MONITOR_EOF

chmod +x /home/hitmanki/monitor.sh
EOF
    
    print_success "Скрипт мониторинга создан: ~/monitor.sh"
}

# Main execution
main() {
    echo -e "${YELLOW}Этот скрипт выполнит автоматическую настройку VDS сервера для Hitmanki.store${NC}"
    echo -e "${YELLOW}Процесс займет 5-10 минут${NC}"
    echo
    read -p "Продолжить? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Установка отменена"
        exit 1
    fi
    
    echo -e "\n${BLUE}${BOLD}Начинаем настройку...${NC}\n"
    
    # Execute setup steps
    check_root
    show_server_info
    update_system
    setup_locale
    create_user
    setup_ssh_security
    setup_firewall
    disable_services
    install_docker
    setup_project
    create_monitoring
    
    show_next_steps
}

# Handle script interruption
trap 'echo -e "\n${RED}Установка прервана${NC}"; exit 1' INT

# Check if we can connect to internet
if ! curl -s --connect-timeout 5 google.com > /dev/null; then
    print_error "Нет подключения к интернету"
    exit 1
fi

# Run main function
main "$@"