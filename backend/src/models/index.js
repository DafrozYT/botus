const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Case = require('./Case');
const Item = require('./Item');
const CaseItem = require('./CaseItem');
const Opening = require('./Opening');
const Transaction = require('./Transaction');
const Promocode = require('./Promocode');
const PromocodeUse = require('./PromocodeUse');
const UserInventory = require('./UserInventory');
const SiteSetting = require('./SiteSetting');
const AdminAudit = require('./AdminAudit');

// Define associations

// User associations
User.hasMany(Opening, { foreignKey: 'userId', as: 'openings' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(PromocodeUse, { foreignKey: 'userId', as: 'promocodeUses' });
User.hasMany(UserInventory, { foreignKey: 'userId', as: 'inventory' });
User.hasMany(Promocode, { foreignKey: 'createdBy', as: 'createdPromocodes' });
User.hasMany(AdminAudit, { foreignKey: 'adminId', as: 'auditLogs' });

// Case associations
Case.hasMany(CaseItem, { foreignKey: 'caseId', as: 'caseItems' });
Case.hasMany(Opening, { foreignKey: 'caseId', as: 'openings' });
Case.belongsToMany(Item, { 
  through: CaseItem, 
  foreignKey: 'caseId', 
  otherKey: 'itemId',
  as: 'items' 
});

// Item associations
Item.hasMany(CaseItem, { foreignKey: 'itemId', as: 'caseItems' });
Item.hasMany(Opening, { foreignKey: 'itemId', as: 'openings' });
Item.hasMany(UserInventory, { foreignKey: 'itemId', as: 'inventoryItems' });
Item.belongsToMany(Case, { 
  through: CaseItem, 
  foreignKey: 'itemId', 
  otherKey: 'caseId',
  as: 'cases' 
});

// CaseItem associations
CaseItem.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });
CaseItem.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

// Opening associations
Opening.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Opening.belongsTo(Case, { foreignKey: 'caseId', as: 'case' });
Opening.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });
Opening.hasOne(UserInventory, { foreignKey: 'openingId', as: 'inventoryItem' });

// Transaction associations
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

// Promocode associations
Promocode.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Promocode.hasMany(PromocodeUse, { foreignKey: 'promocodeId', as: 'uses' });

// PromocodeUse associations
PromocodeUse.belongsTo(Promocode, { foreignKey: 'promocodeId', as: 'promocode' });
PromocodeUse.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserInventory associations
UserInventory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserInventory.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });
UserInventory.belongsTo(Opening, { foreignKey: 'openingId', as: 'opening' });

// SiteSetting associations
SiteSetting.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// AdminAudit associations
AdminAudit.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

module.exports = {
  sequelize,
  User,
  Case,
  Item,
  CaseItem,
  Opening,
  Transaction,
  Promocode,
  PromocodeUse,
  UserInventory,
  SiteSetting,
  AdminAudit
};