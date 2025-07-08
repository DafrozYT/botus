const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  steamId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: ''
  },
  profileUrl: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposited: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  casesOpened: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWon: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: ''
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ steamId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ balance: -1 });
userSchema.index({ createdAt: -1 });

// Virtual for formatted balance
userSchema.virtual('formattedBalance').get(function() {
  return this.balance.toFixed(2);
});

// Methods
userSchema.methods.updateBalance = async function(amount, type = 'add') {
  if (type === 'add') {
    this.balance += amount;
  } else if (type === 'subtract') {
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
  }
  
  return await this.save();
};

userSchema.methods.addDeposit = async function(amount) {
  this.balance += amount;
  this.totalDeposited += amount;
  return await this.save();
};

userSchema.methods.addWithdrawal = async function(amount) {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.totalWithdrawn += amount;
  return await this.save();
};

userSchema.methods.incrementCasesOpened = async function() {
  this.casesOpened += 1;
  return await this.save();
};

userSchema.methods.addWinnings = async function(amount) {
  this.totalWon += amount;
  return await this.save();
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

// Static methods
userSchema.statics.findBySteamId = function(steamId) {
  return this.findOne({ steamId });
};

userSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalWon: -1 })
    .limit(limit)
    .select('username avatar totalWon casesOpened');
};

module.exports = mongoose.model('User', userSchema);