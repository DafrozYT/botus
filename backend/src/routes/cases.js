const express = require('express');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const caseController = require('../controllers/caseController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Rate limiting for case opening
const caseOpenLimit = rateLimit({
  windowMs: parseInt(process.env.CASE_OPEN_WINDOW_MS) || 60000,
  max: parseInt(process.env.CASE_OPEN_RATE_LIMIT) || 10,
  message: {
    error: 'Too many case opening attempts, please try again later.'
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

// Validation schemas
const caseIdValidation = [
  param('caseId').isMongoId().withMessage('Invalid case ID')
];

const openCaseValidation = [
  body('caseId').isMongoId().withMessage('Invalid case ID'),
  body('clientSeed').optional().isString().trim().isLength({ min: 1, max: 64 })
    .withMessage('Client seed must be a string between 1-64 characters')
];

const categoryValidation = [
  param('category').isString().trim().isLength({ min: 1, max: 50 })
    .withMessage('Category must be a string between 1-50 characters')
];

const paginationValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('skip').optional().isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
];

// Public routes (no authentication required)
router.get('/', caseController.getCases);
router.get('/popular', caseController.getPopularCases);
router.get('/recent-drops', caseController.getRecentDrops);
router.get('/big-wins', caseController.getBigWins);
router.get('/category/:category', categoryValidation, caseController.getCasesByCategory);
router.get('/:caseId', caseIdValidation, caseController.getCaseById);
router.get('/:caseId/history', caseIdValidation, caseController.getCaseHistory);
router.get('/:caseId/stats', caseIdValidation, caseController.getCaseStats);

// Protected routes (authentication required)
router.use(authMiddleware);

router.post('/open', 
  caseOpenLimit,
  openCaseValidation,
  caseController.openCase
);

router.get('/user/history', 
  paginationValidation,
  caseController.getUserHistory
);

router.get('/user/stats', caseController.getUserStats);

router.get('/drops/:dropId/verify', 
  param('dropId').isMongoId().withMessage('Invalid drop ID'),
  caseController.verifyDrop
);

// Admin routes
router.get('/admin/stats',
  adminMiddleware,
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  caseController.getAdminStats
);

module.exports = router;