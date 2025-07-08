const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Check if token starts with 'Bearer '
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned',
        reason: user.banReason
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await user.save();

    // Add user to request object
    req.user = {
      id: user._id,
      steamId: user.steamId,
      username: user.username,
      avatar: user.avatar,
      balance: user.balance,
      role: user.role,
      casesOpened: user.casesOpened,
      totalWon: user.totalWon
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = authMiddleware;