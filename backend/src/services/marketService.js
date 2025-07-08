const axios = require('axios');
const Item = require('../models/Item');
const logger = require('../utils/logger');

class MarketService {
  constructor() {
    this.apiKey = process.env.MARKET_CSGO_API_KEY;
    this.baseURL = 'https://market.csgo.com/api/v2';
  }
  
  /**
   * Получить цены всех предметов с market.csgo.com
   */
  async fetchPrices(currency = 'USD') {
    try {
      if (!this.apiKey) {
        throw new Error('Market CSGO API key not provided');
      }
      
      const response = await axios.get(`${this.baseURL}/prices/${currency}.json`, {
        params: { key: this.apiKey },
        timeout: 30000
      });
      
      if (!response.data.success) {
        throw new Error('Market API returned error');
      }
      
      return response.data.items;
    } catch (error) {
      logger.error('Market API fetch error:', error.message);
      throw error;
    }
  }
  
  /**
   * Обновить цены предметов в базе данных
   */
  async updateItemPrices() {
    try {
      logger.info('Starting price update from market.csgo.com');
      
      const marketPrices = await this.fetchPrices();
      let updatedCount = 0;
      let errors = 0;
      
      // Получаем все активные предметы из БД
      const items = await Item.findAll({
        where: { isActive: true }
      });
      
      for (const item of items) {
        try {
          const marketData = marketPrices[item.marketHashName];
          
          if (marketData && marketData.price) {
            const newPrice = parseFloat(marketData.price);
            
            // Обновляем цену только если она изменилась значительно (более 1%)
            const currentPrice = parseFloat(item.price);
            const priceChange = Math.abs((newPrice - currentPrice) / currentPrice);
            
            if (priceChange > 0.01 || !item.lastPriceUpdate) {
              await item.updatePrice(newPrice);
              updatedCount++;
              
              logger.debug(`Updated price for ${item.name}: ${currentPrice} -> ${newPrice}`);
            }
          }
        } catch (error) {
          errors++;
          logger.error(`Error updating price for ${item.name}:`, error.message);
        }
      }
      
      logger.info(`Price update completed. Updated: ${updatedCount}, Errors: ${errors}, Total items: ${items.length}`);
      
      return {
        totalItems: items.length,
        updatedCount,
        errors
      };
      
    } catch (error) {
      logger.error('Price update failed:', error);
      throw error;
    }
  }
  
  /**
   * Получить информацию о предмете по market hash name
   */
  async getItemInfo(marketHashName) {
    try {
      const response = await axios.get(`${this.baseURL}/item-info`, {
        params: {
          key: this.apiKey,
          market_hash_name: marketHashName
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching item info for ${marketHashName}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Парсинг новых предметов с market.csgo.com
   */
  async parseNewItems(limit = 100) {
    try {
      logger.info('Starting new items parsing from market.csgo.com');
      
      const marketPrices = await this.fetchPrices();
      const existingItems = await Item.findAll({
        attributes: ['marketHashName']
      });
      
      const existingHashNames = new Set(existingItems.map(item => item.marketHashName));
      const newItems = [];
      
      let count = 0;
      for (const [marketHashName, data] of Object.entries(marketPrices)) {
        if (count >= limit) break;
        
        if (!existingHashNames.has(marketHashName) && data.price && data.price > 0.1) {
          try {
            const itemInfo = await this.getItemInfo(marketHashName);
            
            if (itemInfo.success && itemInfo.data) {
              const item = await this.createItemFromMarketData(marketHashName, data, itemInfo.data);
              newItems.push(item);
              count++;
              
              // Небольшая задержка между запросами
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            logger.error(`Error parsing item ${marketHashName}:`, error.message);
          }
        }
      }
      
      logger.info(`Parsed ${newItems.length} new items from market`);
      return newItems;
      
    } catch (error) {
      logger.error('Items parsing failed:', error);
      throw error;
    }
  }
  
  /**
   * Создать предмет из данных market.csgo.com
   */
  async createItemFromMarketData(marketHashName, priceData, itemInfo) {
    // Определяем редкость по цене (примерная логика)
    const price = parseFloat(priceData.price);
    let rarity, rarityColor;
    
    if (price >= 1000) {
      rarity = 'Extraordinary';
      rarityColor = '#FFD700';
    } else if (price >= 100) {
      rarity = 'Covert';
      rarityColor = '#EB4B4B';
    } else if (price >= 50) {
      rarity = 'Classified';
      rarityColor = '#D32CE6';
    } else if (price >= 10) {
      rarity = 'Restricted';
      rarityColor = '#8847FF';
    } else if (price >= 1) {
      rarity = 'Mil-Spec Grade';
      rarityColor = '#4B69FF';
    } else if (price >= 0.3) {
      rarity = 'Industrial Grade';
      rarityColor = '#5E98D9';
    } else {
      rarity = 'Consumer Grade';
      rarityColor = '#B0C3D9';
    }
    
    // Определяем тип оружия
    let type = 'Unknown';
    const nameLower = marketHashName.toLowerCase();
    
    if (nameLower.includes('knife') || nameLower.includes('karambit') || nameLower.includes('bayonet')) {
      type = 'Knife';
    } else if (nameLower.includes('ak-47') || nameLower.includes('m4a4') || nameLower.includes('m4a1-s')) {
      type = 'Rifle';
    } else if (nameLower.includes('awp') || nameLower.includes('ssg 08')) {
      type = 'Sniper Rifle';
    } else if (nameLower.includes('glock') || nameLower.includes('usp-s') || nameLower.includes('p250')) {
      type = 'Pistol';
    } else if (nameLower.includes('gloves')) {
      type = 'Gloves';
    }
    
    const item = await Item.create({
      name: marketHashName.split(' | ')[0] || marketHashName,
      marketHashName,
      imageUrl: itemInfo.image_url || `https://steamcommunity-a.akamaihd.net/economy/image/${itemInfo.image}/360fx360f`,
      rarity,
      rarityColor,
      price,
      type,
      wear: this.extractWear(marketHashName),
      lastPriceUpdate: new Date()
    });
    
    logger.info(`Created new item: ${item.name} (${item.rarity}) - $${item.price}`);
    return item;
  }
  
  /**
   * Извлечь состояние (wear) из названия предмета
   */
  extractWear(marketHashName) {
    if (marketHashName.includes('Factory New')) return 'Factory New';
    if (marketHashName.includes('Minimal Wear')) return 'Minimal Wear';
    if (marketHashName.includes('Field-Tested')) return 'Field-Tested';
    if (marketHashName.includes('Well-Worn')) return 'Well-Worn';
    if (marketHashName.includes('Battle-Scarred')) return 'Battle-Scarred';
    return 'Factory New';
  }
}

module.exports = new MarketService();