/**
 * Broadcast Validator
 * Validation rules for Broadcast endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');
const mongoose = require('mongoose');

/**
 * Validation middleware to check for errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return sendError(res, errorMessages, 400);
  }
  next();
};

/**
 * Validate POST /api/broadcasts (create broadcast)
 */
const validateCreateBroadcast = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description cannot be empty'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('deadline')
    .notEmpty()
    .withMessage('Deadline is required')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      const deadline = new Date(value);
      if (deadline < new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('assignedStores')
    .notEmpty()
    .withMessage('Assigned stores are required')
    .isArray({ min: 1 })
    .withMessage('At least one store must be assigned')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Assigned stores must be an array');
      }
      
      // Check if all items are valid MongoDB ObjectIds
      const invalidIds = value.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All assigned stores must be valid store IDs');
      }
      
      return true;
    }),
  
  body('checklist')
    .notEmpty()
    .withMessage('Checklist is required')
    .isArray({ min: 1 })
    .withMessage('Checklist must have at least one item')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('Checklist must be an array');
      }
      
      // Check if all items have 'task' field
      const invalidItems = value.filter(item => !item.task || typeof item.task !== 'string' || item.task.trim() === '');
      if (invalidItems.length > 0) {
        throw new Error('Each checklist item must have a non-empty task field');
      }
      
      return true;
    }),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) {
        return true; // Skip if not array (will be caught by isArray)
      }
      
      // Validate each attachment
      const invalidAttachments = value.filter(item => 
        !item.filename || !item.url || !item.size || !item.mimeType
      );
      
      if (invalidAttachments.length > 0) {
        throw new Error('Each attachment must have filename, url, size, and mimeType');
      }
      
      return true;
    }),
  
  body('recurring')
    .optional()
    .isObject()
    .withMessage('Recurring must be an object'),
  
  body('recurring.enabled')
    .optional()
    .isBoolean()
    .withMessage('Recurring enabled must be a boolean'),
  
  body('recurring.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Recurring frequency must be one of: daily, weekly, monthly'),
  
  validate
];

/**
 * Validate PUT /api/broadcasts/:id (update broadcast)
 */
const validateUpdateBroadcast = [
  param('id')
    .isMongoId()
    .withMessage('Invalid broadcast ID format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description cannot be empty'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      const deadline = new Date(value);
      if (deadline < new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('assignedStores')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one store must be assigned')
    .custom((value) => {
      const invalidIds = value.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All assigned stores must be valid store IDs');
      }
      return true;
    }),
  
  body('checklist')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Checklist must have at least one item')
    .custom((value) => {
      const invalidItems = value.filter(item => !item.task || typeof item.task !== 'string' || item.task.trim() === '');
      if (invalidItems.length > 0) {
        throw new Error('Each checklist item must have a non-empty task field');
      }
      return true;
    }),
  
  validate
];

/**
 * Validate GET /api/broadcasts (query params)
 */
const validateGetBroadcasts = [
  query('status')
    .optional()
    .isIn(['draft', 'active', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, active, completed, archived'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  query('createdBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid creator ID format'),
  
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
 * Validate GET /api/broadcasts/:id
 */
const validateGetBroadcastById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid broadcast ID format'),
  
  validate
];

/**
 * Validate DELETE /api/broadcasts/:id
 */
const validateDeleteBroadcast = [
  param('id')
    .isMongoId()
    .withMessage('Invalid broadcast ID format'),
  
  validate
];

/**
 * Validate POST /api/broadcasts/:id/publish
 */
const validatePublishBroadcast = [
  param('id')
    .isMongoId()
    .withMessage('Invalid broadcast ID format'),
  
  validate
];

module.exports = {
  validateCreateBroadcast,
  validateUpdateBroadcast,
  validateGetBroadcasts,
  validateGetBroadcastById,
  validateDeleteBroadcast,
  validatePublishBroadcast
};
