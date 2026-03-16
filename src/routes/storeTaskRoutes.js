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
  authorize(['admin', 'manager']),
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
  authorize(['admin', 'manager']),
  storeTaskValidator.validateGetStoreTaskById,
  storeTaskController.getStoreTaskById
);

/**
 * @route   PUT /api/store-tasks/:id/accept
 * @desc    Accept a store task
 * @access  Private (manager only)
 * @note    Only manager of the store can accept
 */
router.put(
  '/:id/accept',
  authenticate,
  authorize(['manager']),
  storeTaskValidator.validateAcceptStoreTask,
  storeTaskController.acceptStoreTask
);

/**
 * @route   PUT /api/store-tasks/:id/reject
 * @desc    Reject a store task
 * @access  Private (manager only)
 * @note    Only manager of the store can reject
 */
router.put(
  '/:id/reject',
  authenticate,
  authorize(['manager']),
  storeTaskValidator.validateRejectStoreTask,
  storeTaskController.rejectStoreTask
);

/**
 * @route   POST /api/store-tasks/:id/assign
 * @desc    Assign employees to a store task
 * @access  Private (manager only)
 * @note    Creates UserTask for each employee
 */
router.post(
  '/:id/assign',
  authenticate,
  authorize(['manager']),
  storeTaskValidator.validateAssignEmployees,
  storeTaskController.assignEmployees
);

module.exports = router;
