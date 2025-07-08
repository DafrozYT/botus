# 🐳 Docker & Deployment Scripts

Эта папка содержит все файлы, необходимые для развертывания **Hitmanki.store** в продакшене.

## 📁 Файлы и скрипты

### 🔧 Конфигурационные файлы
- **`.env.production`** - Шаблон конфигурации для продакшена
- **`.env`** - Ваша рабочая конфигурация (создается из шаблона)
- **`docker-compose.production.yml`** - Docker Compose для продакшена
- **`nginx.conf`** - Конфигурация Nginx для reverse proxy

### 🚀 Скрипты развертывания
- **`deploy-hitmanki.sh`** - Основной скрипт развертывания платформы
- **`check-config.sh`** - Проверка конфигурации перед развертыванием
- **`generate-secrets.sh`** - Генератор безопасных паролей и ключей

### 📁 Дополнительные папки
- **`ssl/`** - SSL сертификаты (создается автоматически)
- **`logs/`** - Логи приложений (создается автоматически)

## 🔧 Основные команды

### Первое развертывание:
```bash
# 1. Исправьте Laravel файлы (из корня проекта)
cd ..
./fix-laravel-files.sh
cd docker

# 2. Скопируйте конфигурацию
cp .env.production .env

# 3. Сгенерируйте секреты
./generate-secrets.sh

# 4. Отредактируйте конфигурацию
nano .env

# 5. Проверьте настройки
./check-config.sh

# 6. Разверните платформу
./deploy-hitmanki.sh
```

### Управление сервисами:
```bash
# Статус сервисов
docker-compose -f docker-compose.production.yml ps

# Перезапуск всех сервисов
docker-compose -f docker-compose.production.yml restart

# Остановка
docker-compose -f docker-compose.production.yml stop

# Запуск
docker-compose -f docker-compose.production.yml start

# Логи
docker-compose -f docker-compose.production.yml logs -f
```

### Обновление:
```bash
# Обновить код
git pull origin main

# Пересобрать и перезапустить
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## 🔐 Важные переменные в .env

### Обязательные:
- `STEAM_API_KEY` - Ключ Steam API
- `MONGO_ROOT_PASSWORD` - Пароль MongoDB
- `MYSQL_PASSWORD` - Пароль MySQL
- `JWT_SECRET` - Секрет для JWT токенов
- `SERVER_SEED_SECRET` - Секрет для Provably Fair
- `APP_KEY` - Ключ Laravel (frontend)
- `ADMIN_APP_KEY` - Ключ Laravel (admin)

### Домены:
- `DOMAIN=hitmanki.store`
- `FRONTEND_URL=https://hitmanki.store`
- `ADMIN_URL=https://admin.hitmanki.store`
- `BACKEND_URL=https://api.hitmanki.store`

## 🚨 Устранение неполадок

### Проверка статуса:
```bash
# Статус всех контейнеров
docker-compose -f docker-compose.production.yml ps

# Логи конкретного сервиса
docker-compose -f docker-compose.production.yml logs имя_сервиса

# Проверка конфигурации
docker-compose -f docker-compose.production.yml config
```

### Перезапуск проблемного сервиса:
```bash
docker-compose -f docker-compose.production.yml restart имя_сервиса
```

### Очистка системы:
```bash
# Очистка неиспользуемых образов
docker system prune -a

# Перезапуск с очисткой
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

## 📊 Мониторинг

После развертывания используйте скрипт мониторинга:
```bash
~/monitor.sh
```

## 🔗 Полезные ссылки

- [VDS_INSTALL.md](../VDS_INSTALL.md) - Установка на чистый VDS
- [QUICK_START.md](../QUICK_START.md) - Быстрый запуск
- [INSTALL.md](../INSTALL.md) - Подробная установка  
- [README.md](../README.md) - Главная документация

---

**💡 Совет**: Всегда делайте резервную копию `.env` файла перед изменениями!