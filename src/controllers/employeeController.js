/**
 * Employee Controller
 * 
 * Quản lý CRUD operations cho Employee
 */

const Employee = require('../models/Employee');
const { hashPassword, generateSalt } = require('../helpers/authHelper');
const { sendResponse, sendError } = require('../utils/responseHandler');

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filtering
 * @access  Private (Admin, Manager)
 * @query   role, branchId, status, search, page, limit
 */
exports.getEmployees = async (req, res, next) => {
  try {
    const {
      role,
      branchId,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      query.Status = status;
    }

    // Filter by branch (for managers - only see their branch)
    if (req.user.role === 'manager') {
      query.ID_Branch = req.user.branchId;
    } else if (branchId) {
      query.ID_Branch = branchId;
    }

    // Search by name or phone
    if (search) {
      query.$or = [
        { FullName: { $regex: search, $options: 'i' } },
        { Phone: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    let employees = await Employee.find(query)
      .populate('ID_GroupUser', 'Name Description')
      .populate('ID_Branch', 'Name Map_Address Phone')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    // Filter by role if specified (requires GroupUser lookup)
    if (role) {
      const { getEmployeeRole } = require('../helpers/authHelper');
      const filteredEmployees = [];
      
      for (const emp of employees) {
        const empRole = await getEmployeeRole(emp);
        if (empRole === role) {
          filteredEmployees.push(emp);
        }
      }
      employees = filteredEmployees;
    }

    // Get total count
    const total = await Employee.countDocuments(query);

    sendResponse(res, {
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
exports.getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('ID_GroupUser', 'Name Description Status')
      .populate('ID_Branch', 'Name Map_Address Phone Active');

    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên', 404);
    }

    // Check authorization (managers can only see their branch employees)
    if (req.user.role === 'manager') {
      if (employee.ID_Branch._id.toString() !== req.user.branchId.toString()) {
        return sendError(res, 'Không có quyền xem nhân viên này', 403);
      }
    }

    sendResponse(res, {
      success: true,
      data: employee
    });

  } catch (error) {
    next(error);
  }
};

/**
 * ⛔ READ-ONLY COLLECTION
 * 
 * Employee, Brand, GroupUser collections are synced from external HR system.
 * ProManage can ONLY READ data from these collections.
 * CREATE/UPDATE/DELETE operations are NOT allowed.
 * 
 * Removed operations (March 19, 2026):
 * - createEmployee (POST)
 * - updateEmployee (PUT)
 * - updateEmployeeStatus (PATCH)
 * - deleteEmployee (DELETE)
 * 
 * Reason: Data managed by external system
 */
