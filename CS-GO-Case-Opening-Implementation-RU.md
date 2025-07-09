# Руководство по реализации сайта для открытия кейсов CS:GO

## Общий обзор архитектуры

Данное руководство описывает полную реализацию сайта для открытия кейсов CS:GO на основе предоставленной архитектуры.

## Структура проекта

```
csgo-case-opening/
├── frontend/           # Next.js фронтенд
├── backend/            # Node.js Express бэкенд
├── admin/              # Админ панель
├── database/           # MySQL схемы и миграции
├── docker-compose.yml  # Docker конфигурация
└── README.md
```

## 1. База данных (MySQL)

### Основные таблицы

#### Пользователи
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(64) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    avatar_url VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Кейсы
```sql
CREATE TABLE cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT
);
```

#### Предметы (скины)
```sql
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    market_hash_name VARCHAR(255) UNIQUE,
    rarity VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    exterior VARCHAR(50),
    weapon_type VARCHAR(100)
);
```

#### Связка кейс-предмет с шансами
```sql
CREATE TABLE case_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    drop_chance DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### Дополнительные таблицы
- `openings` - История открытий кейсов
- `transactions` - Финансовые транзакции
- `promocodes` - Система промокодов
- `user_inventory` - Инвентарь пользователей
- `withdrawal_requests` - Заявки на вывод

## 2. Бэкенд (Node.js/Express)

### Основные зависимости
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "mysql2": "^3.6.0",
  "passport": "^0.6.0",
  "passport-steam": "^1.0.17",
  "socket.io": "^4.7.2",
  "node-cron": "^3.0.2",
  "axios": "^1.5.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2"
}
```

### Основной сервер (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport конфигурация
passport.use(new SteamStrategy({
  returnURL: 'http://localhost:5000/auth/steam/return',
  realm: 'http://localhost:5000/',
  apiKey: process.env.STEAM_API_KEY
}, async (identifier, profile, done) => {
  // Логика обработки Steam авторизации
  const steamId = identifier.split('/').pop();
  // Сохранение/обновление пользователя в БД
  return done(null, user);
}));

server.listen(5000, () => {
  console.log('Сервер запущен на порту 5000');
});
```

### API маршруты

#### Авторизация через Steam
```javascript
// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/steam', passport.authenticate('steam'));

router.get('/steam/return', 
  passport.authenticate('steam', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

router.get('/user', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Не авторизован' });
  }
});

module.exports = router;
```

#### Работа с кейсами
```javascript
// routes/cases.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Получить все активные кейсы
router.get('/', async (req, res) => {
  try {
    const [cases] = await db.execute(
      'SELECT * FROM cases WHERE is_active = true'
    );
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Открыть кейс
router.post('/:id/open', async (req, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    
    // Проверка баланса
    const [user] = await db.execute(
      'SELECT balance FROM users WHERE id = ?', [userId]
    );
    
    const [caseData] = await db.execute(
      'SELECT price FROM cases WHERE id = ?', [caseId]
    );
    
    if (user[0].balance < caseData[0].price) {
      return res.status(400).json({ error: 'Недостаточно средств' });
    }
    
    // Генерация честного результата
    const seed = generateSeed();
    const wonItem = calculateDrop(seed, caseId);
    
    // Обновление баланса и сохранение открытия
    await db.execute(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [caseData[0].price, userId]
    );
    
    await db.execute(
      'INSERT INTO openings (user_id, case_id, item_id, price_won, seed) VALUES (?, ?, ?, ?, ?)',
      [userId, caseId, wonItem.id, wonItem.price, seed]
    );
    
    // Добавление в инвентарь
    await db.execute(
      'INSERT INTO user_inventory (user_id, item_id) VALUES (?, ?)',
      [userId, wonItem.id]
    );
    
    // Отправка через Socket.IO
    io.emit('case_opened', {
      user: req.user.username,
      item: wonItem,
      case: caseData[0]
    });
    
    res.json({ item: wonItem, seed });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при открытии кейса' });
  }
});

module.exports = router;
```

#### Провабл фейр система
```javascript
// utils/provablyFair.js
const crypto = require('crypto');

const generateSeed = () => {
  return crypto.randomBytes(32).toString('hex');
};

const calculateDrop = async (seed, caseId) => {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const random = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  
  // Получение предметов кейса с шансами
  const [items] = await db.execute(`
    SELECT i.*, ci.drop_chance 
    FROM items i
    JOIN case_items ci ON i.id = ci.item_id
    WHERE ci.case_id = ?
    ORDER BY ci.drop_chance ASC
  `, [caseId]);
  
  let totalChance = 0;
  for (const item of items) {
    totalChance += item.drop_chance;
    if (random * 100 <= totalChance) {
      return item;
    }
  }
  
  return items[items.length - 1]; // Fallback
};

module.exports = { generateSeed, calculateDrop };
```

## 3. Фронтенд (Next.js)

### Структура проекта
```
frontend/
├── pages/
│   ├── index.js          # Главная страница
│   ├── cases/
│   │   └── [id].js       # Страница кейса
│   ├── profile.js        # Профиль пользователя
│   └── admin/
│       └── index.js      # Админ панель
├── components/
│   ├── CaseCard.js       # Карточка кейса
│   ├── CaseOpening.js    # Анимация открытия
│   ├── Header.js         # Шапка сайта
│   └── Inventory.js      # Инвентарь
└── styles/
    └── globals.css       # Стили
```

### Главная страница
```jsx
// pages/index.js
import { useState, useEffect } from 'react';
import CaseCard from '../components/CaseCard';
import RecentWins from '../components/RecentWins';

export default function Home() {
  const [cases, setCases] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  
  useEffect(() => {
    fetchCases();
    fetchRecentWins();
  }, []);
  
  const fetchCases = async () => {
    const response = await fetch('/api/cases');
    const data = await response.json();
    setCases(data);
  };
  
  const fetchRecentWins = async () => {
    const response = await fetch('/api/recent-wins');
    const data = await response.json();
    setRecentWins(data);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          CS:GO Case Opening
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cases.map(case => (
            <CaseCard key={case.id} case={case} />
          ))}
        </div>
        
        <RecentWins wins={recentWins} />
      </div>
    </div>
  );
}
```

### Карточка кейса
```jsx
// components/CaseCard.js
import Link from 'next/link';
import Image from 'next/image';

export default function CaseCard({ case: caseData }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
      <div className="relative h-48 mb-4">
        <Image
          src={caseData.image_url}
          alt={caseData.name}
          fill
          className="object-cover rounded"
        />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{caseData.name}</h3>
      <p className="text-gray-400 mb-4">{caseData.description}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-yellow-400">
          ${caseData.price}
        </span>
        <Link
          href={`/cases/${caseData.id}`}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
        >
          Открыть кейс
        </Link>
      </div>
    </div>
  );
}
```

### Анимация открытия кейса
```jsx
// components/CaseOpening.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CaseOpening({ caseId, onResult }) {
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState(null);
  const [items, setItems] = useState([]);
  
  const openCase = async () => {
    setIsOpening(true);
    
    try {
      const response = await fetch(`/api/cases/${caseId}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      // Анимация прокрутки предметов
      setTimeout(() => {
        setResult(data.item);
        setIsOpening(false);
        onResult(data);
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка при открытии кейса:', error);
      setIsOpening(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {!isOpening && !result && (
        <button
          onClick={openCase}
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded text-lg font-semibold transition-colors"
        >
          Открыть кейс
        </button>
      )}
      
      {isOpening && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Открываем кейс...</p>
        </div>
      )}
      
      {result && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg">
            <img src={result.image_url} alt={result.name} className="mx-auto mb-4 h-32" />
            <h3 className="text-xl font-bold mb-2">{result.name}</h3>
            <p className="text-2xl font-bold">${result.price}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

## 4. Админ панель

### Управление кейсами
```jsx
// pages/admin/cases.js
import { useState, useEffect } from 'react';

export default function AdminCases() {
  const [cases, setCases] = useState([]);
  const [editingCase, setEditingCase] = useState(null);
  
  const saveCase = async (caseData) => {
    const url = caseData.id ? `/api/admin/cases/${caseData.id}` : '/api/admin/cases';
    const method = caseData.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });
    
    fetchCases();
    setEditingCase(null);
  };
  
  return (
    <div className="admin-panel">
      <h1 className="text-2xl font-bold mb-6">Управление кейсами</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl mb-4">Список кейсов</h2>
          {cases.map(case => (
            <div key={case.id} className="bg-gray-700 p-4 rounded mb-4">
              <h3 className="font-semibold">{case.name}</h3>
              <p className="text-gray-400">${case.price}</p>
              <button
                onClick={() => setEditingCase(case)}
                className="bg-blue-600 px-3 py-1 rounded mt-2"
              >
                Редактировать
              </button>
            </div>
          ))}
        </div>
        
        <div>
          <CaseEditor
            case={editingCase}
            onSave={saveCase}
            onCancel={() => setEditingCase(null)}
          />
        </div>
      </div>
    </div>
  );
}
```

## 5. Интеграция с market.csgo.com

### Сервис обновления цен
```javascript
// services/marketService.js
const axios = require('axios');
const cron = require('node-cron');

class MarketService {
  constructor() {
    this.apiKey = process.env.MARKET_API_KEY;
    this.baseUrl = 'https://market.csgo.com/api/v2';
  }
  
  async updateItemPrices() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/prices/USD.json?key=${this.apiKey}`
      );
      
      const prices = response.data.items;
      
      for (const [hashName, price] of Object.entries(prices)) {
        await db.execute(
          'UPDATE items SET price = ? WHERE market_hash_name = ?',
          [price, hashName]
        );
      }
      
      console.log('Цены обновлены успешно');
    } catch (error) {
      console.error('Ошибка обновления цен:', error);
    }
  }
  
  async getItemImage(hashName) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/get-item-image/${hashName}`
      );
      return response.data.image_url;
    } catch (error) {
      console.error('Ошибка получения изображения:', error);
      return null;
    }
  }
}

// Автоматическое обновление каждый час
cron.schedule('0 * * * *', async () => {
  const marketService = new MarketService();
  await marketService.updateItemPrices();
});

module.exports = MarketService;
```

## 6. Real-time обновления с Socket.IO

### Клиентская часть
```javascript
// hooks/useSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [recentWins, setRecentWins] = useState([]);
  
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('case_opened', (data) => {
      setRecentWins(prev => [data, ...prev.slice(0, 9)]);
    });
    
    return () => newSocket.close();
  }, []);
  
  return { socket, recentWins };
};
```

## 7. Система промокодов

### API для промокодов
```javascript
// routes/promocodes.js
router.post('/activate', async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;
  
  try {
    // Проверка промокода
    const [promo] = await db.execute(
      'SELECT * FROM promocodes WHERE code = ? AND is_active = true',
      [code]
    );
    
    if (!promo[0]) {
      return res.status(400).json({ error: 'Промокод не найден' });
    }
    
    // Проверка использования
    const [used] = await db.execute(
      'SELECT * FROM promocode_uses WHERE user_id = ? AND promocode_id = ?',
      [userId, promo[0].id]
    );
    
    if (used[0]) {
      return res.status(400).json({ error: 'Промокод уже использован' });
    }
    
    // Активация
    await db.execute(
      'INSERT INTO promocode_uses (user_id, promocode_id) VALUES (?, ?)',
      [userId, promo[0].id]
    );
    
    await db.execute(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [promo[0].bonus_amount, userId]
    );
    
    res.json({ 
      success: true, 
      bonus: promo[0].bonus_amount 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
```

## 8. Развертывание

### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=csgo_case_opening
      - STEAM_API_KEY=${STEAM_API_KEY}
      - MARKET_API_KEY=${MARKET_API_KEY}
    depends_on:
      - mysql
  
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=csgo_case_opening
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - ./database/sample_data.sql:/docker-entrypoint-initdb.d/sample_data.sql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

## 9. Безопасность

### Основные меры безопасности
- Проверка Steam токенов
- Валидация всех входных данных
- Защита от SQL инъекций
- Rate limiting для API
- HTTPS в продакшене
- Хеширование критичных данных

### Middleware для проверки аутентификации
```javascript
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Нет прав доступа' });
  }
  next();
};
```

## 10. Оптимизация производительности

### Кэширование
```javascript
const redis = require('redis');
const client = redis.createClient();

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

## Заключение

Эта реализация предоставляет полнофункциональный сайт для открытия кейсов CS:GO с современными технологиями, функциями безопасности и масштабируемой архитектурой. Система включает провабл фейр механику, обновления в реальном времени и надежные инструменты администрирования.

Основные особенности:
- ✅ Steam авторизация через OpenID
- ✅ Провабл фейр система
- ✅ Интеграция с market.csgo.com
- ✅ Real-time обновления
- ✅ Система промокодов
- ✅ Админ панель
- ✅ Мобильная оптимизация
- ✅ Docker развертывание