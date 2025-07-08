const express = require('express');
const { User, Case, Item, CaseItem, Promocode, SiteSetting, AdminAudit, Transaction } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const marketService = require('../services/marketService');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Все маршруты требуют админских прав
router.use(requireAuth, requireAdmin);

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===

// Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where.username = {
        [require('sequelize').Op.like]: `%${search}%`
      };
    }
    
    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['steamId'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(users.count / limit)
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

// Обновить пользователя
router.put('/users/:id', async (req, res) => {
  try {
    const { username, balance, isAdmin, isBanned } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const oldValues = user.toJSON();
    
    if (username) user.username = username;
    if (balance !== undefined) user.balance = parseFloat(balance);
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (isBanned !== undefined) user.isBanned = isBanned;
    
    await user.save();
    
    // Логируем действие
    await AdminAudit.log(
      req.user.id,
      'update',
      'users',
      user.id,
      oldValues,
      user.toJSON(),
      req
    );
    
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

// === УПРАВЛЕНИЕ КЕЙСАМИ ===

// Создать кейс
router.post('/cases', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, isActive, sortOrder } = req.body;
    
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const caseItem = await Case.create({
      name,
      description,
      imageUrl,
      price: parseFloat(price),
      isActive: isActive === 'true',
      sortOrder: parseInt(sortOrder) || 0
    });
    
    await AdminAudit.log(
      req.user.id,
      'create',
      'cases',
      caseItem.id,
      null,
      caseItem.toJSON(),
      req
    );
    
    res.json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Обновить кейс
router.put('/cases/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, isActive, sortOrder } = req.body;
    
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    const oldValues = caseItem.toJSON();
    
    if (name) caseItem.name = name;
    if (description) caseItem.description = description;
    if (price) caseItem.price = parseFloat(price);
    if (isActive !== undefined) caseItem.isActive = isActive === 'true';
    if (sortOrder) caseItem.sortOrder = parseInt(sortOrder);
    if (req.file) caseItem.imageUrl = `/uploads/${req.file.filename}`;
    
    await caseItem.save();
    
    await AdminAudit.log(
      req.user.id,
      'update',
      'cases',
      caseItem.id,
      oldValues,
      caseItem.toJSON(),
      req
    );
    
    res.json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Добавить предмет в кейс
router.post('/cases/:caseId/items', async (req, res) => {
  try {
    const { itemId, dropChance, isRare } = req.body;
    
    const caseItem = await CaseItem.create({
      caseId: parseInt(req.params.caseId),
      itemId: parseInt(itemId),
      dropChance: parseFloat(dropChance),
      isRare: isRare === true
    });
    
    await AdminAudit.log(
      req.user.id,
      'create',
      'case_items',
      caseItem.id,
      null,
      caseItem.toJSON(),
      req
    );
    
    res.json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// === УПРАВЛЕНИЕ ПРЕДМЕТАМИ ===

// Обновить цены с market.csgo.com
router.post('/items/update-prices', async (req, res) => {
  try {
    const result = await marketService.updateItemPrices();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Парсинг новых предметов
router.post('/items/parse', async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    
    const result = await marketService.parseNewItems(parseInt(limit));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// === УПРАВЛЕНИЕ ПРОМОКОДАМИ ===

// Создать промокод
router.post('/promocodes', async (req, res) => {
  try {
    const { code, type, value, maxUses, validUntil } = req.body;
    
    const promocode = await Promocode.create({
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      maxUses: parseInt(maxUses) || 0,
      validUntil: validUntil ? new Date(validUntil) : null,
      createdBy: req.user.id
    });
    
    await AdminAudit.log(
      req.user.id,
      'create',
      'promocodes',
      promocode.id,
      null,
      promocode.toJSON(),
      req
    );
    
    res.json({
      success: true,
      data: promocode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// === НАСТРОЙКИ САЙТА ===

// Получить все настройки
router.get('/settings', async (req, res) => {
  try {
    const settings = await SiteSetting.findAll();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Обновить настройку
router.put('/settings/:key', async (req, res) => {
  try {
    const { value, type = 'string' } = req.body;
    
    const setting = await SiteSetting.setValue(
      req.params.key,
      value,
      type,
      req.user.id
    );
    
    await AdminAudit.log(
      req.user.id,
      'update',
      'site_settings',
      setting.id,
      null,
      setting.toJSON(),
      req
    );
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// === АУДИТ ===

// Получить логи админских действий
router.get('/audit', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const logs = await AdminAudit.findAndCountAll({
      include: [{
        model: User,
        as: 'admin',
        attributes: ['username']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        logs: logs.rows,
        pagination: {
          total: logs.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(logs.count / limit)
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

module.exports = router;