const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PromocodeUse = sequelize.define('PromocodeUse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  promocodeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'promocode_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  amountReceived: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'amount_received'
  },
  usedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'used_at'
  }
}, {
  tableName: 'promocode_uses',
  timestamps: false,
  indexes: [
    { fields: ['promocode_id'] },
    { fields: ['user_id'] },
    { unique: true, fields: ['user_id', 'promocode_id'] }
  ]
});

module.exports = PromocodeUse;