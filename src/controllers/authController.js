/**
 * Authentication Controller
 * 
 * Handles login, logout, and user authentication
 */

const Employee = require('../models/Employee');
const GroupUser = require('../models/GroupUser');
const Brand = require('../models/Brand');
const { verifyPassword, getEmployeeRole, isEmployeeActive } = require('../helpers/authHelper');
const { generateToken } = require('../services/jwtService');
const { sendResponse, sendError } = require('../utils/responseHandler');

/**
 * @route   POST /api/auth/login
 * @desc    Login với Phone + Password
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return sendError(res, 'Vui lòng nhập số điện thoại và mật khẩu', 400);
    }

    // Find employee by phone (include Password và Salt)
    const employee = await Employee.findOne({ Phone: phone })
      .select('+Password +Salt')
      .populate('ID_GroupUser')
      .populate('ID_Branch');

    if (!employee) {
      return sendError(res, 'Số điện thoại hoặc mật khẩu không đúng', 401);
    }

    // Check if employee is active
    if (!isEmployeeActive(employee)) {
      return sendError(res, 'Tài khoản đã ngừng hoạt động', 403);
    }

    // Verify password (SHA-512 + Salt)
    const isPasswordValid = verifyPassword(employee, password);

    if (!isPasswordValid) {
      return sendError(res, 'Số điện thoại hoặc mật khẩu không đúng', 401);
    }

    // Get role from GroupUser
    const role = await getEmployeeRole(employee);

    // Generate JWT token
    const token = await generateToken(employee);

    // Prepare response data (remove sensitive fields)
    const employeeData = {
      _id: employee._id,
      phone: employee.Phone,
      fullName: employee.FullName,
      email: employee.Email,
      role: role,
      branchId: employee.ID_Branch?._id,
      branchName: employee.ID_Branch?.Name,
      groupUser: employee.ID_GroupUser?.Name,
      image: employee.Image,
      status: employee.Status
    };

    sendResponse(res, {
      success: true,
      token: token,
      employee: employeeData
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client-side token removal)
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // JWT là stateless, logout chỉ cần client xóa token
    sendResponse(res, {
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.user được set bởi authenticate middleware
    const employee = await Employee.findById(req.user.userId)
      .populate('ID_GroupUser')
      .populate('ID_Branch');

    if (!employee) {
      return sendError(res, 'Không tìm thấy thông tin người dùng', 404);
    }

    const role = await getEmployeeRole(employee);

    const employeeData = {
      _id: employee._id,
      phone: employee.Phone,
      fullName: employee.FullName,
      email: employee.Email,
      role: role,
      branchId: employee.ID_Branch?._id,
      branchName: employee.ID_Branch?.Name,
      groupUser: employee.ID_GroupUser?.Name,
      image: employee.Image,
      status: employee.Status
    };

    sendResponse(res, {
      success: true,
      employee: employeeData
    });

  } catch (error) {
    next(error);
  }
};
