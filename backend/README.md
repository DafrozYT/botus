# 🎮 CS:GO Case Opening Backend

Backend сервер для сайта открытия кейсов CS:GO с интеграцией Steam авторизации и market.csgo.com API.

## 🚀 Возможности

### 🔐 Авторизация
- Steam OpenID авторизация
- JWT токены для API
- Роли пользователей (админ/пользователь)
- Защита от банов

### 🎯 Система кейсов
- Честный рандом с crypto seeds
- Валидация открытий
- Система редкостей
- Статистика открытий

### 💰 Финансовая система
- Управление балансом пользователей
- Система промокодов
- История транзакций
- Депозиты и выводы

### 📊 Статистика
- Глобальная статистика сайта
- Пользовательская статистика
- Топ игроков
- Аналитика по времени

### 🛠️ Админ панель
- Управление пользователями
- Создание и редактирование кейсов
- Управление предметами
- Системные настройки
- Аудит действий

### 🔄 Интеграция market.csgo.com
- Автоматическое обновление цен
- Парсинг новых предметов
- Cron задачи для синхронизации

## 📋 Установка

### Требования
- Node.js >= 18.0.0
- MySQL >= 8.0
- NPM или Yarn

### Быстрый старт

1. **Установка зависимостей:**
```bash
cd backend
npm install
```

2. **Настройка переменных окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

3. **Настройка базы данных:**
```bash
# Создайте базу данных MySQL
mysql -u root -p
CREATE DATABASE csgo_case_db;

# Выполните миграцию
mysql -u root -p csgo_case_db < ../database/schema.sql
```

4. **Запуск сервера:**
```bash
# Разработка
npm run dev

# Продакшн
npm start
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DB_HOST` | Хост MySQL | `localhost` |
| `DB_PORT` | Порт MySQL | `3306` |
| `DB_NAME` | Имя базы данных | `csgo_case_db` |
| `DB_USER` | Пользователь MySQL | `root` |
| `DB_PASSWORD` | Пароль MySQL | - |
| `PORT` | Порт сервера | `3001` |
| `STEAM_API_KEY` | API ключ Steam | - |
| `MARKET_CSGO_API_KEY` | API ключ market.csgo.com | - |
| `JWT_SECRET` | Секрет для JWT | - |
| `SESSION_SECRET` | Секрет для сессий | - |

### Steam API
1. Получите API ключ на https://steamcommunity.com/dev/apikey
2. Укажите его в переменной `STEAM_API_KEY`

### Market CSGO API
1. Зарегистрируйтесь на market.csgo.com
2. Получите API ключ в настройках
3. Укажите его в переменной `MARKET_CSGO_API_KEY`

## 📚 API Документация

### Авторизация
- `GET /api/auth/steam` - Начать авторизацию через Steam
- `GET /api/auth/steam/return` - Callback от Steam
- `POST /api/auth/logout` - Выход
- `GET /api/auth/status` - Статус авторизации

### Кейсы
- `GET /api/cases` - Получить все кейсы
- `GET /api/cases/:id` - Информация о кейсе
- `POST /api/cases/:id/open` - Открыть кейс
- `GET /api/cases/:id/stats` - Статистика кейса
- `POST /api/cases/validate` - Валидация честности

### Пользователи
- `GET /api/users/profile` - Профиль пользователя
- `PUT /api/users/profile` - Обновить профиль
- `GET /api/users/inventory` - Инвентарь
- `GET /api/users/openings` - История открытий
- `GET /api/users/stats` - Статистика пользователя
- `POST /api/users/withdraw/:id` - Вывод предмета

### Предметы
- `GET /api/items` - Все предметы с фильтрами
- `GET /api/items/:id` - Информация о предмете
- `GET /api/items/meta/rarities` - Доступные редкости
- `GET /api/items/meta/types` - Типы оружия

### Транзакции
- `POST /api/transactions/promocode` - Применить промокод
- `POST /api/transactions/deposit` - Создать депозит

### Статистика
- `GET /api/stats/global` - Глобальная статистика
- `GET /api/stats/recent-wins` - Недавние выигрыши
- `GET /api/stats/top-users` - Топ пользователей
- `GET /api/stats/timeline` - Временная статистика

### Админ панель (требует админских прав)
- `GET /api/admin/users` - Управление пользователями
- `POST /api/admin/cases` - Создать кейс
- `PUT /api/admin/cases/:id` - Обновить кейс
- `POST /api/admin/items/update-prices` - Обновить цены
- `POST /api/admin/promocodes` - Создать промокод
- `GET /api/admin/settings` - Настройки сайта
- `GET /api/admin/audit` - Логи действий

## 🔄 Cron задачи

Система автоматически запускает следующие задачи:

- **Каждый час**: Обновление цен с market.csgo.com
- **Каждые 6 часов**: Парсинг новых предметов
- **Ежедневно в 2:00**: Очистка старых логов
- **Каждые 5 минут**: Обновление кэша настроек

## 🛡️ Безопасность

### Реализованные меры:
- Helmet.js для HTTP заголовков
- Rate limiting
- JWT токены с истечением
- Валидация всех входных данных
- Аудит админских действий
- Защита от SQL инъекций (Sequelize ORM)

### Рекомендации:
- Используйте HTTPS в продакшне
- Регулярно обновляйте зависимости
- Настройте firewall для базы данных
- Используйте сильные пароли

## 📊 Мониторинг

### Логирование
Все логи сохраняются в папке `logs/`:
- `error.log` - Ошибки
- `combined.log` - Все события

### Health Check
`GET /health` - Проверка состояния сервера

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:coverage
```

## 🚀 Деплой

### Docker (рекомендуется)
```bash
# Создайте Dockerfile и docker-compose.yml
docker-compose up -d
```

### PM2
```bash
npm install -g pm2
pm2 start src/app.js --name "csgo-case-backend"
```

## 🔧 Разработка

### Структура проекта
```
backend/
├── src/
│   ├── config/          # Конфигурация
│   ├── controllers/     # Контроллеры (не используется)
│   ├── middleware/      # Middleware
│   ├── models/          # Модели Sequelize
│   ├── routes/          # Маршруты API
│   ├── services/        # Бизнес-логика
│   └── utils/           # Утилиты
├── uploads/             # Загруженные файлы
├── logs/                # Логи
└── package.json
```

### Добавление новых features
1. Создайте модель в `models/`
2. Добавьте маршруты в `routes/`
3. Реализуйте бизнес-логику в `services/`
4. Обновите документацию

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл LICENSE

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи в `logs/`
2. Убедитесь в правильности конфигурации
3. Проверьте подключение к базе данных
4. Создайте issue в репозитории