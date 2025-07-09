#!/bin/bash

# CS:GO Case Opening Website - Автоустановщик для чистого VDS
# Поддерживаемые ОС: Ubuntu 20.04+, Debian 10+, CentOS 7+, RHEL 8+
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка прав root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Этот скрипт должен быть запущен с правами root"
        print_info "Используйте: sudo $0"
        exit 1
    fi
}

# Определение операционной системы
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Не удается определить операционную систему"
        exit 1
    fi
    
    print_info "Обнаружена ОС: $OS $VER"
}

# Обновление системы
update_system() {
    print_info "Обновление системы..."
    
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            apt-get update -y
            apt-get upgrade -y
            ;;
        *"CentOS"*|*"Red Hat"*|*"RHEL"*)
            yum update -y
            ;;
        *)
            print_error "Неподдерживаемая операционная система: $OS"
            exit 1
            ;;
    esac
    
    print_success "Система обновлена"
}

# Установка базовых пакетов
install_base_packages() {
    print_info "Установка базовых пакетов..."
    
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            apt-get install -y \
                curl \
                wget \
                git \
                nano \
                htop \
                unzip \
                software-properties-common \
                apt-transport-https \
                ca-certificates \
                gnupg \
                lsb-release \
                ufw \
                fail2ban \
                logrotate \
                cron \
                openssl
            ;;
        *"CentOS"*|*"Red Hat"*|*"RHEL"*)
            yum install -y \
                curl \
                wget \
                git \
                nano \
                htop \
                unzip \
                yum-utils \
                device-mapper-persistent-data \
                lvm2 \
                firewalld \
                fail2ban \
                logrotate \
                cronie \
                openssl
            ;;
    esac
    
    print_success "Базовые пакеты установлены"
}

# Установка Docker
install_docker() {
    print_info "Установка Docker..."
    
    # Удаление старых версий
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            apt-get remove -y docker docker-engine docker.io containerd runc || true
            ;;
        *"CentOS"*|*"Red Hat"*|*"RHEL"*)
            yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true
            ;;
    esac
    
    # Установка Docker
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            apt-get update -y
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        *"CentOS"*|*"Red Hat"*|*"RHEL"*)
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
    esac
    
    # Запуск и включение Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker установлен и запущен"
}

# Установка Docker Compose
install_docker_compose() {
    print_info "Установка Docker Compose..."
    
    # Получение последней версии
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Скачивание и установка
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Создание символической ссылки
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose установлен (версия: $COMPOSE_VERSION)"
}

# Установка Node.js (для разработки)
install_nodejs() {
    print_info "Установка Node.js..."
    
    # Установка NodeSource репозитория
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            apt-get install -y nodejs
            ;;
        *"CentOS"*|*"Red Hat"*|*"RHEL"*)
            yum install -y nodejs npm
            ;;
    esac
    
    print_success "Node.js установлен (версия: $(node --version))"
}

# Настройка firewall
configure_firewall() {
    print_info "Настройка firewall..."
    
    case $OS in
        *"Ubuntu"*|*"Debian"*)
            # Настройка UFW
            ufw --force reset
            ufw default deny incoming
            ufw default allow outgoing
            
            # Разрешение SSH
            ufw allow 22/tcp
            
            # Разрешение HTTP/HTTPS
            ufw allow 80/tcp
            ufw allow 443/tcp
            
            # Блокировка прямого доступа к внутренним портам
            ufw deny 3000/tcp
            ufw deny 5000/tcp
            ufw deny 3306/tcp
            ufw deny 6379/tcp
            
            # Включение firewall
            ufw --force enable
            ;;
        *"CentOS"*|*"Red Hat"*|*"RHEL"*)
            # Настройка firewalld
            systemctl start firewalld
            systemctl enable firewalld
            
            # Настройка правил
            firewall-cmd --permanent --add-service=ssh
            firewall-cmd --permanent --add-service=http
            firewall-cmd --permanent --add-service=https
            firewall-cmd --reload
            ;;
    esac
    
    print_success "Firewall настроен"
}

# Настройка fail2ban
configure_fail2ban() {
    print_info "Настройка fail2ban..."
    
    # Создание конфигурации jail.local
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    # Запуск fail2ban
    systemctl start fail2ban
    systemctl enable fail2ban
    
    print_success "Fail2ban настроен"
}

# Создание пользователя для приложения
create_app_user() {
    print_info "Создание пользователя для приложения..."
    
    # Создание пользователя csgo-app
    if ! id "csgo-app" &>/dev/null; then
        useradd -m -s /bin/bash csgo-app
        usermod -aG docker csgo-app
        
        # Создание SSH ключей
        sudo -u csgo-app ssh-keygen -t rsa -b 4096 -f /home/csgo-app/.ssh/id_rsa -N ""
        
        print_success "Пользователь csgo-app создан"
    else
        print_info "Пользователь csgo-app уже существует"
    fi
}

# Создание директории проекта
create_project_directory() {
    print_info "Создание директории проекта..."
    
    # Создание директории
    mkdir -p /opt/csgo-case-opening
    chown csgo-app:csgo-app /opt/csgo-case-opening
    
    # Создание директорий для логов и данных
    mkdir -p /var/log/csgo-case-opening
    mkdir -p /var/lib/csgo-case-opening
    chown csgo-app:csgo-app /var/log/csgo-case-opening
    chown csgo-app:csgo-app /var/lib/csgo-case-opening
    
    print_success "Директории созданы"
}

# Скачивание проекта
download_project() {
    print_info "Скачивание проекта..."
    
    # Переключение на пользователя csgo-app
    cd /opt/csgo-case-opening
    
    # Копирование файлов из текущей директории (если запускаем из папки проекта)
    if [ -f "./docker-compose.yml" ]; then
        print_info "Копирование файлов проекта..."
        cp -r ./* /opt/csgo-case-opening/
        chown -R csgo-app:csgo-app /opt/csgo-case-opening/
    else
        print_warning "Файлы проекта не найдены в текущей директории"
        print_info "Пожалуйста, скопируйте файлы проекта в /opt/csgo-case-opening/"
    fi
    
    print_success "Проект подготовлен"
}

# Настройка SSL сертификата
setup_ssl() {
    print_info "Настройка SSL сертификата..."
    
    # Создание директории для SSL
    mkdir -p /opt/csgo-case-opening/nginx/ssl
    
    # Создание самоподписанного сертификата
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /opt/csgo-case-opening/nginx/ssl/server.key \
        -out /opt/csgo-case-opening/nginx/ssl/server.crt \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=CSGO Case Opening/CN=localhost"
    
    chown -R csgo-app:csgo-app /opt/csgo-case-opening/nginx/ssl
    
    print_success "SSL сертификат создан"
}

# Настройка окружения
setup_environment() {
    print_info "Настройка окружения..."
    
    # Создание .env файла если его нет
    if [ ! -f "/opt/csgo-case-opening/.env" ]; then
        if [ -f "/opt/csgo-case-opening/.env.example" ]; then
            cp /opt/csgo-case-opening/.env.example /opt/csgo-case-opening/.env
        else
            # Создание базового .env файла
            cat > /opt/csgo-case-opening/.env << 'EOF'
# CS:GO Case Opening Environment Variables
NODE_ENV=production
PORT=5000
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=csgocaseopening2024
DB_NAME=csgo_case_opening
DB_PORT=3306

# Steam API (получите на https://steamcommunity.com/dev/apikey)
STEAM_API_KEY=your_steam_api_key_here
STEAM_RETURN_URL=https://your-domain.com/auth/steam/return
STEAM_REALM=https://your-domain.com/

# Market API (получите на https://market.csgo.com)
MARKET_API_KEY=your_market_api_key_here

# Session
SESSION_SECRET=your_super_secret_session_key_here

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Frontend
FRONTEND_URL=https://your-domain.com
EOF
        fi
        
        chown csgo-app:csgo-app /opt/csgo-case-opening/.env
    fi
    
    print_success "Окружение настроено"
}

# Настройка systemd сервиса
setup_systemd_service() {
    print_info "Настройка systemd сервиса..."
    
    # Создание systemd сервиса
    cat > /etc/systemd/system/csgo-case-opening.service << 'EOF'
[Unit]
Description=CS:GO Case Opening Website
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=csgo-app
Group=csgo-app
WorkingDirectory=/opt/csgo-case-opening
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    # Перезагрузка systemd
    systemctl daemon-reload
    systemctl enable csgo-case-opening
    
    print_success "Systemd сервис настроен"
}

# Настройка логротации
setup_logrotate() {
    print_info "Настройка логротации..."
    
    cat > /etc/logrotate.d/csgo-case-opening << 'EOF'
/var/log/csgo-case-opening/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 csgo-app csgo-app
    postrotate
        systemctl reload csgo-case-opening
    endscript
}
EOF
    
    print_success "Логротация настроена"
}

# Установка мониторинга
setup_monitoring() {
    print_info "Настройка мониторинга..."
    
    # Создание скрипта мониторинга
    cat > /opt/csgo-case-opening/monitor.sh << 'EOF'
#!/bin/bash

# Скрипт мониторинга CS:GO Case Opening Website
LOG_FILE="/var/log/csgo-case-opening/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting monitoring check" >> $LOG_FILE

# Проверка контейнеров
cd /opt/csgo-case-opening

if ! docker-compose ps | grep -q "Up"; then
    echo "[$DATE] ERROR: Some containers are down" >> $LOG_FILE
    docker-compose up -d
    echo "[$DATE] Attempted to restart containers" >> $LOG_FILE
fi

# Проверка дискового пространства
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is $DISK_USAGE%" >> $LOG_FILE
fi

# Проверка памяти
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Memory usage is $MEM_USAGE%" >> $LOG_FILE
fi

echo "[$DATE] Monitoring check completed" >> $LOG_FILE
EOF
    
    chmod +x /opt/csgo-case-opening/monitor.sh
    chown csgo-app:csgo-app /opt/csgo-case-opening/monitor.sh
    
    # Добавление в cron
    (crontab -u csgo-app -l 2>/dev/null; echo "*/5 * * * * /opt/csgo-case-opening/monitor.sh") | crontab -u csgo-app -
    
    print_success "Мониторинг настроен"
}

# Создание скрипта управления
create_management_script() {
    print_info "Создание скрипта управления..."
    
    cat > /usr/local/bin/csgo-manage << 'EOF'
#!/bin/bash

# Скрипт управления CS:GO Case Opening Website
PROJECT_DIR="/opt/csgo-case-opening"
LOG_DIR="/var/log/csgo-case-opening"

case "$1" in
    start)
        echo "Запуск CS:GO Case Opening Website..."
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose up -d
        echo "Сайт запущен"
        ;;
    stop)
        echo "Остановка CS:GO Case Opening Website..."
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose down
        echo "Сайт остановлен"
        ;;
    restart)
        echo "Перезапуск CS:GO Case Opening Website..."
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose down
        sudo -u csgo-app docker-compose up -d
        echo "Сайт перезапущен"
        ;;
    status)
        echo "Статус CS:GO Case Opening Website:"
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose ps
        ;;
    logs)
        echo "Логи CS:GO Case Opening Website:"
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose logs -f
        ;;
    update)
        echo "Обновление CS:GO Case Opening Website..."
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose down
        sudo -u csgo-app docker-compose pull
        sudo -u csgo-app docker-compose up -d --build
        echo "Обновление завершено"
        ;;
    backup)
        echo "Создание бэкапа базы данных..."
        cd $PROJECT_DIR
        sudo -u csgo-app docker-compose exec mysql mysqldump -u root -pcsgocaseopening2024 csgo_case_opening > $LOG_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
        echo "Бэкап создан в $LOG_DIR/"
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|logs|update|backup}"
        exit 1
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/csgo-manage
    
    print_success "Скрипт управления создан (команда: csgo-manage)"
}

# Финальная проверка
final_check() {
    print_info "Финальная проверка установки..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен правильно"
        exit 1
    fi
    
    # Проверка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен правильно"
        exit 1
    fi
    
    # Проверка директории проекта
    if [ ! -d "/opt/csgo-case-opening" ]; then
        print_error "Директория проекта не создана"
        exit 1
    fi
    
    print_success "Все проверки пройдены"
}

# Вывод итоговой информации
print_final_info() {
    echo ""
    echo "=================================================================="
    echo -e "${GREEN}🎉 CS:GO Case Opening Website успешно установлен!${NC}"
    echo "=================================================================="
    echo ""
    echo -e "${BLUE}📁 Директория проекта:${NC} /opt/csgo-case-opening"
    echo -e "${BLUE}📝 Логи:${NC} /var/log/csgo-case-opening"
    echo -e "${BLUE}👤 Пользователь:${NC} csgo-app"
    echo ""
    echo -e "${YELLOW}⚠️  ВАЖНО: Настройте файл .env перед запуском!${NC}"
    echo "   Отредактируйте: /opt/csgo-case-opening/.env"
    echo "   Укажите ваши API ключи:"
    echo "   - STEAM_API_KEY"
    echo "   - MARKET_API_KEY"
    echo "   - SESSION_SECRET"
    echo ""
    echo -e "${BLUE}🔧 Команды управления:${NC}"
    echo "   csgo-manage start    - Запуск сайта"
    echo "   csgo-manage stop     - Остановка сайта"
    echo "   csgo-manage restart  - Перезапуск сайта"
    echo "   csgo-manage status   - Статус сайта"
    echo "   csgo-manage logs     - Просмотр логов"
    echo "   csgo-manage update   - Обновление"
    echo "   csgo-manage backup   - Создание бэкапа"
    echo ""
    echo -e "${BLUE}🌐 После настройки .env и запуска доступно на:${NC}"
    echo "   HTTP:  http://$(hostname -I | awk '{print $1}')"
    echo "   HTTPS: https://$(hostname -I | awk '{print $1}')"
    echo ""
    echo -e "${BLUE}📚 Документация:${NC}"
    echo "   README.md: /opt/csgo-case-opening/README.md"
    echo "   DEPLOY.md: /opt/csgo-case-opening/DEPLOY.md"
    echo ""
    echo -e "${GREEN}Установка завершена! Настройте .env и запустите: csgo-manage start${NC}"
    echo "=================================================================="
}

# Основная функция установки
main() {
    echo "=================================================================="
    echo -e "${GREEN}🚀 CS:GO Case Opening Website - Автоустановщик${NC}"
    echo "=================================================================="
    echo ""
    
    print_info "Начинаем установку на чистый VDS сервер..."
    
    # Проверки
    check_root
    detect_os
    
    # Установка
    update_system
    install_base_packages
    install_docker
    install_docker_compose
    install_nodejs
    
    # Настройка безопасности
    configure_firewall
    configure_fail2ban
    
    # Настройка приложения
    create_app_user
    create_project_directory
    download_project
    setup_ssl
    setup_environment
    setup_systemd_service
    setup_logrotate
    setup_monitoring
    create_management_script
    
    # Финальная проверка
    final_check
    print_final_info
}

# Обработка сигналов
trap 'print_error "Установка прервана"; exit 1' INT TERM

# Запуск основной функции
main "$@"