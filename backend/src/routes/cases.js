const express = require('express');
const { Case, Item, CaseItem, Opening } = require('../models');
const { requireAuth, checkBanned } = require('../middleware/auth');
const CaseService = require('../services/caseService');
const router = express.Router();

// Получить все активные кейсы
router.get('/', async (req, res) => {
  try {
    const cases = await Case.getActive();
    
    res.json({
      success: true,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить информацию о кейсе
router.get('/:id', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    
    const caseItem = await Case.findByPk(caseId, {
      include: [{
        model: CaseItem,
        as: 'caseItems',
        include: [{
          model: Item,
          as: 'item',
          where: { isActive: true }
        }]
      }]
    });
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Получаем предметы с шансами
    const items = await CaseService.getCaseItems(caseId);
    
    // Рассчитываем ожидаемую стоимость
    const expectedValue = await caseItem.calculateExpectedValue();
    
    // Получаем недавние открытия
    const recentOpenings = await Opening.findAll({
      where: { caseId },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: require('../models/User'),
          as: 'user',
          attributes: ['username', 'avatarUrl']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['name', 'imageUrl', 'rarity', 'rarityColor', 'price']
        }
      ]
    });
    
    res.json({
      success: true,
      data: {
        case: caseItem,
        items,
        expectedValue,
        recentOpenings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Открыть кейс
router.post('/:id/open', requireAuth, checkBanned, async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const result = await CaseService.openCase(userId, caseId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Получить статистику кейса
router.get('/:id/stats', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    
    const stats = await CaseService.getCaseStats(caseId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Валидация честности открытия
router.post('/validate', async (req, res) => {
  try {
    const { seed, steamId, caseId, rollNumber } = req.body;
    
    if (!seed || !steamId || !caseId || rollNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    const isValid = CaseService.validateFairness(seed, steamId, caseId, rollNumber);
    
    res.json({
      success: true,
      data: { isValid }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;