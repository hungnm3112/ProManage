/**
 * Employee Validation
 * 
 * Validation rules cho Employee CRUD operations
 */

const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

/**
 * Validation rules cho create employee
 */
exports.validateCreateEmployee = [
  body('Phone')
    .notEmpty().withMessage('Số điện thoại là bắt buộc')
    .matches(/^0\d{9}$/).withMessage('Số điện thoại phải có 10 số và bắt đầu bằng 0'),
  
  body('FullName')
    .notEmpty().withMessage('Họ tên là bắt buộc')
    .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự')
    .trim(),
  
  body('Password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('ID_GroupUser')
    .notEmpty().withMessage('Chức vụ là bắt buộc')
    .isMongoId().withMessage('ID chức vụ không hợp lệ'),
  
  body('ID_Branch')
    .notEmpty().withMessage('Chi nhánh là bắt buộc')
    .isMongoId().withMessage('ID chi nhánh không hợp lệ'),
  
  body('Email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('CMND')
    .optional()
    .matches(/^\d{9}$|^\d{12}$/).withMessage('CMND/CCCD phải có 9 hoặc 12 số'),
  
  body('Gender')
    .optional()
    .isIn(['Nam', 'Nữ']).withMessage('Giới tính phải là Nam hoặc Nữ'),
  
  body('Birthday')
    .optional()
    .isISO8601().withMessage('Ngày sinh không hợp lệ'),
  
  body('DateOnCompany')
    .optional()
    .isISO8601().withMessage('Ngày vào công ty không hợp lệ'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return sendError(res, errorMessages[0], 400);
    }
    next();
  }
];

/**
 * Validation rules cho update employee
 */
exports.validateUpdateEmployee = [
  param('id')
    .isMongoId().withMessage('ID nhân viên không hợp lệ'),
  
  body('Phone')
    .optional()
    .matches(/^0\d{9}$/).withMessage('Số điện thoại phải có 10 số và bắt đầu bằng 0'),
  
  body('FullName')
    .optional()
    .isLength({ min: 2 }).withMessage('Họ tên phải có ít nhất 2 ký tự')
    .trim(),
  
  body('Password')
    .optional()
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('ID_GroupUser')
    .optional()
    .isMongoId().withMessage('ID chức vụ không hợp lệ'),
  
  body('ID_Branch')
    .optional()
    .isMongoId().withMessage('ID chi nhánh không hợp lệ'),
  
  body('Email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('CMND')
    .optional()
    .matches(/^\d{9}$|^\d{12}$/).withMessage('CMND/CCCD phải có 9 hoặc 12 số'),
  
  body('Gender')
    .optional()
    .isIn(['Nam', 'Nữ']).withMessage('Giới tính phải là Nam hoặc Nữ'),
  
  body('Birthday')
    .optional()
    .isISO8601().withMessage('Ngày sinh không hợp lệ'),
  
  body('DateOnCompany')
    .optional()
    .isISO8601().withMessage('Ngày vào công ty không hợp lệ'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return sendError(res, errorMessages[0], 400);
    }
    next();
  }
];

/**
 * Validation rules cho update employee status
 */
exports.validateUpdateStatus = [
  param('id')
    .isMongoId().withMessage('ID nhân viên không hợp lệ'),
  
  body('status')
    .notEmpty().withMessage('Trạng thái là bắt buộc')
    .isIn(['Đang hoạt động', 'Đã dừng', 'Đã nghỉ việc'])
    .withMessage('Trạng thái không hợp lệ'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return sendError(res, errorMessages[0], 400);
    }
    next();
  }
];

/**
 * Validation rules cho get employee by ID
 */
exports.validateGetEmployeeById = [
  param('id')
    .isMongoId().withMessage('ID nhân viên không hợp lệ'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return sendError(res, errorMessages[0], 400);
    }
    next();
  }
];

/**
 * Validation rules cho get employees với query params
 */
exports.validateGetEmployees = [
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role phải là admin, manager hoặc employee'),
  
  query('branchId')
    .optional()
    .isMongoId().withMessage('ID chi nhánh không hợp lệ'),
  
  query('status')
    .optional()
    .isIn(['Đang hoạt động', 'Đã dừng', 'Đã nghỉ việc'])
    .withMessage('Status không hợp lệ'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
  
  query('search')
    .optional()
    .isLength({ min: 1 }).withMessage('Search term phải có ít nhất 1 ký tự'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return sendError(res, errorMessages[0], 400);
    }
    next();
  }
];

/**
 * Validation rules cho delete employee
 */
exports.validateDeleteEmployee = [
  param('id')
    .isMongoId().withMessage('ID nhân viên không hợp lệ'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      return sendError(res, errorMessages[0], 400);
    }
    next();
  }
];
