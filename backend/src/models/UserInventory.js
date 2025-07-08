const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserInventory = sequelize.define('UserInventory', {
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
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'item_id'
  },
  openingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'opening_id'
  },
  isWithdrawn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_withdrawn'
  },
  withdrawnAt: {
    type: DataTypes.DATE,
    field: 'withdrawn_at'
  },
  withdrawMethod: {
    type: DataTypes.STRING(100),
    field: 'withdraw_method'
  }
}, {
  tableName: 'user_inventory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['item_id'] },
    { fields: ['is_withdrawn'] }
  ]
});

module.exports = UserInventory;