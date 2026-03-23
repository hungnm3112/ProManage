/**
 * UserTask Validators
 * Validation middleware for UserTask endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const { param, body, query } = require('express-validator');
const { validate } = require('../middlewares/validator');

/**
 * Validator for get my tasks
 * GET /api/my-tasks
 */
const validateGetMyTasks = [
  query('status')
    .optional()
    .isIn(['assigned', 'in_progress', 'submitted', 'approved', 'rejected'])
    .withMessage('Invalid status. Must be: assigned, in_progress, submitted, approved, or rejected'),
  
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
 * Validator for get task by ID
 * GET /api/my-tasks/:id
 */
const validateGetTaskById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  
  validate
];

/**
 * Validator for update checklist
 * PUT /api/my-tasks/:id/checklist
 */
const validateUpdateChecklist = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  
  body('checklist')
    .isArray({ min: 1 })
    .withMessage('Checklist must be a non-empty array'),
  
  body('checklist.*.\_id')
    .isMongoId()
    .withMessage('Each checklist item must have a valid _id'),
  
  body('checklist.*.isCompleted')
    .isBoolean()
    .withMessage('isCompleted must be a boolean'),
  
  validate
];

/**
 * Validator for upload evidence
 * POST /api/my-tasks/:id/evidence
 */
const validateUploadEvidence = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  
  body('evidences')
    .isArray({ min: 1 })
    .withMessage('Evidences must be a non-empty array'),
  
  body('evidences.*.type')
    .isIn(['photo', 'video', 'document', 'file'])
    .withMessage('Evidence type must be: photo, video, document, or file'),
  
  body('evidences.*.url')
    .isURL({ require_tld: false })
    .withMessage('Evidence URL must be a valid URL'),
  
  body('evidences.*.filename')
    .notEmpty()
    .withMessage('Evidence filename is required'),
  
  validate
];

/**
 * Validator for submit task
 * POST /api/my-tasks/:id/submit
 */
const validateSubmitTask = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
  
  body('overallNote')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Overall note must not exceed 1000 characters'),
  
  validate
];

module.exports = {
  validateGetMyTasks,
  validateGetTaskById,
  validateUpdateChecklist,
  validateUploadEvidence,
  validateSubmitTask
};
