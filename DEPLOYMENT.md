# 🚀 Развертывание Hitmanki.store

Краткое руководство по развертыванию платформы для открытия кейсов на домене **hitmanki.store**.

## ⚡ Быстрый старт

### 1. Подготовка сервера
```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Установите Docker Compose
sudo apt install docker-compose-plugin

# Перезайдите в систему для применения групп
```

### 2. Настройка DNS
Настройте следующие DNS записи у вашего провайдера:
- `A` запись: `hitmanki.store` → IP вашего сервера
- `CNAME` запись: `admin.hitmanki.store` → `hitmanki.store`  
- `CNAME` запись: `api.hitmanki.store` → `hitmanki.store`

### 3. Клонирование проекта
```bash
git clone <repository-url>
cd hitmanki-cases
```

### 4. Конфигурация
```bash
cd docker
cp .env.production .env
nano .env  # Отредактируйте переменные окружения
```

**Обязательно измените:**
- `STEAM_API_KEY` - получите на https://steamcommunity.com/dev/apikey
- `MONGO_ROOT_PASSWORD` - сильный пароль для MongoDB
- `MYSQL_PASSWORD` - пароль для MySQL
- `JWT_SECRET` - уникальный секретный ключ

### 5. Развертывание
```bash
./deploy-hitmanki.sh
```

Скрипт автоматически:
- ✅ Проверит все зависимости
- ✅ Настроит SSL сертификаты через Let's Encrypt
- ✅ Запустит все сервисы в Docker
- ✅ Выполнит миграции баз данных
- ✅ Оптимизирует Laravel приложения
- ✅ Протестирует доступность сервисов

## 🌐 Доступ к платформе

После успешного развертывания:
- **Основной сайт**: https://hitmanki.store
- **Админ панель**: https://admin.hitmanki.store
- **API**: https://api.hitmanki.store

## 🔧 Управление

### Просмотр логов
```bash
# Все сервисы
docker-compose -f docker-compose.production.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.production.yml logs -f backend
```

### Перезапуск сервисов
```bash
# Все сервисы
docker-compose -f docker-compose.production.yml restart

# Конкретный сервис
docker-compose -f docker-compose.production.yml restart nginx
```

### Остановка/запуск
```bash
# Остановка
docker-compose -f docker-compose.production.yml down

# Запуск
docker-compose -f docker-compose.production.yml up -d
```

### Обновление
```bash
# Просто запустите скрипт развертывания снова
./deploy-hitmanki.sh
```

## 📊 Мониторинг

### Проверка статуса сервисов
```bash
docker-compose -f docker-compose.production.yml ps
```

### Проверка использования ресурсов
```bash
docker stats
```

### Проверка места на диске
```bash
df -h
docker system df
```

## 🔒 Безопасность

### Автообновление SSL сертификатов
Скрипт автоматически настраивает cron задачу для обновления SSL сертификатов.

### Резервное копирование
```bash
# Создание бэкапа вручную
./backup.sh

# Автоматические бэкапы (добавьте в crontab)
0 2 * * * /opt/hitmanki/docker/backup.sh
```

### Мониторинг безопасности
```bash
# Проверка логов на подозрительную активность
tail -f docker/logs/access.log | grep -E "(40[0-9]|50[0-9])"

# Проверка неудачных попыток входа
docker-compose -f docker-compose.production.yml logs backend | grep "Authentication failed"
```

## 🎯 После развертывания

1. **Создайте админ пользователя**
   - Зайдите на https://admin.hitmanki.store
   - Зарегистрируйтесь через Steam
   - Измените роль в базе данных на 'admin'

2. **Настройте кейсы и предметы**
   - Создайте кейсы через админ панель
   - Добавьте предметы с правильными шансами выпадения
   - Убедитесь, что сумма шансов = 100%

3. **Настройте платежи**
   - Добавьте ключи Stripe в .env
   - Настройте webhook endpoints

4. **Тестирование**
   - Откройте несколько кейсов для проверки
   - Проверьте Provably Fair верификацию
   - Убедитесь, что WebSocket работает корректно

## ❗ Устранение неполадок

### Сервис не запускается
```bash
# Проверьте логи
docker-compose -f docker-compose.production.yml logs [service_name]

# Проверьте конфигурацию
docker-compose -f docker-compose.production.yml config
```

### SSL проблемы
```bash
# Перевыпустите сертификаты
sudo certbot renew --force-renewal

# Перезапустите nginx
docker-compose -f docker-compose.production.yml restart nginx
```

### База данных недоступна
```bash
# Проверьте статус MongoDB
docker-compose -f docker-compose.production.yml exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Проверьте статус MySQL
docker-compose -f docker-compose.production.yml exec mysql mysql -u root -p -e "SELECT 1"
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи всех сервисов
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте доступность внешних сервисов (Steam API, MongoDB, etc.)
4. Обратитесь к детальной документации в `README.md`

---

**Hitmanki.store готов к работе! 🎮**