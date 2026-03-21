/**
 * Employee Routes
 * 
 * ⛔ READ-ONLY: Employee collection synced from external HR system
 * Only GET operations allowed - no CREATE/UPDATE/DELETE
 */

const express = require('express');
const router = express.Router();

const {
  getEmployees,
  getEmployeeById
} = require('../controllers/employeeController');

const {
  validateGetEmployees,
  validateGetEmployeeById
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
  authorize('admin', 'manager', 'employee'),
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

module.exports = router;
