# Case Opening Website

A complete case opening platform similar to CS:GO case opening sites, featuring provably fair algorithm, real-time WebSocket updates, and modern web technologies.

## 🏗️ Architecture

```
project-root/
├── backend/               # Node.js API & WebSocket server
├── frontend/              # Laravel frontend (user interface)
├── admin/                 # Laravel admin panel
├── shared/                # Shared utilities and configurations
└── docker/                # Docker containers setup
```

## 🚀 Features

### Core Features
- **Steam OAuth Authentication** - Secure login via Steam
- **Provably Fair Algorithm** - Cryptographic verification of fairness
- **Real-time WebSocket** - Live drops feed and case opening animations
- **Case Management** - Create, edit, and manage cases with items
- **User Balance System** - Deposits, withdrawals, and transaction history
- **Leaderboards** - Top players by winnings, cases opened, etc.
- **Admin Dashboard** - Complete management interface

### Technical Features
- **Microservices Architecture** - Separate backend and frontend services
- **MongoDB** - Primary database for case data and user information
- **Redis** - Caching and session management
- **WebSocket** - Real-time communication
- **Modern UI** - Responsive design with Tailwind CSS
- **Docker Support** - Easy deployment and scaling

## 🛠️ Tech Stack

### Backend (Node.js)
- **Framework**: Express.js / Fastify
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT + Steam OAuth
- **WebSocket**: Socket.io
- **Validation**: Joi / Express-validator

### Frontend (Laravel)
- **Framework**: Laravel 10+
- **Frontend**: Blade templates + Vue.js components
- **Styling**: Tailwind CSS
- **Authentication**: Laravel Sanctum
- **Database**: MySQL (user sessions, frontend cache)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Process Management**: PM2 (for Node.js)

## 📦 Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PHP 8.1+ (for local development)
- Steam API Key

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd case-opening-website
```

2. **Configure environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Steam API key and database credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with database and API configurations

# Admin
cp admin/.env.example admin/.env
# Edit admin/.env with database and API configurations
```

3. **Start the services**
```bash
cd docker
docker-compose up -d
```

4. **Initialize the database**
```bash
# Run database migrations
docker-compose exec frontend php artisan migrate
docker-compose exec admin php artisan migrate

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

5. **Access the application**
- Frontend: http://localhost:8000
- Admin Panel: http://localhost:8001
- Backend API: http://localhost:3000

### Local Development Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure .env file
npm run dev
```

#### Frontend Setup
```bash
cd frontend
composer install
npm install
cp .env.example .env
php artisan key:generate
# Configure .env file
php artisan migrate
npm run dev
php artisan serve
```

#### Admin Setup
```bash
cd admin
composer install
npm install
cp .env.example .env
php artisan key:generate
# Configure .env file
php artisan migrate
npm run dev
php artisan serve --port=8001
```

## 🔧 Configuration

### Steam API Configuration
1. Get your Steam API key from [Steam Web API](https://steamcommunity.com/dev/apikey)
2. Add it to your environment files:
   - `backend/.env` → `STEAM_API_KEY`
   - `frontend/.env` → `STEAM_API_KEY`

### Database Configuration
- **MongoDB**: Used for cases, items, drops, and user data
- **MySQL**: Used for Laravel sessions and frontend caching
- **Redis**: Used for caching and WebSocket session management

### Environment Variables

#### Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/case-opening
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
STEAM_API_KEY=your_steam_api_key
FRONTEND_URL=http://localhost:8000
```

#### Frontend (.env)
```env
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_DATABASE=case_opening_frontend
BACKEND_API_URL=http://localhost:3000/api
BACKEND_WS_URL=ws://localhost:3000
STEAM_API_KEY=your_steam_api_key
```

## 🎮 Usage

### For Users
1. **Authentication**: Login with Steam account
2. **Browse Cases**: View available cases and their contents
3. **Open Cases**: Purchase and open cases to win items
4. **View History**: Check your opening history and statistics
5. **Verify Fairness**: Use provably fair verification

### For Administrators
1. **Access Admin Panel**: Login at `/admin`
2. **Manage Cases**: Create, edit, and configure cases
3. **Manage Items**: Add items with rarities and prices
4. **User Management**: View users, adjust balances, ban users
5. **Analytics**: View revenue, user statistics, and trends

## 🔐 Provably Fair System

This platform implements a cryptographically secure provably fair system:

1. **Server Seed**: Generated server-side for each round
2. **Client Seed**: Provided by user or auto-generated
3. **Nonce**: Incremental counter for each user bet
4. **Hash Generation**: SHA256(server_seed + client_seed + nonce)
5. **Result Calculation**: Hash converted to percentage for item selection

### Verification Process
Users can verify any case opening result by:
1. Checking the provided seeds and nonce
2. Regenerating the hash using the same algorithm
3. Comparing the result with the original outcome

## 📊 API Documentation

### Authentication Endpoints
- `GET /api/auth/steam` - Get Steam login URL
- `GET /api/auth/steam/callback` - Steam OAuth callback
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Case Endpoints
- `GET /api/cases` - Get all active cases
- `GET /api/cases/popular` - Get popular cases
- `GET /api/cases/:id` - Get specific case
- `POST /api/cases/open` - Open a case (authenticated)
- `GET /api/cases/recent-drops` - Get recent drops
- `GET /api/cases/big-wins` - Get big wins

### User Endpoints
- `GET /api/users/leaderboard` - Get user leaderboard
- `GET /api/users/:id/profile` - Get user profile
- `POST /api/users/deposit` - Add balance (authenticated)
- `POST /api/users/withdraw` - Request withdrawal (authenticated)

## 🔄 WebSocket Events

### Client → Server
- `authenticate` - Authenticate WebSocket connection
- `join_room` - Join specific room (live_drops, big_wins, case_:id)
- `leave_room` - Leave specific room
- `start_case_opening` - Initiate case opening animation

### Server → Client
- `authenticated` - Authentication successful
- `case_opened` - New case opening result
- `big_win` - Big win notification
- `balance_updated` - User balance update
- `user_connected` / `user_disconnected` - User status updates

## 🚀 Deployment

### Production Deployment
1. **Configure Production Environment**
   - Set `NODE_ENV=production`
   - Configure production database URLs
   - Set secure JWT secrets
   - Configure SSL certificates

2. **Build and Deploy**
```bash
# Build frontend assets
cd frontend && npm run build
cd admin && npm run build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

3. **Security Considerations**
   - Use SSL/TLS certificates
   - Configure proper CORS settings
   - Set up firewall rules
   - Regular security updates
   - Monitor for suspicious activity

### Scaling
- **Horizontal Scaling**: Add more backend instances behind load balancer
- **Database Scaling**: MongoDB replica sets and sharding
- **Caching**: Redis cluster for high availability
- **CDN**: Serve static assets via CDN

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
php artisan test

# Admin tests
cd admin
php artisan test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and entertainment purposes only. Please ensure compliance with local gambling laws and regulations before deploying in production. The developers are not responsible for any legal issues arising from the use of this software.

## 🆘 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord server for discussions

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Cryptocurrency payments integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social features (friends, chat)
- [ ] Tournament system
- [ ] NFT integration
- [ ] API rate limiting improvements
- [ ] Advanced fraud detection