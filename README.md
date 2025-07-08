# 🎮 CS:GO Case Opening Website

Полнофункциональный сайт для открытия кейсов CS:GO с админ панелью и интеграцией Steam.

## 🏗️ Архитектура проекта

### Frontend (React + Next.js + TailwindCSS)
- **Главная страница** - текущие кейсы, недавние выигрыши, промо
- **Страница кейса** - анимация открытия, список предметов
- **Профиль пользователя** - инвентарь, история открытий, выводы
- **Страница пополнения баланса**
- **Статистика** - глобальная и по пользователям
- **Авторизация** - OAuth через Steam

### Backend (Node.js + Express)
- Steam OpenID авторизация
- Обработка логики кейсов (рандом, справедливость, drop-rate)
- Работа с базой данных MySQL
- API для фронтенда
- Интеграция с market.csgo.com

### Admin Panel
- Создание и редактирование кейсов
- Управление скинами (парсинг с market.csgo.com)
- Управление пользователями
- Финансовая статистика
- Настройки сайта

### База данных (MySQL)
- Пользователи и авторизация
- Кейсы и предметы
- История открытий
- Транзакции

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
```

## 🛠️ Технологии
- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, MySQL, Passport.js
- **Admin**: Next.js, React Admin
- **Database**: MySQL
- **API**: market.csgo.com integration

## 📝 Переменные окружения
Скопируйте `.env.example` в `.env` и заполните необходимые значения.