const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Opening = sequelize.define('Opening', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'case_id'
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'item_id'
  },
  casePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'case_price'
  },
  itemPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'item_price'
  },
  profit: {
    type: DataTypes.VIRTUAL(DataTypes.DECIMAL(10, 2)),
    get() {
      return parseFloat(this.itemPrice) - parseFloat(this.casePrice);
    }
  },
  seed: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  rollNumber: {
    type: DataTypes.DECIMAL(10, 5),
    allowNull: false,
    field: 'roll_number'
  },
  isRareDrop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_rare_drop'
  }
}, {
  tableName: 'openings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['case_id'] },
    { fields: ['item_id'] },
    { fields: ['created_at'] },
    { fields: ['is_rare_drop'] }
  ]
});

// Class methods
Opening.getRecentWins = function(limit = 10) {
  const User = require('./User');
  const Case = require('./Case');
  const Item = require('./Item');
  
  return this.findAll({
    limit,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['username', 'avatarUrl']
      },
      {
        model: Case,
        as: 'case',
        attributes: ['name', 'imageUrl']
      },
      {
        model: Item,
        as: 'item',
        attributes: ['name', 'imageUrl', 'rarity', 'rarityColor', 'price']
      }
    ]
  });
};

Opening.getUserStats = function(userId) {
  return this.findAll({
    where: { userId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalOpenings'],
      [sequelize.fn('SUM', sequelize.col('case_price')), 'totalSpent'],
      [sequelize.fn('SUM', sequelize.col('item_price')), 'totalWon'],
      [sequelize.fn('SUM', sequelize.literal('item_price - case_price')), 'totalProfit'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_rare_drop = 1 THEN 1 END')), 'rareDrops']
    ],
    raw: true
  });
};

module.exports = Opening;