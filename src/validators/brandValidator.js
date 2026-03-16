/**
 * Brand Validator
 * Validation rules for Brand endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const { body, param, query, validationResult } = require('express-validator');
const { errorResponse } = require('../helpers/responseHandler');
const mongoose = require('mongoose');

/**
 * Validation middleware to check for errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return errorResponse(res, errorMessages, 400);
  }
  next();
};

/**
 * Validate GET /api/brands (query params)
 */
const validateGetBrands = [
  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be "true" or "false"'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
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
 * Validate GET /api/brands/:id
 */
const validateGetBrandById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid brand ID format'),
  
  validate
];

/**
 * Validate GET /api/brands/:id/employees
 */
const validateGetBrandEmployees = [
  param('id')
    .isMongoId()
    .withMessage('Invalid brand ID format'),
  
  validate
];

/**
 * Validate PUT /api/brands/:id (update brand)
 */
const validateUpdateBrand = [
  param('id')
    .isMongoId()
    .withMessage('Invalid brand ID format'),
  
  body('Name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Brand name must be at least 2 characters'),
  
  body('Map_Address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Map address must not exceed 500 characters'),
  
  body('Phone')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Phone must be 10 digits starting with 0'),
  
  body('Image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  body('WifiAddress')
    .optional()
    .trim(),
  
  body('Icon')
    .optional()
    .trim()
    .isURL()
    .withMessage('Icon must be a valid URL'),
  
  body('HeaderContent')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Header content must not exceed 1000 characters'),
  
  body('CheckIn')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage('CheckIn must be in format HH:mm:ss'),
  
  body('CheckOut')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage('CheckOut must be in format HH:mm:ss'),
  
  body('LateIn')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage('LateIn must be in format HH:mm:ss'),
  
  body('OutOvertime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage('OutOvertime must be in format HH:mm:ss'),
  
  body('Active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be "true" or "false"'),
  
  body('Phone_Customer_Support')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Customer support phone must be 10 digits starting with 0'),
  
  body('Phone_Feedback')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Feedback phone must be 10 digits starting with 0'),
  
  body('Link_Description')
    .optional()
    .trim()
    .isURL()
    .withMessage('Link description must be a valid URL'),
  
  body('Active_Schedule')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active_Schedule must be "true" or "false"'),
  
  body('PercentPayment')
    .optional()
    .trim(),
  
  validate
];

/**
 * Validate PATCH /api/brands/:id/manager (assign manager)
 */
const validateAssignManager = [
  param('id')
    .isMongoId()
    .withMessage('Invalid brand ID format'),
  
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  
  validate
];

module.exports = {
  validateGetBrands,
  validateGetBrandById,
  validateGetBrandEmployees,
  validateUpdateBrand,
  validateAssignManager
};
