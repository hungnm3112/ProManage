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
const { sendSuccess, sendError } = require('../utils/responseHandler');

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
    
    return sendSuccess(res, 'Brands fetched successfully', {
      brands,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('getBrands error:', error);
    return sendError(res, error.message, 500);
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
      return sendError(res, 'Brand not found', 404);
    }
    
    return sendSuccess(res, 'Brand fetched successfully', { brand });
  } catch (error) {
    console.error('getBrandById error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/brands/:id/employees
 * @desc    Get all employees of a brand
 * @access  Private (admin, manager)
/**
 * @deprecated Since March 20, 2026
 * @route   GET /api/brands/:id/employees
 * @desc    Get all employees of a brand
 * @access  Private (admin, manager)
 * @note    Manager can only see their own branch employees
 * 
 * ⚠️  DEPRECATED: This endpoint is no longer recommended
 * 
 * Migration guide:
 * - OLD: GET /api/brands/:id/employees
 * - NEW: GET /api/employees?branchId={id}
 * 
 * Reason: RESTful standards - Employee is the primary resource, branch is just a filter
 * 
 * This endpoint returns 410 Gone to inform clients about the migration.
 */
const getBrandEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    
    // DEPRECATION: Return 410 Gone with migration instructions
    console.warn(`⚠️  DEPRECATED: GET /api/brands/${id}/employees called. Use GET /api/employees?branchId=${id} instead.`);
    
    return res.status(410).json({
      success: false,
      message: 'Endpoint deprecated',
      deprecationNotice: {
        deprecated: true,
        since: '2026-03-20',
        reason: 'RESTful standards - Employee is the primary resource, branch is just a filter',
        oldEndpoint: `/api/brands/${id}/employees`,
        newEndpoint: `/api/employees?branchId=${id}`,
        documentation: '01-BUSINESS-LOGIC.md § 7.2 | 03-API-REFERENCE.md'
      }
    });
    
    /* ORIGINAL CODE (kept for reference, remove in future versions):
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    // Check if brand exists
    const brand = await Brand.findById(id);
    if (!brand) {
      return errorResponse(res, 'Brand not found', 404);
    }
    
    // Manager can only see their own branch employees
    if (currentUserRole === 'manager' && currentUser.ID_Branch.toString() !== id) {
      return sendError(res, 'You can only view employees of your own branch', 403);
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
    
    return sendSuccess(res, 'Brand employees fetched successfully', {
      brand: {
        _id: brand._id,
        Name: brand.Name
      },
      employees,
      total: employees.length
    });
    */
  } catch (error) {
    console.error('getBrandEmployees error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * ⛔ READ-ONLY COLLECTION
 * 
 * Brand (Branch) collection is synced from external system.
 * ProManage can ONLY READ data.
 * CREATE/UPDATE/DELETE operations are NOT allowed.
 * 
 * Removed operations (March 19, 2026):
 * - updateBrand (PUT)
 * - assignManager (PATCH)
 * 
 * Reason: Data managed by external system
 */

module.exports = {
  getBrands,
  getBrandById,
  getBrandEmployees
};
