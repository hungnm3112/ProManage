/**
 * Authentication Helper Functions
 * 
 * Hệ thống sử dụng HMAC-SHA512 cho password hashing
 * (KHÔNG phải bcrypt hay SHA512 thông thường)
 */

const crypto = require('crypto');
const GroupUser = require('../models/GroupUser');

/**
 * Hash password với Salt sử dụng HMAC-SHA512
 * 
 * @param {string} password - Plain text password
 * @param {string} salt - Salt string (8 ký tự)
 * @returns {string} - Hashed password (HMAC-SHA512 hex)
 * 
 * @example
 * const hashed = hashPassword('123456', '18900519');
 * // Returns: '60e19e09aafe50653f66819304b8cb329f427a4f...'
 */
function hashPassword(password, salt) {
  // HMAC-SHA512 (not simple SHA512)
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  return hash.digest('hex');
}

/**
 * Verify password với employee's hashed password
 * 
 * @param {Object} employee - Employee document từ database
 * @param {string} password - Plain text password để verify
 * @returns {boolean} - true nếu password đúng
 * 
 * @example
 * const isValid = verifyPassword(employee, '123456');
 */
function verifyPassword(employee, password) {
  const hashed = hashPassword(password, employee.Salt);
  return hashed === employee.Password;
}

/**
 * Generate random salt (8 ký tự)
 * 
 * @returns {string} - Random salt string
 * 
 * @example
 * const salt = generateSalt();
 * // Returns: "18900519"
 */
function generateSalt() {
  return Math.random().toString().substring(2, 10);
}

/**
 * Get employee role từ GroupUser collection
 * 
 * Admin roles: Tổng giám đốc, Kho tổng, Phó tổng giám đốc, 
 *              Giám đốc khu vực, Phó giám đốc
 * Manager role: Giám đốc chi nhánh
 * Employee: Tất cả các chức vụ khác
 * 
 * @param {Object} employee - Employee document (cần có ID_GroupUser)
 * @returns {Promise<string>} - 'admin' | 'manager' | 'employee'
 * 
 * @example
 * const role = await getEmployeeRole(employee);
 * // Returns: 'admin'
 */
async function getEmployeeRole(employee) {
  try {
    // Check if ID_GroupUser already populated
    let groupUser;
    
    if (employee.ID_GroupUser && typeof employee.ID_GroupUser === 'object' && employee.ID_GroupUser.Name) {
      // Already populated
      groupUser = employee.ID_GroupUser;
    } else if (employee.ID_GroupUser) {
      // Not populated, need to query
      groupUser = await GroupUser.findById(employee.ID_GroupUser);
    }
    
    // Nếu không tìm thấy hoặc không active
    if (!groupUser || groupUser.Status !== '1') {
      return 'employee';  // Default role
    }
    
    const positionName = groupUser.Name;
    
    // Admin roles (5 chức vụ)
    const adminPositions = [
      'Tổng giám đốc',
      'Kho tổng',
      'Phó tổng giám đốc',
      'Giám đốc khu vực',
      'Phó giám đốc'
    ];
    
    if (adminPositions.includes(positionName)) {
      return 'admin';
    }
    
    // Manager role
    if (positionName === 'Giám đốc chi nhánh') {
      return 'manager';
    }
    
    // Default: employee
    return 'employee';
  } catch (error) {
    console.error('Error getting employee role:', error);
    return 'employee';  // Safe default
  }
}

/**
 * Check if employee is active (đang hoạt động)
 * 
 * @param {Object} employee - Employee document
 * @returns {boolean} - true nếu Status === 'Đang hoạt động'
 * 
 * @example
 * const isActive = isEmployeeActive(employee);
 */
function isEmployeeActive(employee) {
  return employee.Status === 'Đang hoạt động';
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateSalt,
  getEmployeeRole,
  isEmployeeActive
};
