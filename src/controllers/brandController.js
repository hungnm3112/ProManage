/**
 * Brand Controller
 * Handles Brand/Store management endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const Brand = require('../models/Brand');
const Employee = require('../models/Employee');
const { getEmployeeRole } = require('../helpers/authHelper');
const { successResponse, errorResponse } = require('../helpers/responseHandler');

/**
 * @route   GET /api/brands
 * @desc    Get all brands with filtering
 * @access  Private (all authenticated users)
 * @query   {string} active - Filter by active status ('true'/'false')
 * @query   {string} search - Search in brand name
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 */
const getBrands = async (req, res) => {
  try {
    const { active, search, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = {};
    
    // Filter by active status
    if (active !== undefined) {
      filter.Active = active;
    }
    
    // Search in name
    if (search) {
      filter.Name = { $regex: search, $options: 'i' };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Count total documents
    const total = await Brand.countDocuments(filter);
    
    // Fetch brands with virtual population of manager
    const brands = await Brand.find(filter)
      .populate({
        path: 'manager',
        select: 'FullName Phone ID_GroupUser',
        populate: {
          path: 'ID_GroupUser',
          select: 'GroupName'
        }
      })
      .select('-__v')
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return successResponse(res, {
      brands,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, 'Brands fetched successfully');
  } catch (error) {
    console.error('getBrands error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @route   GET /api/brands/:id
 * @desc    Get brand by ID
 * @access  Private (all authenticated users)
 */
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findById(id)
      .populate({
        path: 'manager',
        select: 'FullName Phone Email ID_GroupUser',
        populate: {
          path: 'ID_GroupUser',
          select: 'GroupName'
        }
      })
      .select('-__v')
      .lean();
    
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }
    
    return successResponse(res, { brand }, 'Brand fetched successfully');
  } catch (error) {
    console.error('getBrandById error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @route   GET /api/brands/:id/employees
 * @desc    Get all employees of a brand
 * @access  Private (admin, manager)
 * @note    Manager can only see their own branch employees
 */
const getBrandEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    // Check if brand exists
    const brand = await Brand.findById(id);
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }
    
    // Manager can only see their own branch employees
    if (currentUserRole === 'manager' && currentUser.ID_Branch.toString() !== id) {
      return errorResponse(res, 'You can only view employees of your own branch', 403);
    }
    
    // Get all active employees of this branch
    const employees = await Employee.find({
      ID_Branch: id,
      Status: 'Đang hoạt động'
    })
      .populate('ID_GroupUser', 'GroupName')
      .populate('ID_Branch', 'Name')
      .select('-Password -Salt -__v')
      .lean();
    
    return successResponse(res, {
      brand: {
        _id: brand._id,
        Name: brand.Name
      },
      employees,
      total: employees.length
    }, 'Brand employees fetched successfully');
  } catch (error) {
    console.error('getBrandEmployees error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/brands/:id
 * @desc    Update brand information
 * @access  Private (admin only)
 */
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedUpdates = [
      'Name',
      'Map_Address',
      'Phone',
      'Image',
      'WifiAddress',
      'Icon',
      'HeaderContent',
      'CheckIn',
      'CheckOut',
      'LateIn',
      'OutOvertime',
      'Active',
      'Phone_Customer_Support',
      'Phone_Feedback',
      'Link_Description',
      'Active_Schedule',
      'PercentPayment'
    ];
    
    // Filter out fields not in allowedUpdates
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 'No valid update fields provided', 400);
    }
    
    // Update brand
    const brand = await Brand.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-__v')
      .lean();
    
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }
    
    return successResponse(res, { brand }, 'Brand updated successfully');
  } catch (error) {
    console.error('updateBrand error:', error);
    
    if (error.name === 'ValidationError') {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * @route   PATCH /api/brands/:id/manager
 * @desc    Assign manager to a brand
 * @access  Private (admin only)
 * @body    {string} employeeId - ID of employee to assign as manager
 */
const assignManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    
    // Validate employeeId
    if (!employeeId) {
      return errorResponse(res, 'Employee ID is required', 400);
    }
    
    // Check if brand exists
    const brand = await Brand.findById(id);
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }
    
    // Check if employee exists
    const employee = await Employee.findById(employeeId).populate('ID_GroupUser');
    if (!employee) {
      return errorResponse(res, 'Employee not found', 404);
    }
    
    // Check if employee is active
    if (employee.Status !== 'Đang hoạt động') {
      return errorResponse(res, 'Employee must be active to be assigned as manager', 400);
    }
    
    // Check if employee has manager role
    const employeeRole = await getEmployeeRole(employee);
    if (employeeRole !== 'manager') {
      return errorResponse(res, 'Employee must have manager role to be assigned as manager', 400);
    }
    
    // Check if this employee is already a manager of another branch
    if (employee.ID_Branch && employee.ID_Branch.toString() !== id) {
      // Find if there's another manager at the previous branch
      const previousBranchManagers = await Employee.find({
        ID_Branch: employee.ID_Branch,
        Status: 'Đang hoạt động',
        _id: { $ne: employeeId }
      });
      
      let hasOtherManager = false;
      for (const emp of previousBranchManagers) {
        const role = await getEmployeeRole(emp);
        if (role === 'manager') {
          hasOtherManager = true;
          break;
        }
      }
      
      if (!hasOtherManager) {
        return errorResponse(
          res,
          'Cannot reassign this manager. Their current branch has no other managers.',
          400
        );
      }
    }
    
    // Update employee's branch
    employee.ID_Branch = id;
    await employee.save();
    
    // Populate the updated employee
    const updatedEmployee = await Employee.findById(employeeId)
      .populate('ID_GroupUser', 'GroupName')
      .populate('ID_Branch', 'Name')
      .select('-Password -Salt -__v')
      .lean();
    
    return successResponse(res, {
      brand: {
        _id: brand._id,
        Name: brand.Name
      },
      manager: updatedEmployee
    }, 'Manager assigned successfully');
  } catch (error) {
    console.error('assignManager error:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getBrands,
  getBrandById,
  getBrandEmployees,
  updateBrand,
  assignManager
};
