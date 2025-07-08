const express = require('express');
const { Item } = require('../models');
const router = express.Router();

// Получить все предметы с пагинацией и фильтрами
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      rarity, 
      type, 
      minPrice, 
      maxPrice, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = { isActive: true };
    
    // Фильтры
    if (rarity) {
      where.rarity = rarity;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[require('sequelize').Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[require('sequelize').Op.lte] = parseFloat(maxPrice);
    }
    
    if (search) {
      where.name = {
        [require('sequelize').Op.like]: `%${search}%`
      };
    }
    
    const items = await Item.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['price', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        items: items.rows,
        pagination: {
          total: items.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(items.count / limit)
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

// Получить предмет по ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить доступные редкости
router.get('/meta/rarities', async (req, res) => {
  try {
    const rarities = await Item.findAll({
      attributes: ['rarity', 'rarityColor'],
      where: { isActive: true },
      group: ['rarity', 'rarityColor'],
      raw: true
    });
    
    res.json({
      success: true,
      data: rarities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Получить доступные типы оружия
router.get('/meta/types', async (req, res) => {
  try {
    const types = await Item.findAll({
      attributes: ['type'],
      where: { isActive: true },
      group: ['type'],
      raw: true
    });
    
    res.json({
      success: true,
      data: types.map(t => t.type)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;