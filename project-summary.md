# 🎮 CS:GO Case Opening Website - Полная архитектура проекта

## 📋 Обзор проекта

Полнофункциональный сайт для открытия кейсов CS:GO с админ панелью, интеграцией Steam авторизации и автоматической синхронизацией цен с market.csgo.com.

## 🏗️ Архитектура

### 1. **Database Layer (MySQL)**
- **Файл**: `database/schema.sql`
- **Таблицы**: 12 основных таблиц
- **Особенности**:
  - Пользователи с Steam интеграцией
  - Система кейсов и предметов
  - История открытий с честным рандомом
  - Транзакции и промокоды
  - Аудит админских действий

### 2. **Backend Layer (Node.js + Express)**
- **Директория**: `backend/`
- **Основные компоненты**:

#### Models (Sequelize ORM)
- `User.js` - Пользователи
- `Case.js` - Кейсы
- `Item.js` - Предметы (скины)
- `CaseItem.js` - Связь кейс-предмет
- `Opening.js` - История открытий
- `Transaction.js` - Транзакции
- `Promocode.js` - Промокоды
- `UserInventory.js` - Инвентарь
- `SiteSetting.js` - Настройки
- `AdminAudit.js` - Аудит

#### Services
- `caseService.js` - Логика открытия кейсов с честным рандомом
- `marketService.js` - Интеграция с market.csgo.com
- `cronJobs.js` - Автоматические задачи

#### API Routes
- `/api/auth` - Steam авторизация
- `/api/cases` - Работа с кейсами
- `/api/users` - Профили и инвентарь
- `/api/items` - Каталог предметов
- `/api/transactions` - Промокоды и депозиты
- `/api/stats` - Статистика сайта
- `/api/admin` - Админ панель

#### Security & Utils
- JWT авторизация
- Rate limiting
- Валидация данных
- Логирование (Winston)
- Обработка ошибок

## 🎯 Ключевые особенности

### 🔐 Авторизация
- Steam OpenID интеграция
- Автоматическая регистрация новых пользователей
- Приветственный бонус
- JWT токены для API

### 🎲 Честный рандом
- Crypto-based seed генерация
- Публичная валидация результатов
- Прозрачная система вероятностей
- Аудит всех открытий

### 💰 Финансовая система
- Управление балансом
- Промокоды (баланс/процент/бесплатный кейс)
- История транзакций
- Интеграция с платежными системами (заглушка)

### 📊 Статистика и аналитика
- Глобальная статистика сайта
- Пользовательская статистика
- Топ игроков по прибыли
- Временные графики

### 🛠️ Админ панель
- Управление пользователями
- Создание кейсов
- Управление предметами
- Промокоды
- Настройки сайта
- Полный аудит действий

### 🔄 Автоматизация
- Обновление цен каждый час
- Парсинг новых предметов
- Очистка логов
- Кэширование настроек

## 📁 Структура файлов

```
project/
├── README.md                           # Главное описание
├── project-summary.md                  # Этот файл
├── database/
│   └── schema.sql                      # Схема MySQL БД
├── backend/
│   ├── package.json                    # Зависимости Node.js
│   ├── .env.example                    # Пример конфигурации
│   ├── README.md                       # Документация backend
│   └── src/
│       ├── app.js                      # Главный файл приложения
│       ├── config/
│       │   ├── database.js             # Конфигурация Sequelize
│       │   └── passport.js             # Steam авторизация
│       ├── models/
│       │   ├── index.js                # Ассоциации моделей
│       │   ├── User.js                 # Модель пользователя
│       │   ├── Case.js                 # Модель кейса
│       │   ├── Item.js                 # Модель предмета
│       │   ├── CaseItem.js             # Связь кейс-предмет
│       │   ├── Opening.js              # История открытий
│       │   ├── Transaction.js          # Транзакции
│       │   ├── Promocode.js            # Промокоды
│       │   ├── PromocodeUse.js         # Использование промокодов
│       │   ├── UserInventory.js        # Инвентарь пользователей
│       │   ├── SiteSetting.js          # Настройки сайта
│       │   └── AdminAudit.js           # Аудит админов
│       ├── routes/
│       │   ├── auth.js                 # Маршруты авторизации
│       │   ├── cases.js                # Маршруты кейсов
│       │   ├── users.js                # Маршруты пользователей
│       │   ├── items.js                # Маршруты предметов
│       │   ├── transactions.js         # Маршруты транзакций
│       │   ├── stats.js                # Маршруты статистики
│       │   └── admin.js                # Админ маршруты
│       ├── services/
│       │   ├── caseService.js          # Сервис кейсов
│       │   ├── marketService.js        # Сервис market.csgo.com
│       │   └── cronJobs.js             # Cron задачи
│       ├── middleware/
│       │   ├── auth.js                 # Middleware авторизации
│       │   └── errorHandler.js         # Обработчик ошибок
│       └── utils/
│           └── logger.js               # Логгер Winston
├── frontend/                           # (Будет создан в следующей итерации)
├── admin/                              # (Будет создан в следующей итерации)
└── shared/                             # (Общие утилиты и типы)
```

## 🚀 Быстрый старт

### 1. Подготовка окружения
```bash
# Клонировать репозиторий
git clone <repository-url>
cd csgo-case-website

# Настроить базу данных
mysql -u root -p
CREATE DATABASE csgo_case_db;
mysql -u root -p csgo_case_db < database/schema.sql
```

### 2. Backend запуск
```bash
cd backend
npm install
cp .env.example .env
# Отредактировать .env с вашими настройками
npm run dev
```

### 3. Необходимые API ключи
- **Steam API Key**: https://steamcommunity.com/dev/apikey
- **Market CSGO API Key**: https://market.csgo.com (в настройках аккаунта)

### 4. Проверка работы
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health
- Steam auth: http://localhost:3001/api/auth/steam

## 📊 Технические характеристики

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL 8.0+
- **Auth**: Passport.js (Steam OpenID)
- **Security**: Helmet, Rate Limiting, JWT
- **Logging**: Winston
- **File Upload**: Multer
- **Cron**: node-cron

### Database
- **12 таблиц** с полными индексами
- **Внешние ключи** для целостности данных
- **JSON поля** для гибкого хранения
- **Computed columns** для производных значений
- **Аудит система** для отслеживания изменений

### API
- **RESTful design**
- **JWT authentication**
- **Comprehensive error handling**
- **Request validation**
- **Rate limiting**
- **CORS support**

## 🔧 Конфигурация и деплой

### Переменные окружения
- База данных (MySQL)
- Steam API ключ
- Market CSGO API ключ
- JWT секреты
- Настройки загрузки файлов
- Rate limiting конфигурация

### Продакшн готовность
- ✅ Error handling
- ✅ Logging
- ✅ Security headers
- ✅ Rate limiting  
- ✅ Data validation
- ✅ Transaction safety
- ✅ Graceful shutdown
- ✅ Health checks

## 🛡️ Безопасность

### Реализованные меры
- Helmet.js для HTTP заголовков
- Rate limiting против DDoS
- JWT токены с истечением
- Валидация всех входных данных
- SQL injection protection (ORM)
- XSS protection
- Аудит всех админских действий

### Честность игры
- Crypto-based random generation
- Публичные seeds для верификации
- Неизменяемая история открытий
- Transparent probability system

## 📈 Масштабируемость

### Горизонтальное масштабирование
- Stateless backend architecture
- JWT tokens (no server sessions)
- Database connection pooling
- Async/await pattern throughout

### Производительность
- Database indexing
- Query optimization
- Connection pooling
- Compression middleware
- Static file serving

## 🔄 Следующие этапы

### Frontend (React/Next.js)
- Современный UI с TailwindCSS
- Анимации открытия кейсов
- Real-time статистика
- Responsive design

### Admin Panel
- React Admin dashboard
- Графики и аналитика
- Массовые операции
- Real-time мониторинг

### Дополнительные features
- WebSocket для real-time обновлений
- Система рефералов
- Множественное открытие кейсов
- Интеграция с платежными системами
- Mobile app (React Native)

## 📝 Статус проекта

✅ **Завершено**:
- Полная архитектура базы данных
- Backend API с 50+ endpoints
- Steam авторизация
- Система честного рандома
- Market.csgo.com интеграция
- Админ панель API
- Система промокодов
- Comprehensive logging & monitoring

🔄 **В процессе**:
- Frontend разработка
- Admin dashboard UI

⏳ **Планируется**:
- Платежная интеграция
- Mobile приложение
- Advanced аналитика

---

**Архитектура создана**: Полнофункциональный backend с базой данных готов к использованию
**Технологический стек**: Node.js, Express, MySQL, Sequelize, JWT, Winston
**API endpoints**: 50+ полностью функциональных маршрутов
**Безопасность**: Enterprise-level security practices
**Масштабируемость**: Готов к продакшн нагрузкам