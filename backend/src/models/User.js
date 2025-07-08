const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  steamId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    field: 'steam_id'
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  avatarUrl: {
    type: DataTypes.STRING(500),
    field: 'avatar_url'
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  totalDeposited: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'total_deposited'
  },
  totalWithdrawn: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'total_withdrawn'
  },
  totalWon: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'total_won'
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_admin'
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_banned'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['steam_id'] },
    { fields: ['username'] },
    { fields: ['created_at'] }
  ]
});

// Instance methods
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.steamId; // Don't expose steam_id to frontend
  return values;
};

User.prototype.updateBalance = async function(amount, transaction) {
  const oldBalance = parseFloat(this.balance);
  const newBalance = oldBalance + parseFloat(amount);
  
  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }
  
  this.balance = newBalance;
  await this.save({ transaction });
  
  return { oldBalance, newBalance };
};

// Class methods
User.findBySteamId = function(steamId) {
  return this.findOne({ where: { steamId } });
};

module.exports = User;