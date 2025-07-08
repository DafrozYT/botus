const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const User = require('../models/User');
const SiteSetting = require('../models/SiteSetting');
const logger = require('../utils/logger');

passport.use(new SteamStrategy({
  returnURL: process.env.STEAM_RETURN_URL || 'http://localhost:3000/auth/steam/return',
  realm: process.env.STEAM_REALM || 'http://localhost:3000/',
  apiKey: process.env.STEAM_API_KEY
}, async (identifier, profile, done) => {
  try {
    const steamId = identifier.match(/\d+$/)[0];
    
    // Check if user exists
    let user = await User.findBySteamId(steamId);
    
    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      logger.info(`User logged in: ${user.username} (${steamId})`);
    } else {
      // Create new user
      const welcomeBonus = await SiteSetting.getValue('welcome_bonus', 5.00);
      
      user = await User.create({
        steamId,
        username: profile.displayName || `User${steamId.slice(-6)}`,
        avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[2].value : null,
        balance: welcomeBonus,
        lastLogin: new Date()
      });
      
      // Create welcome bonus transaction
      if (welcomeBonus > 0) {
        const Transaction = require('../models/Transaction');
        await Transaction.create({
          userId: user.id,
          type: 'bonus',
          amount: welcomeBonus,
          balanceBefore: 0,
          balanceAfter: welcomeBonus,
          status: 'completed',
          notes: 'Welcome bonus'
        });
      }
      
      logger.info(`New user registered: ${user.username} (${steamId})`);
    }
    
    return done(null, user);
  } catch (error) {
    logger.error('Steam authentication error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;