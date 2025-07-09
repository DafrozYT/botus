# Развертывание CS:GO Case Opening Website

## 🚀 Быстрое развертывание

### Предварительные требования
- Docker 20.10+
- Docker Compose 2.0+
- Порты 80, 443, 3000, 5000, 3306, 6379 должны быть свободны

### Шаги развертывания

1. **Получение API ключей**
   ```bash
   # Steam API ключ
   # Перейдите на https://steamcommunity.com/dev/apikey
   
   # Market.csgo.com API ключ
   # Зарегистрируйтесь на https://market.csgo.com и получите ключ
   ```

2. **Настройка переменных окружения**
   ```bash
   cp .env.example .env
   # Отредактируйте .env файл
   nano .env
   ```

3. **Запуск проекта**
   ```bash
   # Автоматический запуск
   chmod +x quick-start.sh
   ./quick-start.sh
   
   # Или вручную
   docker-compose up -d --build
   ```

4. **Проверка работы**
   ```bash
   # Проверка статуса контейнеров
   docker-compose ps
   
   # Проверка логов
   docker-compose logs -f
   ```

## 🔧 Настройка продакшена

### SSL сертификаты
```bash
# Создание самоподписанного сертификата (для тестирования)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/server.key \
    -out nginx/ssl/server.crt

# Или используйте Let's Encrypt для продакшена
```

### Переменные окружения для продакшена
```env
NODE_ENV=production
DB_PASSWORD=strong_secure_password
SESSION_SECRET=very_long_random_secret_string
STEAM_API_KEY=your_actual_steam_api_key
MARKET_API_KEY=your_actual_market_api_key
```

### Настройка firewall
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw deny 5000/tcp
sudo ufw deny 3306/tcp
sudo ufw deny 6379/tcp
```

## 📊 Мониторинг

### Логи
```bash
# Все логи
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend

# Последние 100 строк
docker-compose logs --tail=100 frontend
```

### Проверка состояния
```bash
# Здоровье контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Проверка диска
df -h
```

## 🔄 Обновление

### Обновление кода
```bash
# Пересборка с обновлением
docker-compose down
docker-compose pull
docker-compose up -d --build
```

### Резервное копирование
```bash
# Создание бэкапа БД
docker-compose exec mysql mysqldump -u root -p csgo_case_opening > backup.sql

# Восстановление
docker-compose exec -T mysql mysql -u root -p csgo_case_opening < backup.sql
```

## 🚨 Решение проблем

### Общие проблемы
1. **Контейнеры не запускаются**
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose up -d --build
   ```

2. **База данных недоступна**
   ```bash
   docker-compose restart mysql
   docker-compose logs mysql
   ```

3. **Проблемы с правами**
   ```bash
   sudo chown -R $USER:$USER .
   chmod +x quick-start.sh
   ```

### Проверка портов
```bash
# Проверка занятых портов
netstat -tlnp | grep -E ':(80|443|3000|5000|3306|6379)'

# Освобождение порта
sudo fuser -k 3000/tcp
```

## 📈 Производительность

### Оптимизация для больших нагрузок
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

### Настройка MySQL
```sql
-- Оптимизация для InnoDB
SET GLOBAL innodb_buffer_pool_size = 1073741824;
SET GLOBAL max_connections = 1000;
SET GLOBAL query_cache_size = 268435456;
```

## 🔒 Безопасность

### Рекомендации
- Используйте сильные пароли
- Регулярно обновляйте зависимости
- Настройте fail2ban
- Используйте HTTPS
- Ограничьте доступ к админ панели

### Настройка fail2ban
```bash
# Установка
sudo apt-get install fail2ban

# Настройка
sudo nano /etc/fail2ban/jail.local
```

## 📝 Checklist развертывания

- [ ] Получены API ключи Steam и Market
- [ ] Настроен .env файл
- [ ] Проверены свободные порты
- [ ] Настроен firewall
- [ ] Создан SSL сертификат
- [ ] Запущены контейнеры
- [ ] Проверена работа всех сервисов
- [ ] Настроен мониторинг
- [ ] Создан бэкап базы данных
- [ ] Проверена безопасность

## 🌐 Доступ после развертывания

- **Основной сайт**: https://your-domain.com
- **Админ панель**: https://your-domain.com/admin
- **API**: https://your-domain.com/api
- **Здоровье**: https://your-domain.com/health

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs -f`
2. Перезапустите сервисы: `docker-compose restart`
3. Обратитесь к документации: [README.md](README.md)
4. Создайте issue в GitHub

---

**Удачного развертывания! 🚀**