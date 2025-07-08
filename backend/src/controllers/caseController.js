const caseService = require('../services/caseService');
const { validationResult } = require('express-validator');

class CaseController {
  /**
   * Get all active cases
   */
  async getCases(req, res) {
    try {
      const cases = await caseService.getActiveCases();
      res.json({
        success: true,
        data: cases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get case by ID
   */
  async getCaseById(req, res) {
    try {
      const { caseId } = req.params;
      const caseData = await caseService.getCaseById(caseId);
      
      res.json({
        success: true,
        data: caseData
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get popular cases
   */
  async getPopularCases(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const cases = await caseService.getPopularCases(limit);
      
      res.json({
        success: true,
        data: cases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get cases by category
   */
  async getCasesByCategory(req, res) {
    try {
      const { category } = req.params;
      const cases = await caseService.getCasesByCategory(category);
      
      res.json({
        success: true,
        data: cases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Open a case
   */
  async openCase(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { caseId, clientSeed } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await caseService.openCase(
        userId,
        caseId,
        clientSeed,
        ipAddress,
        userAgent
      );

      // Emit to WebSocket for real-time updates
      if (req.app.locals.io) {
        req.app.locals.io.emit('case_opened', {
          user: {
            id: userId,
            username: req.user.username,
            avatar: req.user.avatar
          },
          case: {
            id: caseId,
            name: result.drop.item.name
          },
          item: result.drop.item,
          profit: result.drop.profit
        });
      }

      res.json(result);
    } catch (error) {
      const statusCode = error.message.includes('Insufficient balance') ? 400 :
                        error.message.includes('not found') ? 404 :
                        error.message.includes('banned') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user's case opening history
   */
  async getUserHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      const history = await caseService.getUserDropHistory(userId, limit, skip);
      
      res.json({
        success: true,
        data: history,
        pagination: {
          limit,
          skip,
          hasMore: history.length === limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get case drop history
   */
  async getCaseHistory(req, res) {
    try {
      const { caseId } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const history = await caseService.getCaseDropHistory(caseId, limit);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get recent drops across all cases
   */
  async getRecentDrops(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const drops = await caseService.getRecentDrops(limit);
      
      res.json({
        success: true,
        data: drops
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get big wins
   */
  async getBigWins(req, res) {
    try {
      const minProfit = parseInt(req.query.minProfit) || 100;
      const limit = parseInt(req.query.limit) || 10;
      
      const bigWins = await caseService.getBigWins(minProfit, limit);
      
      res.json({
        success: true,
        data: bigWins
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await caseService.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get case statistics
   */
  async getCaseStats(req, res) {
    try {
      const { caseId } = req.params;
      const stats = await caseService.getCaseStats(caseId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify a drop using provably fair
   */
  async verifyDrop(req, res) {
    try {
      const { dropId } = req.params;
      const verification = await caseService.verifyDrop(dropId);
      
      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get admin statistics (admin only)
   */
  async getAdminStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const stats = await caseService.getAdminStats(start, end);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CaseController();