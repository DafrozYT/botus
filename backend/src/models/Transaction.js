const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
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
  type: {
    type: DataTypes.ENUM('deposit', 'withdraw', 'bonus', 'case_purchase', 'case_refund'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  balanceBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'balance_before'
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'balance_after'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(100),
    field: 'payment_method'
  },
  paymentId: {
    type: DataTypes.STRING(255),
    field: 'payment_id'
  },
  adminId: {
    type: DataTypes.INTEGER,
    field: 'admin_id'
  },
  notes: {
    type: DataTypes.TEXT
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['payment_id'] }
  ]
});

module.exports = Transaction;