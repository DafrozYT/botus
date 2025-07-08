const express = require('express');
const { Transaction, Promocode, PromocodeUse, User } = require('../models');
const { requireAuth, checkBanned } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const router = express.Router();

// Применить промокод
router.post('/promocode', requireAuth, checkBanned, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promocode is required'
      });
    }
    
    // Найти промокод
    const promocode = await Promocode.findOne({
      where: { code: code.toUpperCase() },
      transaction
    });
    
    if (!promocode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promocode'
      });
    }
    
    // Проверить валидность
    if (!promocode.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Promocode expired or inactive'
      });
    }
    
    // Проверить, не использовал ли пользователь уже этот промокод
    const canUse = await promocode.canBeUsedBy(req.user.id);
    if (!canUse) {
      return res.status(400).json({
        success: false,
        message: 'Promocode already used'
      });
    }
    
    // Рассчитать сумму бонуса
    let bonusAmount = 0;
    
    switch (promocode.type) {
      case 'balance':
        bonusAmount = parseFloat(promocode.value);
        break;
      case 'percentage':
        const userBalance = parseFloat(req.user.balance);
        bonusAmount = userBalance * (parseFloat(promocode.value) / 100);
        break;
      case 'free_case':
        // Для бесплатного кейса просто даем его стоимость
        bonusAmount = parseFloat(promocode.value);
        break;
    }
    
    if (bonusAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bonus amount'
      });
    }
    
    // Обновить баланс пользователя
    const user = await User.findByPk(req.user.id, { transaction });
    const { oldBalance, newBalance } = await user.updateBalance(bonusAmount, transaction);
    
    // Создать транзакцию
    await Transaction.create({
      userId: req.user.id,
      type: 'bonus',
      amount: bonusAmount,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      status: 'completed',
      notes: `Promocode: ${code}`
    }, { transaction });
    
    // Записать использование промокода
    await PromocodeUse.create({
      promocodeId: promocode.id,
      userId: req.user.id,
      amountReceived: bonusAmount
    }, { transaction });
    
    // Обновить счетчик использований
    promocode.currentUses += 1;
    await promocode.save({ transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Promocode applied successfully',
      data: {
        bonusAmount,
        newBalance
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Создать депозит (заглушка для платежной системы)
router.post('/deposit', requireAuth, checkBanned, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    const minDeposit = parseFloat(process.env.MIN_DEPOSIT || 1.00);
    if (amount < minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit amount is $${minDeposit}`
      });
    }
    
    // Создать транзакцию в статусе pending
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      balanceBefore: parseFloat(req.user.balance),
      balanceAfter: parseFloat(req.user.balance), // Обновится после подтверждения
      status: 'pending',
      paymentMethod: paymentMethod || 'card',
      paymentId: `dep_${Date.now()}_${req.user.id}`
    });
    
    res.json({
      success: true,
      message: 'Deposit initiated',
      data: {
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        amount: transaction.amount,
        status: transaction.status
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Webhook для подтверждения депозита (заглушка)
router.post('/webhook/deposit', async (req, res) => {
  try {
    const { paymentId, status, amount } = req.body;
    
    const transaction = await Transaction.findOne({
      where: { paymentId, type: 'deposit' }
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (status === 'completed') {
      const user = await User.findByPk(transaction.userId);
      
      // Обновляем баланс пользователя
      const newBalance = parseFloat(user.balance) + parseFloat(amount);
      user.balance = newBalance;
      user.totalDeposited = parseFloat(user.totalDeposited) + parseFloat(amount);
      await user.save();
      
      // Обновляем транзакцию
      transaction.status = 'completed';
      transaction.balanceAfter = newBalance;
      transaction.completedAt = new Date();
      await transaction.save();
    } else {
      transaction.status = 'failed';
      await transaction.save();
    }
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;