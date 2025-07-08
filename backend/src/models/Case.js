const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'covert', 'exceedingly_rare']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  chance: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isSpecial: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'item'
  }
});

const caseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String,
    required: true
  },
  items: [itemSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'general'
  },
  timesOpened: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  minLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    theme: {
      type: String,
      default: 'default'
    },
    backgroundColor: {
      type: String,
      default: '#1a1a1a'
    },
    accentColor: {
      type: String,
      default: '#ff6b35'
    }
  }
}, {
  timestamps: true
});

// Indexes
caseSchema.index({ isActive: 1, sortOrder: 1 });
caseSchema.index({ category: 1, isActive: 1 });
caseSchema.index({ isPopular: 1, isActive: 1 });
caseSchema.index({ timesOpened: -1 });

// Virtual for total item chances (should equal 100)
caseSchema.virtual('totalChance').get(function() {
  return this.items.reduce((total, item) => total + item.chance, 0);
});

// Methods
caseSchema.methods.getRandomItem = function() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const item of this.items) {
    cumulative += item.chance;
    if (random <= cumulative) {
      return item;
    }
  }
  
  // Fallback to last item if something goes wrong
  return this.items[this.items.length - 1];
};

caseSchema.methods.incrementOpened = async function() {
  this.timesOpened += 1;
  this.totalRevenue += this.price;
  return await this.save();
};

caseSchema.methods.getItemsByRarity = function(rarity) {
  return this.items.filter(item => item.rarity === rarity);
};

caseSchema.methods.validateChances = function() {
  const total = this.totalChance;
  return Math.abs(total - 100) < 0.01; // Allow small floating point errors
};

// Static methods
caseSchema.statics.getActiveCases = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
};

caseSchema.statics.getPopularCases = function(limit = 10) {
  return this.find({ isActive: true, isPopular: true })
    .sort({ timesOpened: -1 })
    .limit(limit);
};

caseSchema.statics.getCasesByCategory = function(category) {
  return this.find({ isActive: true, category })
    .sort({ sortOrder: 1, createdAt: -1 });
};

// Pre-save validation
caseSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    if (!this.validateChances()) {
      return next(new Error(`Total item chances must equal 100%, currently ${this.totalChance}%`));
    }
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);