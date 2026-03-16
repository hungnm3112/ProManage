/**
 * Dashboard Routes
 * API endpoints for dashboard analytics
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard data
 * @access  Private (admin only)
 */
router.get(
  '/admin',
  authenticate,
  authorize(['admin']),
  dashboardController.getAdminDashboard
);

/**
 * @route   GET /api/dashboard/manager
 * @desc    Get manager dashboard data
 * @access  Private (manager only)
 */
router.get(
  '/manager',
  authenticate,
  authorize(['manager']),
  dashboardController.getManagerDashboard
);

/**
 * @route   GET /api/dashboard/employee
 * @desc    Get employee dashboard data
 * @access  Private (employee only)
 */
router.get(
  '/employee',
  authenticate,
  authorize(['employee']),
  dashboardController.getEmployeeDashboard
);

module.exports = router;
