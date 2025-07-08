const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Steam OpenID authentication URL generator
 */
router.get('/steam', (req, res) => {
  const returnUrl = `${req.protocol}://${req.get('host')}/api/auth/steam/callback`;
  const steamOpenIdUrl = `https://steamcommunity.com/openid/login?` +
    `openid.ns=http://specs.openid.net/auth/2.0&` +
    `openid.mode=checkid_setup&` +
    `openid.return_to=${encodeURIComponent(returnUrl)}&` +
    `openid.realm=${encodeURIComponent(`${req.protocol}://${req.get('host')}`)}&` +
    `openid.identity=http://specs.openid.net/auth/2.0/identifier_select&` +
    `openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;

  res.json({
    success: true,
    authUrl: steamOpenIdUrl
  });
});

/**
 * Steam OAuth callback handler
 */
router.get('/steam/callback', async (req, res) => {
  try {
    const { 
      'openid.mode': mode,
      'openid.claimed_id': claimedId,
      'openid.identity': identity,
      'openid.sig': signature,
      'openid.signed': signed,
      'openid.assoc_handle': assocHandle,
      'openid.response_nonce': responseNonce
    } = req.query;

    // Verify OpenID response
    if (mode !== 'id_res') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Extract Steam ID from identity URL
    const steamIdMatch = identity.match(/\/id\/(\d+)/);
    if (!steamIdMatch) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_steam_id`);
    }

    const steamId = steamIdMatch[1];

    // Verify the signature with Steam
    const verificationParams = new URLSearchParams();
    verificationParams.append('openid.assoc_handle', assocHandle);
    verificationParams.append('openid.signed', signed);
    verificationParams.append('openid.sig', signature);
    verificationParams.append('openid.ns', 'http://specs.openid.net/auth/2.0');
    verificationParams.append('openid.mode', 'check_authentication');
    verificationParams.append('openid.op_endpoint', 'https://steamcommunity.com/openid/login');
    verificationParams.append('openid.claimed_id', claimedId);
    verificationParams.append('openid.identity', identity);
    verificationParams.append('openid.return_to', req.query['openid.return_to']);
    verificationParams.append('openid.response_nonce', responseNonce);

    const verificationResponse = await axios.post(
      'https://steamcommunity.com/openid/login',
      verificationParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!verificationResponse.data.includes('is_valid:true')) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=verification_failed`);
    }

    // Get user profile data from Steam API
    const steamApiUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`;
    const profileResponse = await axios.get(steamApiUrl);
    
    const playerData = profileResponse.data.response.players[0];
    if (!playerData) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=profile_not_found`);
    }

    // Find or create user
    let user = await User.findBySteamId(steamId);
    
    if (!user) {
      // Create new user
      user = new User({
        steamId,
        username: playerData.personaname,
        avatar: playerData.avatarfull || playerData.avatarmedium || playerData.avatar,
        profileUrl: playerData.profileurl
      });
      await user.save();
    } else {
      // Update existing user data
      user.username = playerData.personaname;
      user.avatar = playerData.avatarfull || playerData.avatarmedium || playerData.avatar;
      user.profileUrl = playerData.profileurl;
      user.lastLoginAt = new Date();
      user.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        steamId: user.steamId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Steam auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
});

/**
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        steamId: user.steamId,
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        casesOpened: user.casesOpened,
        totalWon: user.totalWon,
        role: user.role,
        settings: user.settings,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * Update user settings
 */
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { notifications, language, currency } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update settings
    if (typeof notifications === 'boolean') {
      user.settings.notifications = notifications;
    }
    if (language && typeof language === 'string') {
      user.settings.language = language;
    }
    if (currency && typeof currency === 'string') {
      user.settings.currency = currency;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * Refresh token
 */
router.post('/refresh', authMiddleware, (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { 
        userId: req.user.id,
        steamId: req.user.steamId,
        role: req.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: req.user
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

/**
 * Logout (client-side token invalidation)
 */
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;