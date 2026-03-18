/**
 * UserTask Routes
 * API endpoints for employee task execution
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const express = require('express');
const router = express.Router();

const userTaskController = require('../controllers/userTaskController');
const userTaskValidator = require('../validators/userTaskValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/my-tasks
 * @desc    Get all tasks assigned to current employee
 * @access  Private (employee)
 */
router.get(
  '/',
  authenticate,
  authorize('employee'),
  userTaskValidator.validateGetMyTasks,
  userTaskController.getMyTasks
);

/**
 * @route   GET /api/my-tasks/:id
 * @desc    Get task details by ID
 * @access  Private (employee)
 */
router.get(
  '/:id',
  authenticate,
  authorize('employee'),
  userTaskValidator.validateGetTaskById,
  userTaskController.getTaskById
);

/**
 * @route   PUT /api/my-tasks/:id/checklist
 * @desc    Update checklist items
 * @access  Private (employee)
 */
router.put(
  '/:id/checklist',
  authenticate,
  authorize('employee'),
  userTaskValidator.validateUpdateChecklist,
  userTaskController.updateChecklist
);

/**
 * @route   POST /api/my-tasks/:id/evidence
 * @desc    Add evidence files to task
 * @access  Private (employee)
 */
router.post(
  '/:id/evidence',
  authenticate,
  authorize('employee'),
  userTaskValidator.validateUploadEvidence,
  userTaskController.uploadEvidence
);

/**
 * @route   POST /api/my-tasks/:id/submit
 * @desc    Submit task for review
 * @access  Private (employee)
 */
router.post(
  '/:id/submit',
  authenticate,
  authorize('employee'),
  userTaskValidator.validateSubmitTask,
  userTaskController.submitTask
);

module.exports = router;
