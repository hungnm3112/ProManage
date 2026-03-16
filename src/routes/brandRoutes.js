/**
 * Brand Routes
 * API endpoints for Brand/Store management
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
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
  authorize(['admin', 'manager']),
  brandValidator.validateGetBrandEmployees,
  brandController.getBrandEmployees
);

/**
 * @route   PUT /api/brands/:id
 * @desc    Update brand information
 * @access  Private (admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  brandValidator.validateUpdateBrand,
  brandController.updateBrand
);

/**
 * @route   PATCH /api/brands/:id/manager
 * @desc    Assign manager to a brand
 * @access  Private (admin only)
 */
router.patch(
  '/:id/manager',
  authenticate,
  authorize(['admin']),
  brandValidator.validateAssignManager,
  brandController.assignManager
);

module.exports = router;
