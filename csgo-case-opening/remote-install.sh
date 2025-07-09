#!/bin/bash

# CS:GO Case Opening Website - Скрипт удаленной установки
# Этот скрипт скачивает и запускает автоустановщик на удаленном сервере

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Проверка аргументов
if [ $# -lt 1 ]; then
    echo "Использование: $0 <IP_адрес_сервера> [пользователь] [порт]"
    echo "Примеры:"
    echo "  $0 192.168.1.100"
    echo "  $0 192.168.1.100 root"
    echo "  $0 192.168.1.100 root 22"
    exit 1
fi

SERVER_IP=$1
USERNAME=${2:-root}
PORT=${3:-22}

print_info "Удаленная установка CS:GO Case Opening Website"
print_info "Сервер: $USERNAME@$SERVER_IP:$PORT"

# Проверка доступности сервера
print_info "Проверка доступности сервера..."
if ! ping -c 1 $SERVER_IP &> /dev/null; then
    print_error "Сервер $SERVER_IP недоступен"
    exit 1
fi

# Проверка SSH подключения
print_info "Проверка SSH подключения..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes -p $PORT $USERNAME@$SERVER_IP exit 2>/dev/null; then
    print_warning "SSH подключение с ключом не удалось"
    print_info "Будет использована аутентификация по паролю"
fi

# Создание временного архива проекта
print_info "Создание архива проекта..."
TEMP_DIR=$(mktemp -d)
PROJECT_ARCHIVE="$TEMP_DIR/csgo-case-opening.tar.gz"

# Архивирование проекта
tar -czf "$PROJECT_ARCHIVE" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.env' \
    -C "$(dirname "$0")" \
    "$(basename "$(dirname "$0")")"

print_success "Архив создан: $PROJECT_ARCHIVE"

# Функция для выполнения команд на удаленном сервере
ssh_exec() {
    ssh -p $PORT $USERNAME@$SERVER_IP "$1"
}

# Копирование архива на сервер
print_info "Копирование файлов на сервер..."
scp -P $PORT "$PROJECT_ARCHIVE" $USERNAME@$SERVER_IP:/tmp/

# Создание скрипта установки на сервере
print_info "Создание скрипта установки на сервере..."
ssh_exec "cat > /tmp/remote_install.sh << 'EOF'
#!/bin/bash

set -e

# Распаковка архива
cd /tmp
tar -xzf csgo-case-opening.tar.gz
cd csgo-case-opening

# Запуск автоустановщика
chmod +x install.sh
./install.sh

# Очистка временных файлов
rm -rf /tmp/csgo-case-opening.tar.gz /tmp/csgo-case-opening /tmp/remote_install.sh
EOF"

# Запуск установки на сервере
print_info "Запуск установки на сервере..."
ssh_exec "chmod +x /tmp/remote_install.sh && /tmp/remote_install.sh"

# Очистка локальных временных файлов
rm -rf "$TEMP_DIR"

print_success "Удаленная установка завершена!"
print_info "Подключитесь к серверу для завершения настройки:"
print_info "ssh -p $PORT $USERNAME@$SERVER_IP"
print_info "Затем отредактируйте файл /opt/csgo-case-opening/.env"
print_info "И запустите: csgo-manage start"