const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminAudit = sequelize.define('AdminAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admin_id'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tableName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'table_name'
  },
  recordId: {
    type: DataTypes.INTEGER,
    field: 'record_id'
  },
  oldValues: {
    type: DataTypes.JSON,
    field: 'old_values'
  },
  newValues: {
    type: DataTypes.JSON,
    field: 'new_values'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  }
}, {
  tableName: 'admin_audit',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['admin_id'] },
    { fields: ['action'] },
    { fields: ['table_name'] },
    { fields: ['created_at'] }
  ]
});

// Class methods
AdminAudit.log = async function(adminId, action, tableName, recordId = null, oldValues = null, newValues = null, req = null) {
  return await this.create({
    adminId,
    action,
    tableName,
    recordId,
    oldValues,
    newValues,
    ipAddress: req ? req.ip : null,
    userAgent: req ? req.get('User-Agent') : null
  });
};

module.exports = AdminAudit;