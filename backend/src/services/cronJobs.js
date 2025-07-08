const cron = require('node-cron');
const marketService = require('./marketService');
const { SiteSetting } = require('../models');
const logger = require('../utils/logger');

// Обновление цен каждый час
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Starting scheduled price update');
    await marketService.updateItemPrices();
  } catch (error) {
    logger.error('Scheduled price update failed:', error);
  }
});

// Парсинг новых предметов каждые 6 часов
cron.schedule('0 */6 * * *', async () => {
  try {
    logger.info('Starting scheduled new items parsing');
    await marketService.parseNewItems(50);
  } catch (error) {
    logger.error('Scheduled items parsing failed:', error);
  }
});

// Очистка старых логов каждый день в 2:00
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('Starting log cleanup');
    const fs = require('fs');
    const path = require('path');
    
    const logsDir = path.join(__dirname, '../../logs');
    const files = fs.readdirSync(logsDir);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < oneWeekAgo) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted old log file: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Log cleanup failed:', error);
  }
});

// Обновление кэша настроек каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
  try {
    // Можно добавить кэширование настроек для улучшения производительности
    logger.debug('Settings cache update (placeholder)');
  } catch (error) {
    logger.error('Settings cache update failed:', error);
  }
});

logger.info('Cron jobs initialized');

module.exports = cron;