const crypto = require('crypto');
const { sequelize } = require('../config/database');
const { Case, Item, CaseItem, User, Opening, UserInventory, Transaction } = require('../models');
const logger = require('../utils/logger');

class CaseService {
  /**
   * Открыть кейс для пользователя
   */
  static async openCase(userId, caseId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Получаем пользователя и кейс
      const user = await User.findByPk(userId, { transaction });
      const caseItem = await Case.findByPk(caseId, { transaction });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!caseItem || !caseItem.isActive) {
        throw new Error('Case not found or inactive');
      }
      
      // Проверяем баланс
      if (parseFloat(user.balance) < parseFloat(caseItem.price)) {
        throw new Error('Insufficient balance');
      }
      
      // Получаем предметы в кейсе
      const caseItems = await CaseItem.findAll({
        where: { caseId },
        include: [{
          model: Item,
          as: 'item',
          where: { isActive: true }
        }],
        transaction
      });
      
      if (caseItems.length === 0) {
        throw new Error('No items in case');
      }
      
      // Генерируем честный рандом
      const seed = crypto.randomBytes(32).toString('hex');
      const rollNumber = this.generateFairRoll(seed, user.steamId, caseId);
      
      // Определяем выигранный предмет
      const wonItem = this.selectWonItem(caseItems, rollNumber);
      
      if (!wonItem) {
        throw new Error('Failed to select item');
      }
      
      // Списываем деньги с баланса
      const { oldBalance, newBalance } = await user.updateBalance(-parseFloat(caseItem.price), transaction);
      
      // Создаем транзакцию покупки кейса
      await Transaction.create({
        userId,
        type: 'case_purchase',
        amount: -parseFloat(caseItem.price),
        balanceBefore: oldBalance,
        balanceAfter: newBalance,
        status: 'completed',
        notes: `Case opened: ${caseItem.name}`
      }, { transaction });
      
      // Создаем запись об открытии
      const opening = await Opening.create({
        userId,
        caseId,
        itemId: wonItem.item.id,
        casePrice: parseFloat(caseItem.price),
        itemPrice: parseFloat(wonItem.item.price),
        seed,
        rollNumber,
        isRareDrop: wonItem.isRare
      }, { transaction });
      
      // Добавляем предмет в инвентарь
      await UserInventory.create({
        userId,
        itemId: wonItem.item.id,
        openingId: opening.id
      }, { transaction });
      
      // Обновляем статистику пользователя
      user.totalWon = parseFloat(user.totalWon) + parseFloat(wonItem.item.price);
      await user.save({ transaction });
      
      await transaction.commit();
      
      logger.info(`Case opened - User: ${userId}, Case: ${caseId}, Item: ${wonItem.item.name}, Roll: ${rollNumber}`);
      
      return {
        opening: {
          ...opening.toJSON(),
          item: wonItem.item,
          case: caseItem
        },
        seed,
        rollNumber,
        userBalance: newBalance
      };
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Case opening error:', error);
      throw error;
    }
  }
  
  /**
   * Генерирует честный рандом на основе seed, steamId и caseId
   */
  static generateFairRoll(seed, steamId, caseId) {
    const combinedSeed = `${seed}:${steamId}:${caseId}`;
    const hash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
    
    // Берем первые 8 символов hex и конвертируем в decimal
    const hexSubstring = hash.substring(0, 8);
    const decimal = parseInt(hexSubstring, 16);
    
    // Нормализуем до 0-100 с точностью до 5 знаков
    const normalized = (decimal / 0xFFFFFFFF) * 100;
    return Math.round(normalized * 100000) / 100000;
  }
  
  /**
   * Выбирает выигранный предмет на основе roll number
   */
  static selectWonItem(caseItems, rollNumber) {
    // Сортируем предметы по шансу (от меньшего к большему)
    const sortedItems = caseItems.sort((a, b) => parseFloat(a.dropChance) - parseFloat(b.dropChance));
    
    let currentChance = 0;
    
    for (const caseItem of sortedItems) {
      currentChance += parseFloat(caseItem.dropChance);
      
      if (rollNumber <= currentChance) {
        return caseItem;
      }
    }
    
    // Fallback - возвращаем последний предмет
    return sortedItems[sortedItems.length - 1];
  }
  
  /**
   * Получить предметы кейса с вероятностями
   */
  static async getCaseItems(caseId) {
    const caseItems = await CaseItem.findAll({
      where: { caseId },
      include: [{
        model: Item,
        as: 'item',
        where: { isActive: true }
      }],
      order: [['dropChance', 'ASC']]
    });
    
    return caseItems.map(ci => ({
      id: ci.item.id,
      name: ci.item.name,
      imageUrl: ci.item.imageUrl,
      rarity: ci.item.rarity,
      rarityColor: ci.item.rarityColor,
      price: parseFloat(ci.item.price),
      dropChance: parseFloat(ci.dropChance),
      isRare: ci.isRare
    }));
  }
  
  /**
   * Валидация честности открытия
   */
  static validateFairness(seed, steamId, caseId, rollNumber) {
    const calculatedRoll = this.generateFairRoll(seed, steamId, caseId);
    return Math.abs(calculatedRoll - rollNumber) < 0.00001;
  }
  
  /**
   * Получить статистику кейса
   */
  static async getCaseStats(caseId) {
    const stats = await Opening.findAll({
      where: { caseId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOpenings'],
        [sequelize.fn('AVG', sequelize.col('item_price')), 'avgItemValue'],
        [sequelize.fn('SUM', sequelize.col('case_price')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_rare_drop = 1 THEN 1 END')), 'rareDrops']
      ],
      raw: true
    });
    
    return stats[0];
  }
}

module.exports = CaseService;