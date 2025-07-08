const mongoose = require('mongoose');

const dropSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  itemRarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'covert', 'exceedingly_rare']
  },
  itemPrice: {
    type: Number,
    required: true,
    min: 0
  },
  itemImageUrl: {
    type: String,
    required: true
  },
  casePrice: {
    type: Number,
    required: true,
    min: 0
  },
  profit: {
    type: Number,
    required: true
  },
  // Provably Fair data
  serverSeed: {
    type: String,
    required: true
  },
  clientSeed: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: true,
    min: 0
  },
  hash: {
    type: String,
    required: true
  },
  randomValue: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // Additional metadata
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance and queries
dropSchema.index({ userId: 1, createdAt: -1 });
dropSchema.index({ caseId: 1, createdAt: -1 });
dropSchema.index({ itemRarity: 1, createdAt: -1 });
dropSchema.index({ profit: -1 });
dropSchema.index({ serverSeed: 1, clientSeed: 1, nonce: 1 }, { unique: true });
dropSchema.index({ createdAt: -1 });

// Virtual for profit percentage
dropSchema.virtual('profitPercentage').get(function() {
  return ((this.itemPrice - this.casePrice) / this.casePrice * 100).toFixed(2);
});

// Virtual for formatted dates
dropSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Methods
dropSchema.methods.verify = async function() {
  const crypto = require('crypto');
  
  // Recreate hash and verify
  const combinedSeed = this.serverSeed + this.clientSeed + this.nonce;
  const expectedHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
  
  if (expectedHash === this.hash) {
    this.isVerified = true;
    this.verifiedAt = new Date();
    return await this.save();
  }
  
  throw new Error('Drop verification failed');
};

dropSchema.methods.toJSON = function() {
  const drop = this.toObject();
  delete drop.__v;
  return drop;
};

// Static methods
dropSchema.statics.getUserDropHistory = function(userId, limit = 50, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('caseId', 'name imageUrl')
    .select('-serverSeed'); // Don't expose server seed in history
};

dropSchema.statics.getCaseDropHistory = function(caseId, limit = 100) {
  return this.find({ caseId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username avatar')
    .select('-serverSeed -ipAddress -userAgent');
};

dropSchema.statics.getRecentDrops = function(limit = 20) {
  return this.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username avatar')
    .populate('caseId', 'name')
    .select('-serverSeed -ipAddress -userAgent');
};

dropSchema.statics.getBigWins = function(minProfit = 100, limit = 10) {
  return this.find({ profit: { $gte: minProfit } })
    .sort({ profit: -1 })
    .limit(limit)
    .populate('userId', 'username avatar')
    .populate('caseId', 'name')
    .select('-serverSeed -ipAddress -userAgent');
};

dropSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalDrops: { $sum: 1 },
        totalSpent: { $sum: '$casePrice' },
        totalWon: { $sum: '$itemPrice' },
        totalProfit: { $sum: '$profit' },
        biggestWin: { $max: '$itemPrice' },
        averageItemValue: { $avg: '$itemPrice' }
      }
    }
  ]);
  
  return stats[0] || {
    totalDrops: 0,
    totalSpent: 0,
    totalWon: 0,
    totalProfit: 0,
    biggestWin: 0,
    averageItemValue: 0
  };
};

dropSchema.statics.getCaseStats = async function(caseId) {
  const stats = await this.aggregate([
    { $match: { caseId: mongoose.Types.ObjectId(caseId) } },
    {
      $group: {
        _id: null,
        totalDrops: { $sum: 1 },
        totalRevenue: { $sum: '$casePrice' },
        totalPayout: { $sum: '$itemPrice' },
        averageItemValue: { $avg: '$itemPrice' },
        rarityDistribution: {
          $push: '$itemRarity'
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalDrops: 0,
    totalRevenue: 0,
    totalPayout: 0,
    averageItemValue: 0,
    rarityDistribution: []
  };
};

module.exports = mongoose.model('Drop', dropSchema);