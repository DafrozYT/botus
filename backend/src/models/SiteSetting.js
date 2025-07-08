const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SiteSetting = sequelize.define('SiteSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settingKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'setting_key'
  },
  settingValue: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'setting_value'
  },
  settingType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
    field: 'setting_type'
  },
  description: {
    type: DataTypes.TEXT
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    field: 'updated_by'
  }
}, {
  tableName: 'site_settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['setting_key'] }
  ]
});

// Class methods
SiteSetting.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ where: { settingKey: key } });
  
  if (!setting) return defaultValue;
  
  const { settingValue, settingType } = setting;
  
  switch (settingType) {
    case 'number':
      return parseFloat(settingValue);
    case 'boolean':
      return settingValue === 'true';
    case 'json':
      try {
        return JSON.parse(settingValue);
      } catch (e) {
        return defaultValue;
      }
    default:
      return settingValue;
  }
};

SiteSetting.setValue = async function(key, value, type = 'string', updatedBy = null) {
  let stringValue;
  
  switch (type) {
    case 'number':
      stringValue = value.toString();
      break;
    case 'boolean':
      stringValue = value ? 'true' : 'false';
      break;
    case 'json':
      stringValue = JSON.stringify(value);
      break;
    default:
      stringValue = value.toString();
  }
  
  const [setting] = await this.upsert({
    settingKey: key,
    settingValue: stringValue,
    settingType: type,
    updatedBy
  });
  
  return setting;
};

module.exports = SiteSetting;