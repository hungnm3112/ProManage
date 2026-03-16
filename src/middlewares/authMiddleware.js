/**
 * Authentication & Authorization Middleware
 * 
 * - authenticate: Verify JWT token
 * - authorize: Check user role
 */

const Employee = require('../models/Employee');
const { verifyToken } = require('../services/jwtService');
const { sendError } = require('../utils/responseHandler');

/**
 * Authenticate middleware - Verify JWT token
 * 
 * Kiểm tra token từ:
 * 1. Authorization header: Bearer <token>
 * 2. Cookie: token
 * 
 * Nếu valid, gán req.user = decoded payload
 */
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return sendError(res, 'Vui lòng đăng nhập để truy cập', 401);
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      // Gán user info vào req
      req.user = decoded;

      // Optional: Verify employee vẫn còn active trong DB
      const employee = await Employee.findById(decoded.userId);

      if (!employee) {
        return sendError(res, 'Tài khoản không tồn tại', 404);
      }

      if (employee.Status !== 'Đang hoạt động') {
        return sendError(res, 'Tài khoản đã ngừng hoạt động', 403);
      }

      next();
    } catch (err) {
      return sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize middleware - Check user role
 * 
 * @param {...string} roles - Allowed roles (admin, manager, employee)
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/admin-only', authenticate, authorize('admin'), controller);
 * router.get('/admin-manager', authenticate, authorize('admin', 'manager'), controller);
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Vui lòng đăng nhập để truy cập', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Vai trò '${req.user.role}' không có quyền truy cập`,
        403
      );
    }

    next();
  };
};

// Alias cho backward compatibility
exports.protect = exports.authenticate;
