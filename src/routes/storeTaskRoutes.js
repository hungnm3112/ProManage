/**
 * StoreTask Routes
 * API endpoints for StoreTask management
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const express = require('express');
const router = express.Router();

const storeTaskController = require('../controllers/storeTaskController');
const storeTaskValidator = require('../validators/storeTaskValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/store-tasks
 * @desc    Get all store tasks with filtering
 * @access  Private (admin, manager)
 * @note    Manager can only see their own store's tasks
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  storeTaskValidator.validateGetStoreTasks,
  storeTaskController.getStoreTasks
);

/**
 * @route   GET /api/store-tasks/:id
 * @desc    Get store task by ID
 * @access  Private (admin, manager)
 * @note    Manager can only see their own store's tasks
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  storeTaskValidator.validateGetStoreTaskById,
  storeTaskController.getStoreTaskById
);

/**
 * @route   POST /api/store-tasks/:id/assign
 * @desc    Assign employees to a store task (Admin only)
 * @access  Private (admin only)
 * @body    { employeeIds: [...] } — employee[0] sẽ là người phụ trách
 * @note    Tạo 1 UserTask cho người phụ trách (employee[0])
 *          StoreTask.status chuyển sang in_progress ngay lập tức
 */
router.post(
  '/:id/assign',
  authenticate,
  authorize('admin'),
  storeTaskValidator.validateAssignEmployees,
  storeTaskController.assignEmployees
);

/**
 * @route   GET /api/store-tasks/:id/messages
 * @desc    Lấy tin nhắn của task
 * @access  Private (admin, manager, employee)
 */
router.get(
  '/:id/messages',
  authenticate,
  authorize('admin', 'manager', 'employee'),
  storeTaskController.getTaskMessages
);

/**
 * @route   POST /api/store-tasks/:id/messages
 * @desc    Gửi tin nhắn trong task
 * @access  Private (admin, manager, employee)
 */
router.post(
  '/:id/messages',
  authenticate,
  authorize('admin', 'manager', 'employee'),
  storeTaskController.addTaskMessage
);

module.exports = router;
