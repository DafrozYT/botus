const Case = require('../models/Case');
const User = require('../models/User');
const Drop = require('../models/Drop');
const provablyFair = require('../utils/provablyFair');

class CaseService {
  /**
   * Get all active cases
   * @returns {Array} - Array of active cases
   */
  async getActiveCases() {
    try {
      return await Case.getActiveCases();
    } catch (error) {
      throw new Error(`Failed to fetch cases: ${error.message}`);
    }
  }

  /**
   * Get case by ID
   * @param {string} caseId - Case ID
   * @returns {Object} - Case object
   */
  async getCaseById(caseId) {
    try {
      const caseData = await Case.findById(caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }
      if (!caseData.isActive) {
        throw new Error('Case is not active');
      }
      return caseData;
    } catch (error) {
      throw new Error(`Failed to fetch case: ${error.message}`);
    }
  }

  /**
   * Get popular cases
   * @param {number} limit - Number of cases to return
   * @returns {Array} - Array of popular cases
   */
  async getPopularCases(limit = 10) {
    try {
      return await Case.getPopularCases(limit);
    } catch (error) {
      throw new Error(`Failed to fetch popular cases: ${error.message}`);
    }
  }

  /**
   * Get cases by category
   * @param {string} category - Case category
   * @returns {Array} - Array of cases in category
   */
  async getCasesByCategory(category) {
    try {
      return await Case.getCasesByCategory(category);
    } catch (error) {
      throw new Error(`Failed to fetch cases by category: ${error.message}`);
    }
  }

  /**
   * Open a case for a user
   * @param {string} userId - User ID
   * @param {string} caseId - Case ID
   * @param {string} clientSeed - Client seed for provably fair (optional)
   * @param {string} ipAddress - User's IP address
   * @param {string} userAgent - User's browser user agent
   * @returns {Object} - Case opening result
   */
  async openCase(userId, caseId, clientSeed = null, ipAddress = '', userAgent = '') {
    try {
      // Get user and case data
      const [user, caseData] = await Promise.all([
        User.findById(userId),
        this.getCaseById(caseId)
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isBanned) {
        throw new Error('User is banned');
      }

      // Check if user has sufficient balance
      if (user.balance < caseData.price) {
        throw new Error('Insufficient balance');
      }

      // Generate nonce (incremental counter for this user)
      const userDropCount = await Drop.countDocuments({ userId });
      const nonce = userDropCount + 1;

      // Use provably fair algorithm to select item
      const result = provablyFair.openCase(caseData.items, clientSeed, nonce);
      const selectedItem = result.selectedItem;
      const fairData = result.provablyFair;

      // Calculate profit/loss
      const profit = selectedItem.price - caseData.price;

      // Create drop record
      const drop = new Drop({
        userId,
        caseId,
        itemId: selectedItem._id,
        itemName: selectedItem.name,
        itemRarity: selectedItem.rarity,
        itemPrice: selectedItem.price,
        itemImageUrl: selectedItem.imageUrl,
        casePrice: caseData.price,
        profit,
        serverSeed: fairData.serverSeed,
        clientSeed: fairData.clientSeed,
        nonce: fairData.nonce,
        hash: fairData.hash,
        randomValue: fairData.randomValue,
        ipAddress,
        userAgent
      });

      // Start transaction-like operations
      const session = await Drop.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Save drop
          await drop.save({ session });

          // Update user balance and statistics
          await user.updateBalance(caseData.price, 'subtract');
          await user.incrementCasesOpened();
          if (profit > 0) {
            await user.addWinnings(profit);
          }

          // Update case statistics
          await caseData.incrementOpened();
        });

        await session.endSession();

        // Return successful result
        return {
          success: true,
          drop: {
            id: drop._id,
            item: {
              id: selectedItem._id,
              name: selectedItem.name,
              rarity: selectedItem.rarity,
              price: selectedItem.price,
              imageUrl: selectedItem.imageUrl,
              description: selectedItem.description
            },
            casePrice: caseData.price,
            profit,
            profitPercentage: ((profit / caseData.price) * 100).toFixed(2)
          },
          provablyFair: {
            serverSeedHash: fairData.serverSeedHash,
            clientSeed: fairData.clientSeed,
            nonce: fairData.nonce,
            hash: fairData.hash,
            randomValue: fairData.randomValue,
            verificationUrl: provablyFair.generateVerificationUrl(
              fairData.serverSeed,
              fairData.clientSeed,
              fairData.nonce,
              fairData.hash
            )
          },
          user: {
            newBalance: user.balance,
            casesOpened: user.casesOpened,
            totalWon: user.totalWon
          }
        };

      } catch (transactionError) {
        await session.endSession();
        throw transactionError;
      }

    } catch (error) {
      throw new Error(`Failed to open case: ${error.message}`);
    }
  }

  /**
   * Get user's case opening history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @param {number} skip - Number of records to skip
   * @returns {Array} - User's drop history
   */
  async getUserDropHistory(userId, limit = 50, skip = 0) {
    try {
      return await Drop.getUserDropHistory(userId, limit, skip);
    } catch (error) {
      throw new Error(`Failed to fetch user drop history: ${error.message}`);
    }
  }

  /**
   * Get case opening history for a specific case
   * @param {string} caseId - Case ID
   * @param {number} limit - Number of records to return
   * @returns {Array} - Case drop history
   */
  async getCaseDropHistory(caseId, limit = 100) {
    try {
      return await Drop.getCaseDropHistory(caseId, limit);
    } catch (error) {
      throw new Error(`Failed to fetch case drop history: ${error.message}`);
    }
  }

  /**
   * Get recent drops across all cases
   * @param {number} limit - Number of records to return
   * @returns {Array} - Recent drops
   */
  async getRecentDrops(limit = 20) {
    try {
      return await Drop.getRecentDrops(limit);
    } catch (error) {
      throw new Error(`Failed to fetch recent drops: ${error.message}`);
    }
  }

  /**
   * Get big wins (high-value drops)
   * @param {number} minProfit - Minimum profit to be considered a big win
   * @param {number} limit - Number of records to return
   * @returns {Array} - Big wins
   */
  async getBigWins(minProfit = 100, limit = 10) {
    try {
      return await Drop.getBigWins(minProfit, limit);
    } catch (error) {
      throw new Error(`Failed to fetch big wins: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Object} - User statistics
   */
  async getUserStats(userId) {
    try {
      return await Drop.getUserStats(userId);
    } catch (error) {
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }
  }

  /**
   * Get case statistics
   * @param {string} caseId - Case ID
   * @returns {Object} - Case statistics
   */
  async getCaseStats(caseId) {
    try {
      return await Drop.getCaseStats(caseId);
    } catch (error) {
      throw new Error(`Failed to fetch case stats: ${error.message}`);
    }
  }

  /**
   * Verify a drop using provably fair algorithm
   * @param {string} dropId - Drop ID
   * @returns {Object} - Verification result
   */
  async verifyDrop(dropId) {
    try {
      const drop = await Drop.findById(dropId);
      if (!drop) {
        throw new Error('Drop not found');
      }

      const isValid = provablyFair.verify(
        drop.serverSeed,
        drop.clientSeed,
        drop.nonce,
        drop.hash,
        drop.randomValue
      );

      if (isValid && !drop.isVerified) {
        await drop.verify();
      }

      return {
        isValid,
        drop: drop,
        verificationData: provablyFair.createVerificationData(
          drop.serverSeed,
          drop.clientSeed,
          drop.nonce,
          drop.hash,
          drop.randomValue
        )
      };

    } catch (error) {
      throw new Error(`Failed to verify drop: ${error.message}`);
    }
  }

  /**
   * Get case opening statistics for admin dashboard
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Object} - Statistics summary
   */
  async getAdminStats(startDate = null, endDate = null) {
    try {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;

      const matchFilter = {};
      if (Object.keys(dateFilter).length > 0) {
        matchFilter.createdAt = dateFilter;
      }

      const stats = await Drop.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalDrops: { $sum: 1 },
            totalRevenue: { $sum: '$casePrice' },
            totalPayout: { $sum: '$itemPrice' },
            totalProfit: { $sum: { $subtract: ['$casePrice', '$itemPrice'] } },
            averageCasePrice: { $avg: '$casePrice' },
            averageItemValue: { $avg: '$itemPrice' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ]);

      const result = stats[0] || {
        totalDrops: 0,
        totalRevenue: 0,
        totalPayout: 0,
        totalProfit: 0,
        averageCasePrice: 0,
        averageItemValue: 0,
        uniqueUsers: []
      };

      result.uniqueUsersCount = result.uniqueUsers ? result.uniqueUsers.length : 0;
      result.profitMargin = result.totalRevenue > 0 
        ? ((result.totalProfit / result.totalRevenue) * 100).toFixed(2) + '%'
        : '0%';

      delete result.uniqueUsers; // Don't return the actual user IDs

      return result;

    } catch (error) {
      throw new Error(`Failed to fetch admin stats: ${error.message}`);
    }
  }
}

module.exports = new CaseService();