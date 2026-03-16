/**
 * JWT Token Service
 * 
 * Sử dụng ACCESS_TOKEN_SECRET=suachualaptop24h (giống dự án gốc)
 */

const jwt = require('jsonwebtoken');
const { getEmployeeRole } = require('../helpers/authHelper');

/**
 * Generate JWT access token cho employee
 * 
 * @param {Object} employee - Employee document
 * @returns {Promise<string>} - JWT token
 */
async function generateToken(employee) {
  // Get role from GroupUser lookup
  const role = await getEmployeeRole(employee);
  
  const payload = {
    userId: employee._id,
    phone: employee.Phone,
    fullName: employee.FullName,
    role: role,
    branchId: employee.ID_Branch,
    groupUserId: employee.ID_GroupUser
  };
  
  const token = jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  return token;
}

/**
 * Verify JWT token
 * 
 * @param {string} token - JWT token string
 * @returns {Object} - Decoded payload
 * @throws {Error} - Invalid or expired token
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Refresh token (tạo token mới từ token cũ)
 * 
 * @param {string} token - JWT token cũ
 * @returns {Promise<string>} - JWT token mới
 */
async function refreshToken(oldToken) {
  try {
    // Decode without verification (để lấy userId ngay cả khi expired)
    const decoded = jwt.decode(oldToken);
    
    if (!decoded || !decoded.userId) {
      throw new Error('Invalid token format');
    }
    
    // Get employee mới nhất từ DB
    const Employee = require('../models/Employee');
    const employee = await Employee.findById(decoded.userId);
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // Generate token mới
    return await generateToken(employee);
  } catch (error) {
    throw new Error('Cannot refresh token: ' + error.message);
  }
}

/**
 * Decode token without verification (for debugging)
 * 
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  refreshToken,
  decodeToken
};
