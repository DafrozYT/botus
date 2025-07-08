const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Promocode = sequelize.define('Promocode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('balance', 'percentage', 'free_case'),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  maxUses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'max_uses'
  },
  currentUses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_uses'
  },
  validFrom: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'valid_from'
  },
  validUntil: {
    type: DataTypes.DATE,
    field: 'valid_until'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  }
}, {
  tableName: 'promocodes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['code'] },
    { fields: ['is_active'] },
    { fields: ['valid_until'] }
  ]
});

// Instance methods
Promocode.prototype.isValid = function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (this.validFrom && this.validFrom > now) return false;
  if (this.validUntil && this.validUntil < now) return false;
  if (this.maxUses > 0 && this.currentUses >= this.maxUses) return false;
  
  return true;
};

Promocode.prototype.canBeUsedBy = async function(userId) {
  if (!this.isValid()) return false;
  
  const PromocodeUse = require('./PromocodeUse');
  const existingUse = await PromocodeUse.findOne({
    where: {
      promocodeId: this.id,
      userId: userId
    }
  });
  
  return !existingUse;
};

module.exports = Promocode;