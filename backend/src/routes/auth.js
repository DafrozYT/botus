const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Steam авторизация
router.get('/steam', passport.authenticate('steam'));

// Возврат с Steam
router.get('/steam/return', 
  passport.authenticate('steam', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Генерируем JWT токен для пользователя
      const token = generateToken(req.user);
      
      // Редирект на фронтенд с токеном
      const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/auth/success?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/auth/error`);
    }
  }
);

// Выход
router.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Could not log out'
        });
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// Проверка статуса авторизации
router.get('/status', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        avatarUrl: req.user.avatarUrl,
        balance: req.user.balance,
        isAdmin: req.user.isAdmin
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

module.exports = router;