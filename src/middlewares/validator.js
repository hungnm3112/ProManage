const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

// Validate request
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return sendError(res, errorMessages.join(', '), 400);
  }
  
  next();
};

// Sanitize input
exports.sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attacks
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[<>]/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
