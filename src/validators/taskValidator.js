const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');

exports.validateTask = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Task title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('project')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID'),
  
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid due date format'),
  
  body('estimatedHours')
    .optional()
    .isNumeric().withMessage('Estimated hours must be a number')
    .isFloat({ min: 0 }).withMessage('Estimated hours must be positive'),
  
  body('actualHours')
    .optional()
    .isNumeric().withMessage('Actual hours must be a number')
    .isFloat({ min: 0 }).withMessage('Actual hours must be positive'),
  
  validate
];

exports.validateComment = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  
  validate
];
