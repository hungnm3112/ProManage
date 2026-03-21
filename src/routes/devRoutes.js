/**
 * Development Routes
 * Quick testing utilities (ONLY for development)
 * 
 * ⚠️ DISABLE IN PRODUCTION
 */

const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { generateToken } = require('../services/jwtService');
const { getEmployeeRole } = require('../helpers/authHelper');
const { sendResponse, sendError } = require('../utils/responseHandler');

/**
 * @route   GET /api/dev/accounts
 * @desc    Get list of all active employees for quick switching
 * @access  Public (dev only)
 */
router.get('/accounts', async (req, res, next) => {
  try {
    // ⚠️ Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 'Not available in production', 403);
    }

    const employees = await Employee.find({ Status: 'Đang hoạt động' })
      .populate('ID_GroupUser')
      .populate('ID_Branch')
      .select('Phone FullName ID_GroupUser ID_Branch Email Image')
      .sort({ FullName: 1 });

    // Get roles for each employee
    const accountsWithRoles = await Promise.all(
      employees.map(async (emp) => {
        const role = await getEmployeeRole(emp);
        return {
          _id: emp._id,
          phone: emp.Phone,
          fullName: emp.FullName,
          role: role,
          position: emp.ID_GroupUser?.Name || 'N/A',
          branch: emp.ID_Branch?.Name || 'N/A',
          branchId: emp.ID_Branch?._id,
          email: emp.Email,
          image: emp.Image
        };
      })
    );

    // Group by role
    const grouped = {
      admin: accountsWithRoles.filter(a => a.role === 'admin'),
      manager: accountsWithRoles.filter(a => a.role === 'manager'),
      employee: accountsWithRoles.filter(a => a.role === 'employee')
    };

    sendResponse(res, {
      success: true,
      accounts: grouped,
      total: accountsWithRoles.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/dev/quick-login
 * @desc    Quick login without password (dev only)
 * @access  Public (dev only)
 */
router.post('/quick-login', async (req, res, next) => {
  try {
    // ⚠️ Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 'Not available in production', 403);
    }

    const { employeeId } = req.body;

    if (!employeeId) {
      return sendError(res, 'Employee ID is required', 400);
    }

    // Get employee
    const employee = await Employee.findById(employeeId)
      .populate('ID_GroupUser')
      .populate('ID_Branch');

    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    if (employee.Status !== 'Đang hoạt động') {
      return sendError(res, 'Employee is not active', 403);
    }

    // Get role
    const role = await getEmployeeRole(employee);

    // Generate token
    const token = await generateToken(employee);

    // Prepare response
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
      employee: employeeData,
      message: `Quick login as ${employee.FullName} (${role})`
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
