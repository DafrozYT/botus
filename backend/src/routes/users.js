const express = require('express');
const { body, param, query } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

/**
 * Get user leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'totalWon'; // totalWon, casesOpened, balance
    
    let sortField = {};
    switch (type) {
      case 'casesOpened':
        sortField = { casesOpened: -1 };
        break;
      case 'balance':
        sortField = { balance: -1 };
        break;
      default:
        sortField = { totalWon: -1 };
    }

    const users = await User.find({ isActive: true })
      .sort(sortField)
      .limit(limit)
      .select('username avatar totalWon casesOpened balance createdAt');

    res.json({
      success: true,
      data: users.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        totalWon: user.totalWon,
        casesOpened: user.casesOpened,
        balance: user.balance,
        joinDate: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * Get user profile by ID (public information)
 */
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('username avatar totalWon casesOpened createdAt isActive');
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        totalWon: user.totalWon,
        casesOpened: user.casesOpened,
        joinDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Protected routes (authentication required)
router.use(authMiddleware);

/**
 * Update user profile
 */
router.put('/profile', 
  body('username').optional().isString().trim().isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3-50 characters'),
  async (req, res) => {
    try {
      const { username } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update username if provided
      if (username && username !== user.username) {
        // Check if username is already taken
        const existingUser = await User.findOne({ 
          username: new RegExp(`^${username}$`, 'i'),
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: 'Username is already taken'
          });
        }
        
        user.username = username;
      }

      await user.save();

      res.json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          balance: user.balance
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

/**
 * Add balance (deposit simulation - in real app this would integrate with payment processor)
 */
router.post('/deposit',
  body('amount').isFloat({ min: 1, max: 10000 })
    .withMessage('Amount must be between $1 and $10,000'),
  async (req, res) => {
    try {
      const { amount } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Simulate successful payment processing
      await user.addDeposit(amount);

      res.json({
        success: true,
        data: {
          newBalance: user.balance,
          deposited: amount,
          totalDeposited: user.totalDeposited
        }
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process deposit'
      });
    }
  }
);

/**
 * Request withdrawal
 */
router.post('/withdraw',
  body('amount').isFloat({ min: 1 })
    .withMessage('Amount must be at least $1'),
  async (req, res) => {
    try {
      const { amount } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        });
      }

      // In a real application, this would create a withdrawal request
      // For now, we'll just deduct the balance
      await user.addWithdrawal(amount);

      res.json({
        success: true,
        data: {
          newBalance: user.balance,
          withdrawn: amount,
          totalWithdrawn: user.totalWithdrawn
        }
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process withdrawal'
      });
    }
  }
);

// Admin routes
router.use(adminMiddleware);

/**
 * Get all users (admin only)
 */
router.get('/admin/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: new RegExp(search, 'i') },
          { steamId: new RegExp(search, 'i') }
        ]
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('-__v'),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * Ban/unban user (admin only)
 */
router.put('/admin/:userId/ban',
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('banned').isBoolean().withMessage('Banned must be a boolean'),
  body('reason').optional().isString().trim().isLength({ max: 500 })
    .withMessage('Ban reason must be less than 500 characters'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { banned, reason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.isBanned = banned;
      user.banReason = banned ? (reason || 'No reason provided') : '';
      await user.save();

      res.json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          isBanned: user.isBanned,
          banReason: user.banReason
        }
      });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user ban status'
      });
    }
  }
);

/**
 * Update user balance (admin only)
 */
router.put('/admin/:userId/balance',
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('amount').isFloat().withMessage('Amount must be a number'),
  body('type').isIn(['add', 'subtract', 'set']).withMessage('Type must be add, subtract, or set'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, type } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const oldBalance = user.balance;

      if (type === 'set') {
        user.balance = Math.max(0, amount);
      } else if (type === 'add') {
        user.balance += amount;
      } else if (type === 'subtract') {
        user.balance = Math.max(0, user.balance - amount);
      }

      await user.save();

      res.json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          oldBalance,
          newBalance: user.balance,
          change: user.balance - oldBalance
        }
      });
    } catch (error) {
      console.error('Update balance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user balance'
      });
    }
  }
);

module.exports = router;