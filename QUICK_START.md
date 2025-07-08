# ⚡ Быстрый запуск Hitmanki.store

Упрощенная инструкция для быстрого развертывания платформы.

## 📋 Краткий чек-лист

### 1. Подготовка сервера (5 минут)
```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
sudo usermod -aG docker $USER

# Перезайдите в систему
exit && ssh пользователь@сервер
```

### 2. Настройка DNS (10-30 минут)
Создайте у вашего DNS провайдера:
- `A hitmanki.store → IP_СЕРВЕРА`
- `CNAME admin.hitmanki.store → hitmanki.store`
- `CNAME api.hitmanki.store → hitmanki.store`

### 3. Получение Steam API ключа (2 минуты)
1. Зайдите на https://steamcommunity.com/dev/apikey
2. Укажите домен: `hitmanki.store`
3. Скопируйте полученный ключ

### 4. Клонирование и конфигурация (3 минуты)
```bash
# Скачайте проект
git clone https://github.com/ваш-репозиторий/hitmanki-cases.git
cd hitmanki-cases/docker

# Скопируйте конфигурацию
cp .env.production .env

# Отредактируйте конфигурацию
nano .env
```

**Обязательно измените в .env файле:**
```bash
STEAM_API_KEY=ваш_ключ_steam
MONGO_ROOT_PASSWORD=сложный_пароль_для_mongo
MYSQL_PASSWORD=сложный_пароль_для_mysql
JWT_SECRET=случайная_строка_минимум_32_символа
SERVER_SEED_SECRET=другая_случайная_строка
```

### 5. Исправление Laravel файлов (1 минута)
```bash
# Перейдите в корень проекта
cd ~/hitmanki-cases

# Исправьте недостающие Laravel файлы
./fix-laravel-files.sh
```

### 6. Генерация Laravel ключей (1 минута)
```bash
# Frontend ключ
cd frontend
php artisan key:generate --show
# Скопируйте результат

# Admin ключ
cd ../admin  
php artisan key:generate --show
# Скопируйте результат

# Вернитесь в docker папку
cd ../docker

# Добавьте ключи в .env
nano .env
```

Добавьте в .env:
```bash
APP_KEY=base64:ваш_frontend_ключ
ADMIN_APP_KEY=base64:ваш_admin_ключ
```

### 7. Проверка конфигурации (1 минута)
```bash
# Проверьте все настройки
chmod +x check-config.sh
./check-config.sh
```

### 8. Развертывание (10-15 минут)
```bash
# Запустите автоматическое развертывание
chmod +x deploy-hitmanki.sh
./deploy-hitmanki.sh
```

### 9. Финальная проверка (2 минуты)
```bash
# Проверьте статус сервисов
docker-compose -f docker-compose.production.yml ps

# Проверьте сайты
curl -I https://hitmanki.store
curl -I https://admin.hitmanki.store
curl https://api.hitmanki.store/api/health
```

---

## 🎯 Итого: 30-40 минут

После выполнения всех шагов у вас будет:
- ✅ **https://hitmanki.store** - основной сайт
- ✅ **https://admin.hitmanki.store** - админ панель  
- ✅ **https://api.hitmanki.store** - API backend
- ✅ SSL сертификаты
- ✅ Steam авторизация
- ✅ Все базы данных
- ✅ WebSocket для реального времени

---

## 🆘 Если что-то пошло не так

### Проблемы с DNS
```bash
# Проверьте DNS
nslookup hitmanki.store
# Подождите 10-30 минут распространения
```

### Проблемы с SSL
```bash
# Остановите nginx и попробуйте вручную
docker-compose -f docker-compose.production.yml stop nginx
sudo certbot certonly --standalone -d hitmanki.store -d admin.hitmanki.store -d api.hitmanki.store
```

### Проблемы с сервисами
```bash
# Посмотрите логи
docker-compose -f docker-compose.production.yml logs имя_сервиса

# Перезапустите проблемный сервис
docker-compose -f docker-compose.production.yml restart имя_сервиса
```

---

## 📚 Дополнительная информация

- **Подробная инструкция**: [INSTALL.md](INSTALL.md)
- **Полная документация**: [README.md](README.md)
- **Руководство по развертыванию**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Готово! Ваш Hitmanki.store запущен! 🚀**