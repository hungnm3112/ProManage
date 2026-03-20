/**
 * Brand Routes
 * API endpoints for Brand/Store management
 * 
 * ⛔ READ-ONLY: Brand (Branch) collection synced from external system
 * Only GET operations allowed - no CREATE/UPDATE/DELETE
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 * Updated: March 19, 2026 - Removed write operations
 */

const express = require('express');
const router = express.Router();

const brandController = require('../controllers/brandController');
const brandValidator = require('../validators/brandValidator');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/brands
 * @desc    Get all brands with filtering
 * @access  Private (all authenticated users)
 */
router.get(
  '/',
  authenticate,
  brandValidator.validateGetBrands,
  brandController.getBrands
);

/**
 * @route   GET /api/brands/:id
 * @desc    Get brand by ID
 * @access  Private (all authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  brandValidator.validateGetBrandById,
  brandController.getBrandById
);

/**
 * @deprecated Since March 20, 2026
 * @route   GET /api/brands/:id/employees
 * @desc    Get all employees of a brand
 * @access  Private (admin, manager)
 * @note    Manager can only see their own branch employees
 * 
 * ⚠️  DEPRECATED: Use GET /api/employees?branchId={id} instead
 * 
 * This endpoint returns 410 Gone with migration instructions.
 * 
 * Migration guide:
 * - OLD: GET /api/brands/:id/employees
 * - NEW: GET /api/employees?branchId={id}
 * 
 * Reason: RESTful standards - Employee is the primary resource
 */
router.get(
  '/:id/employees',
  authenticate,
  authorize('admin', 'manager'),
  brandValidator.validateGetBrandEmployees,
  brandController.getBrandEmployees
);

module.exports = router;
