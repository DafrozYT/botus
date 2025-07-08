const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'image_url'
  },
  marketHashName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'market_hash_name'
  },
  rarity: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  rarityColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#B0C3D9',
    field: 'rarity_color'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  wear: {
    type: DataTypes.STRING(50),
    defaultValue: 'Factory New'
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastPriceUpdate: {
    type: DataTypes.DATE,
    field: 'last_price_update'
  }
}, {
  tableName: 'items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['market_hash_name'] },
    { fields: ['rarity'] },
    { fields: ['price'] },
    { fields: ['type'] },
    { fields: ['is_active'] }
  ]
});

// Instance methods
Item.prototype.updatePrice = async function(newPrice) {
  this.price = newPrice;
  this.lastPriceUpdate = new Date();
  await this.save();
};

// Class methods
Item.findByMarketHashName = function(marketHashName) {
  return this.findOne({ where: { marketHashName } });
};

Item.getByRarity = function(rarity) {
  return this.findAll({
    where: { 
      rarity,
      isActive: true 
    },
    order: [['price', 'DESC']]
  });
};

Item.getByType = function(type) {
  return this.findAll({
    where: { 
      type,
      isActive: true 
    },
    order: [['price', 'DESC']]
  });
};

Item.getPriceRange = function(minPrice, maxPrice) {
  const where = { isActive: true };
  
  if (minPrice !== undefined) {
    where.price = { ...where.price, [sequelize.Op.gte]: minPrice };
  }
  
  if (maxPrice !== undefined) {
    where.price = { ...where.price, [sequelize.Op.lte]: maxPrice };
  }
  
  return this.findAll({
    where,
    order: [['price', 'ASC']]
  });
};

// Static rarity definitions
Item.RARITIES = {
  'Consumer Grade': { color: '#B0C3D9', order: 1 },
  'Industrial Grade': { color: '#5E98D9', order: 2 },
  'Mil-Spec Grade': { color: '#4B69FF', order: 3 },
  'Restricted': { color: '#8847FF', order: 4 },
  'Classified': { color: '#D32CE6', order: 5 },
  'Covert': { color: '#EB4B4B', order: 6 },
  'Extraordinary': { color: '#FFD700', order: 7 }
};

module.exports = Item;