/**
 * StoreTask Validator
 * Validation rules for StoreTask endpoints
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
 * Validate GET /api/store-tasks (query params)
 */
const validateGetStoreTasks = [
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'in_progress', 'completed'])
    .withMessage('Status must be one of: pending, accepted, rejected, in_progress, completed'),
  
  query('broadcastId')
    .optional()
    .isMongoId()
    .withMessage('Invalid broadcast ID format'),
  
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
 * Validate GET /api/store-tasks/:id
 */
const validateGetStoreTaskById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid store task ID format'),
  
  validate
];

/**
 * Validate PUT /api/store-tasks/:id/accept
 */
const validateAcceptStoreTask = [
  param('id')
    .isMongoId()
    .withMessage('Invalid store task ID format'),
  
  validate
];

/**
 * Validate PUT /api/store-tasks/:id/reject
 */
const validateRejectStoreTask = [
  param('id')
    .isMongoId()
    .withMessage('Invalid store task ID format'),
  
  body('rejectedReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
  
  validate
];

/**
 * Validator for assign employees to store task
 * POST /api/store-tasks/:id/assign
 */
const validateAssignEmployees = [
  param('id')
    .isMongoId()
    .withMessage('Invalid store task ID format'),
  
  body('employeeIds')
    .isArray({ min: 1 })
    .withMessage('Employee IDs must be a non-empty array'),
  
  body('employeeIds.*')
    .isMongoId()
    .withMessage('Each employee ID must be a valid MongoDB ObjectId'),
  
  validate
];

module.exports = {
  validateGetStoreTasks,
  validateGetStoreTaskById,
  validateAcceptStoreTask,
  validateRejectStoreTask,
  validateAssignEmployees
};
