/**
 * Employee Routes
 * 
 * API endpoints cho Employee management
 */

const express = require('express');
const router = express.Router();

const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee
} = require('../controllers/employeeController');

const {
  validateGetEmployees,
  validateGetEmployeeById,
  validateCreateEmployee,
  validateUpdateEmployee,
  validateUpdateStatus,
  validateDeleteEmployee
} = require('../validators/employeeValidator');

const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filtering
 * @access  Private (Admin, Manager)
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validateGetEmployees,
  getEmployees
);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  validateGetEmployeeById,
  getEmployeeById
);

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateCreateEmployee,
  createEmployee
);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateUpdateEmployee,
  updateEmployee
);

/**
 * @route   PATCH /api/employees/:id/status
 * @desc    Update employee status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validateUpdateStatus,
  updateEmployeeStatus
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Soft delete employee (set status to 'Đã nghỉ việc')
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateDeleteEmployee,
  deleteEmployee
);

module.exports = router;
