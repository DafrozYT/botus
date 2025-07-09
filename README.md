# CS:GO Case Opening Website

Полнофункциональный сайт для открытия кейсов CS:GO с современным дизайном, провабл фейр системой и интеграцией с market.csgo.com.

## 🚀 Особенности

- ✅ **Steam авторизация** через OpenID
- ✅ **Провабл фейр система** с криптографическими сидами
- ✅ **Интеграция с market.csgo.com** для актуальных цен
- ✅ **Real-time обновления** через Socket.IO
- ✅ **Система промокодов** с гибкими настройками
- ✅ **Админ панель** для управления контентом
- ✅ **Мобильная оптимизация** с адаптивным дизайном
- ✅ **Docker развертывание** для простой установки

## 📋 Требования

- Docker & Docker Compose
- Node.js 18+ (для разработки)
- MySQL 8.0+
- Redis 7+
- Steam API ключ
- Market.csgo.com API ключ

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/csgo-case-opening.git
cd csgo-case-opening
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Отредактируйте файл `.env` и укажите ваши API ключи:

```env
STEAM_API_KEY=your_steam_api_key_here
MARKET_API_KEY=your_market_csgo_api_key_here
SESSION_SECRET=your_super_secret_session_key_here
```

### 3. Запуск с Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка сервисов
docker-compose down
```

### 4. Инициализация базы данных

База данных автоматически создастся при первом запуске с помощью скриптов:
- `database/schema.sql` - структура таблиц
- `database/sample_data.sql` - тестовые данные

## 🔧 Разработка

### Локальная разработка

```bash
# Установка зависимостей бэкенда
cd backend
npm install

# Запуск бэкенда в режиме разработки
npm run dev

# В отдельном терминале - фронтенд
cd frontend
npm install
npm run dev
```

### Структура проекта

```
csgo-case-opening/
├── frontend/              # Next.js приложение
│   ├── components/        # React компоненты
│   ├── pages/            # Страницы приложения
│   ├── styles/           # CSS стили
│   └── hooks/            # Custom hooks
├── backend/              # Node.js Express API
│   ├── routes/           # API маршруты
│   ├── services/         # Бизнес логика
│   ├── utils/            # Утилиты
│   └── config/           # Конфигурация
├── database/             # SQL схемы и данные
├── nginx/               # Nginx конфигурация
└── docker-compose.yml   # Docker сервисы
```

## 🔑 Получение API ключей

### Steam API ключ

1. Перейдите на [Steam Web API](https://steamcommunity.com/dev/apikey)
2. Войдите в Steam аккаунт
3. Укажите доменное имя вашего сайта
4. Скопируйте полученный ключ

### Market.csgo.com API ключ

1. Зарегистрируйтесь на [market.csgo.com](https://market.csgo.com)
2. Перейдите в раздел API
3. Создайте новый API ключ
4. Скопируйте ключ в настройки

## 📱 Использование

### Для пользователей

1. Откройте сайт в браузере
2. Войдите через Steam
3. Пополните баланс (в тестовом режиме)
4. Выберите кейс для открытия
5. Наслаждайтесь анимацией и получите предмет

### Для администраторов

1. Добавьте ваш Steam ID в переменную `ADMIN_STEAM_IDS`
2. Войдите на сайт через Steam
3. Перейдите в админ панель (`/admin`)
4. Управляйте кейсами, предметами и пользователями

## 🔒 Безопасность

### Реализованные меры

- **Steam OpenID аутентификация**
- **SQL injection защита** с параметризованными запросами
- **XSS защита** с helmet.js
- **CSRF токены** для форм
- **Rate limiting** для API эндпоинтов
- **Валидация данных** на клиенте и сервере

### Рекомендации для продакшена

```bash
# Используйте сильные пароли
SESSION_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)

# Настройте SSL сертификаты
# Используйте прокси сервер (nginx)
# Настройте мониторинг и логирование
```

## 📊 Провабл фейр

Система честной игры реализована с использованием:

- **Криптографические сиды** для каждого открытия
- **SHA-256 хеширование** для генерации результатов
- **Публичная верификация** результатов
- **Прозрачные шансы** для всех предметов

### Верификация результата

```javascript
// Пример проверки результата
const crypto = require('crypto');

function verifyResult(seed, caseId, result) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const random = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  // Проверка соответствия результата
}
```

## 🎨 Кастомизация

### Изменение дизайна

```bash
# Редактирование стилей
cd frontend/styles
# Измените globals.css или используйте TailwindCSS классы
```

### Добавление новых кейсов

1. Войдите в админ панель
2. Перейдите в "Управление кейсами"
3. Нажмите "Добавить кейс"
4. Укажите название, цену и изображение
5. Добавьте предметы с шансами выпадения

## 🔧 API Документация

### Основные эндпоинты

```http
GET /api/cases - Получить все кейсы
POST /api/cases/:id/open - Открыть кейс
GET /api/user/profile - Профиль пользователя
GET /api/user/inventory - Инвентарь
POST /api/promocodes/activate - Активировать промокод
```

### Авторизация

```http
GET /auth/steam - Авторизация через Steam
GET /auth/steam/return - Callback URL для Steam
GET /auth/user - Текущий пользователь
POST /auth/logout - Выход
```

## 📈 Мониторинг

### Логи

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend

# Логи в реальном времени
tail -f backend/logs/app.log
```

### Метрики

- Количество открытых кейсов
- Активные пользователи
- Доходы и расходы
- Популярные предметы

## 🚨 Устранение проблем

### Частые проблемы

**Проблема:** Ошибка подключения к базе данных
```bash
# Проверьте статус MySQL
docker-compose ps mysql

# Перезапустите базу данных
docker-compose restart mysql
```

**Проблема:** Steam авторизация не работает
```bash
# Проверьте правильность Steam API ключа
# Убедитесь, что callback URL настроен правильно
```

**Проблема:** Цены не обновляются
```bash
# Проверьте Market API ключ
# Проверьте логи обновления цен
docker-compose logs backend | grep "market"
```

## 🤝 Вклад в проект

1. Создайте форк репозитория
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License - подробности в файле `LICENSE`

## 📞 Поддержка

- GitHub Issues для багов и предложений
- Discord сервер для общения
- Email: support@example.com

---

**Внимание:** Этот проект предназначен только для образовательных целей. Убедитесь, что соблюдаете все местные законы и правила при использовании.