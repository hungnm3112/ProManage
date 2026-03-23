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
  authorize('admin'),
  dashboardController.getAdminDashboard
);

/**
 * @route   GET /api/dashboard/admin/tasks/:status
 * @desc    Get admin tasks by status (completed, overdue, in-progress, pending-confirm)
 * @access  Private (admin only)
 */
router.get(
  '/admin/tasks/:status',
  authenticate,
  authorize('admin'),
  dashboardController.getAdminTasksByStatus
);

/**
 * @route   GET /api/dashboard/manager
 * @desc    Get manager dashboard data
 * @access  Private (manager only)
 */
router.get(
  '/manager',
  authenticate,
  authorize('manager'),
  dashboardController.getManagerDashboard
);

/**
 * @route   GET /api/dashboard/employee
 * @desc    Get employee dashboard data
 * @access  Private (employee, admin - Phase P: admin cần xem employee dashboard)
 */
router.get(
  '/employee',
  authenticate,
  authorize('employee', 'admin'),
  dashboardController.getEmployeeDashboard
);

module.exports = router;
