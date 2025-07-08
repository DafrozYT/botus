const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketHandler {
  constructor(io, redisClient) {
    this.io = io;
    this.redis = redisClient;
    this.connectedUsers = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`WebSocket connection established: ${socket.id}`);
      
      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          await this.authenticateUser(socket, data.token);
        } catch (error) {
          console.error('WebSocket auth error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle joining rooms
      socket.on('join_room', (roomName) => {
        this.joinRoom(socket, roomName);
      });

      socket.on('leave_room', (roomName) => {
        this.leaveRoom(socket, roomName);
      });

      // Handle case opening events
      socket.on('start_case_opening', (data) => {
        this.handleCaseOpening(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send initial data
      this.sendInitialData(socket);
    });
  }

  async authenticateUser(socket, token) {
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('username avatar balance role isActive isBanned');

    if (!user || !user.isActive || user.isBanned) {
      throw new Error('Invalid user');
    }

    // Store user info in socket
    socket.userId = user._id.toString();
    socket.user = {
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      balance: user.balance,
      role: user.role
    };

    // Track connected user
    this.connectedUsers.set(socket.id, socket.user);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Emit authentication success
    socket.emit('authenticated', {
      user: socket.user,
      connectedUsers: this.getConnectedUsersCount()
    });

    // Broadcast user connected (optional)
    socket.broadcast.emit('user_connected', {
      username: user.username,
      avatar: user.avatar
    });

    console.log(`User authenticated: ${user.username} (${socket.id})`);
  }

  joinRoom(socket, roomName) {
    if (!socket.user) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    socket.join(roomName);
    socket.emit('joined_room', { room: roomName });
    
    console.log(`User ${socket.user.username} joined room: ${roomName}`);

    // Send room-specific data
    this.sendRoomData(socket, roomName);
  }

  leaveRoom(socket, roomName) {
    socket.leave(roomName);
    socket.emit('left_room', { room: roomName });
    
    console.log(`User ${socket.user?.username || 'Unknown'} left room: ${roomName}`);
  }

  handleCaseOpening(socket, data) {
    if (!socket.user) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const { caseId, animationDuration = 5000 } = data;

    // Emit case opening start to user
    socket.emit('case_opening_started', {
      caseId,
      animationDuration
    });

    // This would typically be handled by the API, but we can emit updates here
    console.log(`Case opening started by ${socket.user.username}: ${caseId}`);
  }

  handleDisconnect(socket) {
    // Remove from connected users
    this.connectedUsers.delete(socket.id);

    // Broadcast user disconnected (optional)
    if (socket.user) {
      socket.broadcast.emit('user_disconnected', {
        username: socket.user.username
      });
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
    } else {
      console.log(`Anonymous user disconnected: ${socket.id}`);
    }
  }

  async sendInitialData(socket) {
    try {
      // Send recent drops
      const recentDrops = await this.getRecentDropsFromCache();
      socket.emit('recent_drops', recentDrops);

      // Send connected users count
      socket.emit('stats_update', {
        connectedUsers: this.getConnectedUsersCount()
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  async sendRoomData(socket, roomName) {
    try {
      switch (roomName) {
        case 'live_drops':
          const recentDrops = await this.getRecentDropsFromCache();
          socket.emit('room_data', {
            room: roomName,
            data: recentDrops
          });
          break;
        
        case 'big_wins':
          const bigWins = await this.getBigWinsFromCache();
          socket.emit('room_data', {
            room: roomName,
            data: bigWins
          });
          break;
        
        default:
          // Handle case-specific rooms (e.g., case_<caseId>)
          if (roomName.startsWith('case_')) {
            const caseId = roomName.replace('case_', '');
            const caseDrops = await this.getCaseDropsFromCache(caseId);
            socket.emit('room_data', {
              room: roomName,
              data: caseDrops
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error sending room data:', error);
    }
  }

  // Public methods for emitting events from other parts of the application

  emitCaseOpened(dropData) {
    // Emit to all users in live drops room
    this.io.to('live_drops').emit('case_opened', dropData);

    // Emit to specific case room
    this.io.to(`case_${dropData.case.id}`).emit('case_opened', dropData);

    // If it's a big win, emit to big wins room
    if (dropData.profit >= 100) {
      this.io.to('big_wins').emit('big_win', dropData);
    }

    // Emit to the user who opened the case
    this.io.to(`user_${dropData.user.id}`).emit('case_opened_personal', dropData);

    // Cache the drop for recent drops
    this.cacheRecentDrop(dropData);
  }

  emitUserBalanceUpdate(userId, newBalance) {
    this.io.to(`user_${userId}`).emit('balance_updated', {
      newBalance
    });
  }

  emitSystemMessage(message, room = null) {
    if (room) {
      this.io.to(room).emit('system_message', { message });
    } else {
      this.io.emit('system_message', { message });
    }
  }

  // Helper methods

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  async getRecentDropsFromCache() {
    try {
      const cacheKey = `${process.env.REDIS_PREFIX}recent_drops`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting recent drops from cache:', error);
      return [];
    }
  }

  async getBigWinsFromCache() {
    try {
      const cacheKey = `${process.env.REDIS_PREFIX}big_wins`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting big wins from cache:', error);
      return [];
    }
  }

  async getCaseDropsFromCache(caseId) {
    try {
      const cacheKey = `${process.env.REDIS_PREFIX}case_drops_${caseId}`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting case drops from cache:', error);
      return [];
    }
  }

  async cacheRecentDrop(dropData) {
    try {
      const cacheKey = `${process.env.REDIS_PREFIX}recent_drops`;
      const maxDrops = 50;
      
      // Get current drops
      let recentDrops = await this.getRecentDropsFromCache();
      
      // Add new drop to the beginning
      recentDrops.unshift({
        ...dropData,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the most recent drops
      recentDrops = recentDrops.slice(0, maxDrops);
      
      // Cache for 1 hour
      await this.redis.setEx(cacheKey, 3600, JSON.stringify(recentDrops));

      // Also cache big wins separately
      if (dropData.profit >= 100) {
        const bigWinsCacheKey = `${process.env.REDIS_PREFIX}big_wins`;
        let bigWins = await this.getBigWinsFromCache();
        
        bigWins.unshift({
          ...dropData,
          timestamp: new Date().toISOString()
        });
        
        bigWins = bigWins.slice(0, 20); // Keep top 20 big wins
        await this.redis.setEx(bigWinsCacheKey, 3600, JSON.stringify(bigWins));
      }

      // Cache case-specific drops
      const caseDropsCacheKey = `${process.env.REDIS_PREFIX}case_drops_${dropData.case.id}`;
      let caseDrops = await this.getCaseDropsFromCache(dropData.case.id);
      
      caseDrops.unshift({
        ...dropData,
        timestamp: new Date().toISOString()
      });
      
      caseDrops = caseDrops.slice(0, 30); // Keep last 30 drops for each case
      await this.redis.setEx(caseDropsCacheKey, 1800, JSON.stringify(caseDrops)); // 30 minutes

    } catch (error) {
      console.error('Error caching recent drop:', error);
    }
  }
}

module.exports = (io, redisClient) => {
  const wsHandler = new WebSocketHandler(io, redisClient);
  
  // Make handler available globally for other modules to use
  global.wsHandler = wsHandler;
  
  return wsHandler;
};