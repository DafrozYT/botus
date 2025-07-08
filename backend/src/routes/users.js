const express = require('express');
const { User, Opening, UserInventory, Transaction, Item } = require('../models');
const { requireAuth, checkBanned } = require('../middleware/auth');
const router = express.Router();

// Получить профиль текущего пользователя
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['steamId'] }
    });
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Обновить профиль пользователя
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }
    
    const user = await User.findByPk(req.user.id);
    user.username = username.trim();
    await user.save();
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить инвентарь пользователя
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, withdrawn = 'false' } = req.query;
    const offset = (page - 1) * limit;
    
    const inventory = await UserInventory.findAndCountAll({
      where: {
        userId: req.user.id,
        isWithdrawn: withdrawn === 'true'
      },
      include: [{
        model: Item,
        as: 'item'
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        items: inventory.rows,
        pagination: {
          total: inventory.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(inventory.count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить историю открытий
router.get('/openings', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const openings = await Opening.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: require('../models/Case'),
          as: 'case',
          attributes: ['name', 'imageUrl']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['name', 'imageUrl', 'rarity', 'rarityColor', 'price']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        openings: openings.rows,
        pagination: {
          total: openings.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(openings.count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить статистику пользователя
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await Opening.getUserStats(req.user.id);
    
    // Получаем статистику транзакций
    const transactionStats = await Transaction.findAll({
      where: { userId: req.user.id },
      attributes: [
        'type',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        openings: stats[0] || {
          totalOpenings: 0,
          totalSpent: 0,
          totalWon: 0,
          totalProfit: 0,
          rareDrops: 0
        },
        transactions: transactionStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить историю транзакций
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { userId: req.user.id };
    if (type) {
      where.type = type;
    }
    
    const transactions = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        pagination: {
          total: transactions.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(transactions.count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Вывод предмета
router.post('/withdraw/:inventoryId', requireAuth, checkBanned, async (req, res) => {
  try {
    const inventoryItem = await UserInventory.findOne({
      where: {
        id: req.params.inventoryId,
        userId: req.user.id,
        isWithdrawn: false
      },
      include: [{
        model: Item,
        as: 'item'
      }]
    });
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or already withdrawn'
      });
    }
    
    // Здесь должна быть логика вывода на Steam/торговую площадку
    // Пока просто помечаем как выведенный
    inventoryItem.isWithdrawn = true;
    inventoryItem.withdrawnAt = new Date();
    inventoryItem.withdrawMethod = 'steam_trade';
    await inventoryItem.save();
    
    res.json({
      success: true,
      message: 'Item withdrawal initiated',
      data: inventoryItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;