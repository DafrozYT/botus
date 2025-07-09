# 🚀 Автоустановщик CS:GO Case Opening Website

## Быстрая установка на чистый VDS сервер

### Один скрипт - полная установка!

Автоустановщик полностью настроит проект на чистом VDS сервере за 5-10 минут.

## 📋 Три способа установки

### 1. 💻 Локальная установка
```bash
# Скачайте проект
git clone https://github.com/your-username/csgo-case-opening.git
cd csgo-case-opening

# Запустите автоустановщик
sudo ./install.sh
```

### 2. 🌐 Удаленная установка
```bash
# Установка на удаленный сервер
./remote-install.sh 192.168.1.100

# С указанием пользователя и порта
./remote-install.sh 192.168.1.100 root 2222
```

### 3. ⚡ Установка одной командой
```bash
# Прямая установка с GitHub
curl -sSL https://raw.githubusercontent.com/your-username/csgo-case-opening/main/install.sh | sudo bash
```

## 🔧 Что устанавливается автоматически

- ✅ **Docker & Docker Compose** - Контейнеризация
- ✅ **Node.js 18+** - Среда выполнения
- ✅ **MySQL 8.0** - База данных
- ✅ **Redis 7** - Кэширование
- ✅ **Nginx** - Веб-сервер и проксирование
- ✅ **SSL сертификаты** - Безопасность
- ✅ **Firewall (UFW/Firewalld)** - Защита портов
- ✅ **Fail2ban** - Защита от атак
- ✅ **Systemd сервис** - Автозапуск
- ✅ **Мониторинг** - Отслеживание состояния
- ✅ **Логротация** - Управление логами

## 🎯 Поддерживаемые ОС

- **Ubuntu** 20.04+
- **Debian** 10+
- **CentOS** 7+
- **RHEL** 8+

## 📊 Системные требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| RAM | 2GB | 4GB |
| Диск | 10GB | 20GB |
| CPU | 1 ядро | 2 ядра |
| Порты | 22, 80, 443 | + 22 для SSH |

## ⚙️ Настройка после установки

### 1. Настройка API ключей
```bash
sudo nano /opt/csgo-case-opening/.env
```

Укажите ваши ключи:
- `STEAM_API_KEY` - https://steamcommunity.com/dev/apikey
- `MARKET_API_KEY` - https://market.csgo.com
- `SESSION_SECRET` - случайная строка

### 2. Запуск проекта
```bash
# Запуск сайта
csgo-manage start

# Проверка статуса
csgo-manage status

# Просмотр логов
csgo-manage logs
```

## 🎮 Команды управления

```bash
csgo-manage start      # Запуск
csgo-manage stop       # Остановка
csgo-manage restart    # Перезапуск
csgo-manage status     # Статус
csgo-manage logs       # Логи
csgo-manage update     # Обновление
csgo-manage backup     # Бэкап БД
```

## 🌐 Доступ к сайту

После установки и настройки:

- **Сайт**: https://your-server-ip/
- **Админ**: https://your-server-ip/admin
- **API**: https://your-server-ip/api
- **Здоровье**: https://your-server-ip/health

## 🔒 Безопасность

Автоустановщик настраивает:
- Firewall с закрытыми внутренними портами
- Fail2ban защиту от брутфорса
- SSL сертификаты
- Системные обновления безопасности

## 📁 Структура после установки

```
/opt/csgo-case-opening/          # Основной проект
├── docker-compose.yml          # Docker конфигурация
├── .env                        # Переменные окружения
├── nginx/                      # Nginx конфигурация
├── database/                   # SQL схемы
└── monitor.sh                  # Скрипт мониторинга

/var/log/csgo-case-opening/     # Логи
/var/lib/csgo-case-opening/     # Данные
```

## 🚨 Решение проблем

### Проблема: Контейнеры не запускаются
```bash
csgo-manage logs
csgo-manage restart
```

### Проблема: Нет доступа к сайту
```bash
# Проверка firewall
sudo ufw status

# Проверка портов
sudo netstat -tlnp | grep -E ':(80|443)'
```

### Проблема: База данных недоступна
```bash
# Проверка MySQL
cd /opt/csgo-case-opening
sudo -u csgo-app docker-compose exec mysql mysql -u root -pcsgocaseopening2024 -e "SELECT 1"
```

## 📞 Поддержка

- 📖 **Полная документация**: [INSTALL.md](INSTALL.md)
- 🚀 **Развертывание**: [DEPLOY.md](DEPLOY.md)
- 📋 **Руководство**: [README.md](README.md)
- 💬 **GitHub Issues**: https://github.com/your-username/csgo-case-opening/issues

---

## 🎉 Пример полной установки

```bash
# 1. Скачайте проект
git clone https://github.com/your-username/csgo-case-opening.git
cd csgo-case-opening

# 2. Запустите автоустановщик
sudo ./install.sh

# 3. Настройте API ключи
sudo nano /opt/csgo-case-opening/.env

# 4. Запустите сайт
csgo-manage start

# 5. Проверьте работу
csgo-manage status
```

**Время установки: 5-10 минут**  
**Готово к использованию! 🚀**