const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Case = sequelize.define('Case', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'image_url'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  }
}, {
  tableName: 'cases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['is_active'] },
    { fields: ['price'] },
    { fields: ['sort_order'] }
  ]
});

// Instance methods
Case.prototype.getItems = async function() {
  const CaseItem = require('./CaseItem');
  const Item = require('./Item');
  
  return await CaseItem.findAll({
    where: { caseId: this.id },
    include: [{
      model: Item,
      as: 'item'
    }],
    order: [['dropChance', 'ASC']]
  });
};

Case.prototype.calculateExpectedValue = async function() {
  const items = await this.getItems();
  let expectedValue = 0;
  
  for (const caseItem of items) {
    expectedValue += (parseFloat(caseItem.dropChance) / 100) * parseFloat(caseItem.item.price);
  }
  
  return expectedValue;
};

// Class methods
Case.getActive = function() {
  return this.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
  });
};

module.exports = Case;