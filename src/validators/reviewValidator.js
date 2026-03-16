/**
 * Review Validators
 * Validation middleware for review endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const { param, body, query } = require('express-validator');
const { validate } = require('../middlewares/validator');

/**
 * Validator for get pending reviews
 * GET /api/reviews/pending
 */
const validateGetPendingReviews = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validate
];

/**
 * Validator for approve task
 * POST /api/reviews/:taskId/approve
 */
const validateApproveTask = [
  param('taskId')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('reviewNote')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review note must not exceed 1000 characters'),
  
  validate
];

/**
 * Validator for reject task
 * POST /api/reviews/:taskId/reject
 */
const validateRejectTask = [
  param('taskId')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  
  body('reviewNote')
    .notEmpty()
    .withMessage('Review note is required when rejecting a task')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Review note must be between 5 and 1000 characters'),
  
  validate
];

module.exports = {
  validateGetPendingReviews,
  validateApproveTask,
  validateRejectTask
};
