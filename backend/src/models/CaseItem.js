const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CaseItem = sequelize.define('CaseItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  dropChance: {
    type: DataTypes.DECIMAL(8, 5),
    allowNull: false,
    field: 'drop_chance'
  },
  minPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'min_price'
  },
  maxPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 999999.99,
    field: 'max_price'
  },
  isRare: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_rare'
  }
}, {
  tableName: 'case_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['case_id'] },
    { fields: ['item_id'] },
    { fields: ['drop_chance'] },
    { unique: true, fields: ['case_id', 'item_id'] }
  ]
});

module.exports = CaseItem;