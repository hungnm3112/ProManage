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
 * @route   GET /api/brands/:id/employees
 * @desc    Get all employees of a brand
 * @access  Private (admin, manager)
 * @note    Manager can only see their own branch employees
 */
router.get(
  '/:id/employees',
  authenticate,
  authorize('admin', 'manager'),
  brandValidator.validateGetBrandEmployees,
  brandController.getBrandEmployees
);

module.exports = router;
