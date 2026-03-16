const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');

exports.validateProject = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Project description is required')
    .isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  
  body('status')
    .optional()
    .isIn(['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),
  
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('budget')
    .optional()
    .isNumeric().withMessage('Budget must be a number')
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  
  validate
];
