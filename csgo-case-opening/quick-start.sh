#!/bin/bash

# CS:GO Case Opening Website - Quick Start Script
# Этот скрипт поможет быстро развернуть проект

echo "🚀 Запуск CS:GO Case Opening Website..."
echo "================================================"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден. Пожалуйста, установите Docker и Docker Compose."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не найден. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Проверка файла .env
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаю из примера..."
    cp .env.example .env
    echo "✅ Файл .env создан. Пожалуйста, отредактируйте его и укажите ваши API ключи:"
    echo "   - STEAM_API_KEY"
    echo "   - MARKET_API_KEY"
    echo "   - SESSION_SECRET"
    echo ""
    echo "📖 Инструкции по получению API ключей:"
    echo "   Steam API: https://steamcommunity.com/dev/apikey"
    echo "   Market API: https://market.csgo.com"
    echo ""
    read -p "Нажмите Enter после настройки .env файла..."
fi

# Создание необходимых директорий
echo "📁 Создание необходимых директорий..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p nginx/ssl
mkdir -p frontend/public/images

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Сборка и запуск контейнеров
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up -d --build

# Проверка статуса контейнеров
echo "⏳ Ожидание запуска сервисов..."
sleep 30

echo "🔍 Проверка статуса сервисов..."
docker-compose ps

# Проверка доступности сервисов
echo "🌐 Проверка доступности сервисов..."

# Проверка базы данных
if docker-compose exec mysql mysql -u root -pcsgocaseopening2024 -e "SELECT 1" &> /dev/null; then
    echo "✅ MySQL запущен и доступен"
else
    echo "❌ MySQL недоступен"
fi

# Проверка Redis
if docker-compose exec redis redis-cli ping &> /dev/null; then
    echo "✅ Redis запущен и доступен"
else
    echo "❌ Redis недоступен"
fi

# Проверка бэкенда
if curl -s http://localhost:5000/health &> /dev/null; then
    echo "✅ Backend запущен и доступен"
else
    echo "❌ Backend недоступен"
fi

# Проверка фронтенда
if curl -s http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend запущен и доступен"
else
    echo "❌ Frontend недоступен"
fi

echo ""
echo "================================================"
echo "🎉 Развертывание завершено!"
echo ""
echo "📝 Полезные команды:"
echo "   Просмотр логов: docker-compose logs -f"
echo "   Остановка:      docker-compose down"
echo "   Перезапуск:     docker-compose restart"
echo ""
echo "🌐 Доступные сервисы:"
echo "   Frontend:       http://localhost:3000"
echo "   Backend API:    http://localhost:5000"
echo "   MySQL:          localhost:3306"
echo "   Redis:          localhost:6379"
echo ""
echo "🔧 Для разработки:"
echo "   cd backend && npm run dev"
echo "   cd frontend && npm run dev"
echo ""
echo "📚 Документация: README.md"
echo "================================================"

# Автоматическое открытие браузера (опционально)
if command -v xdg-open &> /dev/null; then
    read -p "Открыть сайт в браузере? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:3000
    fi
elif command -v open &> /dev/null; then
    read -p "Открыть сайт в браузере? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:3000
    fi
fi

echo "Готово! 🚀"