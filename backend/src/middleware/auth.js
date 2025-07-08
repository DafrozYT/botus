const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware для проверки авторизации
const requireAuth = async (req, res, next) => {
  try {
    // Check for session-based auth (from Steam login)
    if (req.user) {
      return next();
    }

    // Check for JWT token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account is banned.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware для проверки админских прав
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin rights required.'
    });
  }

  next();
};

// Middleware для проверки что пользователь не забанен
const checkBanned = (req, res, next) => {
  if (req.user && req.user.isBanned) {
    return res.status(403).json({
      success: false,
      message: 'Account is banned.'
    });
  }
  next();
};

// Middleware для генерации JWT токена
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      steamId: user.steamId,
      isAdmin: user.isAdmin 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  requireAuth,
  requireAdmin,
  checkBanned,
  generateToken
};