const express = require('express');
const { User, Opening, Case, Item, Transaction } = require('../models');
const { sequelize } = require('../config/database');
const router = express.Router();

// Получить глобальную статистику
router.get('/global', async (req, res) => {
  try {
    // Общая статистика
    const [
      totalUsers,
      totalOpenings,
      totalCases,
      totalItems,
      totalValue
    ] = await Promise.all([
      User.count(),
      Opening.count(),
      Case.count({ where: { isActive: true } }),
      Item.count({ where: { isActive: true } }),
      Opening.sum('itemPrice')
    ]);
    
    // Статистика по открытиям за последние 24 часа
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentStats = await Opening.findAll({
      where: {
        createdAt: {
          [sequelize.Op.gte]: yesterday
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'openingsLast24h'],
        [sequelize.fn('SUM', sequelize.col('itemPrice')), 'valueLast24h']
      ],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalOpenings,
        totalCases,
        totalItems,
        totalValue: parseFloat(totalValue || 0),
        openingsLast24h: parseInt(recentStats[0]?.openingsLast24h || 0),
        valueLast24h: parseFloat(recentStats[0]?.valueLast24h || 0)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить недавние выигрыши
router.get('/recent-wins', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentWins = await Opening.getRecentWins(parseInt(limit));
    
    res.json({
      success: true,
      data: recentWins
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить топ пользователей по прибыли
router.get('/top-users', async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;
    
    let whereCondition = {};
    
    // Фильтр по периоду
    if (period !== 'all') {
      const periodDate = new Date();
      switch (period) {
        case 'day':
          periodDate.setDate(periodDate.getDate() - 1);
          break;
        case 'week':
          periodDate.setDate(periodDate.getDate() - 7);
          break;
        case 'month':
          periodDate.setMonth(periodDate.getMonth() - 1);
          break;
      }
      whereCondition.createdAt = {
        [sequelize.Op.gte]: periodDate
      };
    }
    
    const topUsers = await Opening.findAll({
      where: whereCondition,
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'avatarUrl']
      }],
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Opening.id')), 'totalOpenings'],
        [sequelize.fn('SUM', sequelize.col('Opening.itemPrice')), 'totalWon'],
        [sequelize.fn('SUM', sequelize.col('Opening.casePrice')), 'totalSpent'],
        [sequelize.fn('SUM', sequelize.literal('Opening.itemPrice - Opening.casePrice')), 'totalProfit']
      ],
      group: ['Opening.userId', 'user.id'],
      order: [[sequelize.literal('totalProfit'), 'DESC']],
      limit: parseInt(limit),
      raw: false
    });
    
    res.json({
      success: true,
      data: topUsers
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить статистику по кейсам
router.get('/cases', async (req, res) => {
  try {
    const caseStats = await Opening.findAll({
      include: [{
        model: Case,
        as: 'case',
        attributes: ['name', 'imageUrl', 'price']
      }],
      attributes: [
        'caseId',
        [sequelize.fn('COUNT', sequelize.col('Opening.id')), 'totalOpenings'],
        [sequelize.fn('AVG', sequelize.col('Opening.itemPrice')), 'avgValue'],
        [sequelize.fn('SUM', sequelize.col('Opening.casePrice')), 'totalRevenue']
      ],
      group: ['Opening.caseId', 'case.id'],
      order: [[sequelize.literal('totalOpenings'), 'DESC']],
      limit: 10,
      raw: false
    });
    
    res.json({
      success: true,
      data: caseStats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить статистику по редкостям
router.get('/rarities', async (req, res) => {
  try {
    const rarityStats = await Opening.findAll({
      include: [{
        model: Item,
        as: 'item',
        attributes: ['rarity', 'rarityColor']
      }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Opening.id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('Opening.itemPrice')), 'avgValue']
      ],
      group: ['item.rarity', 'item.rarityColor'],
      order: [[sequelize.literal('count'), 'DESC']],
      raw: false
    });
    
    res.json({
      success: true,
      data: rarityStats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить статистику по времени (для графиков)
router.get('/timeline', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let dateFormat;
    let dateRange = new Date();
    
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d %H:00:00';
        dateRange.setDate(dateRange.getDate() - 1);
        break;
      case 'week':
        dateFormat = '%Y-%m-%d';
        dateRange.setDate(dateRange.getDate() - 7);
        break;
      case 'month':
        dateFormat = '%Y-%m-%d';
        dateRange.setMonth(dateRange.getMonth() - 1);
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateRange.setDate(dateRange.getDate() - 7);
    }
    
    const timeline = await Opening.findAll({
      where: {
        createdAt: {
          [sequelize.Op.gte]: dateRange
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'openings'],
        [sequelize.fn('SUM', sequelize.col('itemPrice')), 'totalValue']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'ASC']],
      raw: true
    });
    
    res.json({
      success: true,
      data: timeline
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;