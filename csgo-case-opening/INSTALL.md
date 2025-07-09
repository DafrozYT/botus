# Инструкция по установке CS:GO Case Opening Website

## 🚀 Автоустановщик для чистого VDS

Этот автоустановщик полностью настроит CS:GO Case Opening Website на чистом VDS сервере.

### Поддерживаемые операционные системы:
- Ubuntu 20.04+
- Debian 10+
- CentOS 7+
- RHEL 8+

### Минимальные требования:
- RAM: 2GB
- Диск: 10GB свободного места
- CPU: 1 ядро
- Порты: 22, 80, 443

## 📋 Способы установки

### 1. Локальная установка (на сервере)

```bash
# Скачайте проект на сервер
git clone https://github.com/your-username/csgo-case-opening.git
cd csgo-case-opening

# Запустите автоустановщик
sudo ./install.sh
```

### 2. Удаленная установка (с локальной машины)

```bash
# Сделайте скрипт исполняемым
chmod +x remote-install.sh

# Запустите удаленную установку
./remote-install.sh IP_АДРЕС_СЕРВЕРА

# Примеры:
./remote-install.sh 192.168.1.100
./remote-install.sh 192.168.1.100 root
./remote-install.sh 192.168.1.100 root 2222
```

### 3. Установка одной командой

```bash
# Прямая установка с GitHub
curl -sSL https://raw.githubusercontent.com/your-username/csgo-case-opening/main/install.sh | sudo bash
```

## 🔧 Что устанавливает автоустановщик

### 1. Базовые пакеты
- Docker & Docker Compose
- Node.js 18+
- Git, curl, wget
- htop, nano, unzip
- OpenSSL

### 2. Безопасность
- UFW/Firewalld настройка
- Fail2ban защита
- SSL сертификаты
- Системные обновления

### 3. Структура проекта
```
/opt/csgo-case-opening/     # Основной проект
/var/log/csgo-case-opening/ # Логи
/var/lib/csgo-case-opening/ # Данные
/etc/systemd/system/csgo-case-opening.service # Systemd сервис
```

### 4. Пользователи и разрешения
- Создается пользователь `csgo-app`
- Настраиваются права доступа
- Добавляется в группу `docker`

### 5. Системные сервисы
- Systemd сервис для автозапуска
- Logrotate для ротации логов
- Cron для мониторинга
- Fail2ban для защиты

## ⚙️ Настройка после установки

### 1. Настройка API ключей

```bash
# Отредактируйте файл окружения
sudo nano /opt/csgo-case-opening/.env

# Укажите ваши API ключи:
STEAM_API_KEY=your_steam_api_key_here
MARKET_API_KEY=your_market_api_key_here
SESSION_SECRET=your_super_secret_session_key_here
```

### 2. Получение API ключей

#### Steam API ключ:
1. Перейдите на https://steamcommunity.com/dev/apikey
2. Войдите в Steam аккаунт
3. Укажите доменное имя: `your-domain.com`
4. Скопируйте ключ

#### Market.csgo.com API ключ:
1. Зарегистрируйтесь на https://market.csgo.com
2. Перейдите в раздел API
3. Создайте новый ключ
4. Скопируйте ключ

### 3. Настройка домена

```bash
# Обновите настройки в .env
STEAM_RETURN_URL=https://your-domain.com/auth/steam/return
STEAM_REALM=https://your-domain.com/
FRONTEND_URL=https://your-domain.com
```

### 4. SSL сертификат (для продакшена)

```bash
# Для Let's Encrypt сертификата:
sudo certbot --nginx -d your-domain.com

# Или замените самоподписанный сертификат:
sudo cp your-cert.crt /opt/csgo-case-opening/nginx/ssl/server.crt
sudo cp your-key.key /opt/csgo-case-opening/nginx/ssl/server.key
```

## 🎮 Управление проектом

### Команды управления

```bash
# Запуск сайта
csgo-manage start

# Остановка сайта
csgo-manage stop

# Перезапуск сайта
csgo-manage restart

# Просмотр статуса
csgo-manage status

# Просмотр логов
csgo-manage logs

# Обновление проекта
csgo-manage update

# Создание бэкапа базы данных
csgo-manage backup
```

### Systemd управление

```bash
# Автозапуск при загрузке
sudo systemctl enable csgo-case-opening

# Запуск сервиса
sudo systemctl start csgo-case-opening

# Статус сервиса
sudo systemctl status csgo-case-opening

# Остановка сервиса
sudo systemctl stop csgo-case-opening
```

## 📊 Мониторинг

### Логи системы

```bash
# Логи приложения
tail -f /var/log/csgo-case-opening/monitor.log

# Логи Docker
sudo journalctl -u docker -f

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Состояние контейнеров
docker ps

# Использование диска
df -h

# Использование памяти
free -h
```

## 🔒 Безопасность

### Настройка Firewall

```bash
# Проверка статуса UFW
sudo ufw status

# Добавление разрешенных IP
sudo ufw allow from 192.168.1.100 to any port 22

# Проверка fail2ban
sudo fail2ban-client status
```

### Обновления безопасности

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Обновление Docker образов
cd /opt/csgo-case-opening
sudo -u csgo-app docker-compose pull
sudo -u csgo-app docker-compose up -d --build
```

## 🔄 Резервное копирование

### Автоматическое резервное копирование

```bash
# Создание бэкапа базы данных
csgo-manage backup

# Настройка автоматического бэкапа (ежедневно в 3:00)
sudo crontab -e
# Добавьте строку:
0 3 * * * /usr/local/bin/csgo-manage backup
```

### Восстановление из бэкапа

```bash
# Восстановление базы данных
cd /opt/csgo-case-opening
sudo -u csgo-app docker-compose exec -T mysql mysql -u root -pcsgocaseopening2024 csgo_case_opening < /path/to/backup.sql
```

## 🚨 Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверка логов
csgo-manage logs

# Перезапуск всех контейнеров
csgo-manage restart

# Проверка доступности портов
sudo netstat -tlnp | grep -E ':(80|443|3000|5000|3306|6379)'
```

### Проблема: База данных недоступна

```bash
# Проверка статуса MySQL
cd /opt/csgo-case-opening
sudo -u csgo-app docker-compose exec mysql mysql -u root -pcsgocaseopening2024 -e "SELECT 1"

# Перезапуск MySQL
sudo -u csgo-app docker-compose restart mysql
```

### Проблема: SSL сертификат

```bash
# Проверка сертификата
openssl x509 -in /opt/csgo-case-opening/nginx/ssl/server.crt -text -noout

# Пересоздание самоподписанного сертификата
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/csgo-case-opening/nginx/ssl/server.key \
    -out /opt/csgo-case-opening/nginx/ssl/server.crt
```

### Проблема: Высокая нагрузка

```bash
# Проверка использования ресурсов
htop
docker stats

# Оптимизация Docker
docker system prune -a

# Очистка логов
sudo journalctl --vacuum-time=7d
```

## 📈 Оптимизация производительности

### Настройка для высоких нагрузок

```bash
# Увеличение лимитов системы
sudo nano /etc/security/limits.conf
# Добавьте:
* soft nofile 65536
* hard nofile 65536

# Настройка ядра
sudo nano /etc/sysctl.conf
# Добавьте:
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
```

### Масштабирование

```bash
# Увеличение количества экземпляров backend
cd /opt/csgo-case-opening
sudo nano docker-compose.yml
# Измените:
services:
  backend:
    deploy:
      replicas: 3
```

## 🌐 Доступ к сайту

После успешной установки и настройки:

- **Основной сайт**: https://your-domain.com
- **Админ панель**: https://your-domain.com/admin
- **API документация**: https://your-domain.com/api
- **Мониторинг**: https://your-domain.com/health

## 📞 Поддержка

### Полезные команды

```bash
# Проверка версий
docker --version
docker-compose --version
node --version

# Системная информация
uname -a
cat /etc/os-release
```

### Контакты

- GitHub Issues: https://github.com/your-username/csgo-case-opening/issues
- Email: support@your-domain.com
- Discord: https://discord.gg/your-server

---

**Успешной установки! 🎉**

После завершения установки не забудьте:
1. Настроить .env файл
2. Получить SSL сертификат
3. Настроить доменное имя
4. Создать первого администратора
5. Протестировать все функции