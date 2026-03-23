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
 * @access  Private (employee, admin - Phase P)
 */
router.get(
  '/',
  authenticate,
  authorize('employee', 'admin'),
  userTaskValidator.validateGetMyTasks,
  userTaskController.getMyTasks
);

/**
 * @route   GET /api/my-tasks/:id
 * @desc    Get task details by ID
 * @access  Private (employee, admin - Phase P)
 */
router.get(
  '/:id',
  authenticate,
  authorize('employee', 'admin'),
  userTaskValidator.validateGetTaskById,
  userTaskController.getTaskById
);

/**
 * @route   PUT /api/my-tasks/:id/checklist
 * @desc    Update checklist items
 * @access  Private (employee, admin - Phase P)
 */
router.put(
  '/:id/checklist',
  authenticate,
  authorize('employee', 'admin'),
  userTaskValidator.validateUpdateChecklist,
  userTaskController.updateChecklist
);

/**
 * @route   POST /api/my-tasks/:id/evidence
 * @desc    Add evidence files to task
 * @access  Private (employee, admin - Phase P)
 */
router.post(
  '/:id/evidence',
  authenticate,
  authorize('employee', 'admin'),
  userTaskValidator.validateUploadEvidence,
  userTaskController.uploadEvidence
);

/**
 * @route   POST /api/my-tasks/:id/submit
 * @desc    Submit task for review
 * @access  Private (employee, admin - Phase P)
 */
router.post(
  '/:id/submit',
  authenticate,
  authorize('employee', 'admin'),
  userTaskValidator.validateSubmitTask,
  userTaskController.submitTask
);

/**
 * @route   POST /api/my-tasks/:id/confirm
 * @desc    Người phụ trách xác nhận nhận việc → status: assigned → in_progress
 * @access  Private (employee, admin - Phase P — chỉ người phụ trách)
 * @note    Không có route từ chối
 */
router.post(
  '/:id/confirm',
  authenticate,
  authorize('employee', 'admin'),
  userTaskController.confirmTask
);

/**
 * @route   PUT /api/my-tasks/:id/assign-item
 * @desc    Người phụ trách tag checklist item cho đồng nghiệp trong cùng StoreTask
 * @access  Private (employee, admin - Phase P — chỉ người phụ trách)
 * @body    { itemId, assignedToEmployeeId }
 */
router.put(
  '/:id/assign-item',
  authenticate,
  authorize('employee', 'admin'),
  userTaskController.assignChecklistItem
);

/**
 * @route   PUT /api/my-tasks/:id/review-item
 * @desc    Người phụ trách approve/reject checklist item của nhân viên được tag
 * @access  Private (employee, admin - Phase P — chỉ người phụ trách)
 * @body    { itemId, action: 'approve'|'reject', reviewNote }
 */
router.put(
  '/:id/review-item',
  authenticate,
  authorize('employee', 'admin'),
  userTaskController.reviewChecklistItem
);

/**
 * @route   POST /api/my-tasks/:id/submit-item
 * @desc    Worker nộp 1 checklist item để responsible review (per-item submit)
 * @access  Private (employee, admin - Phase P — chỉ worker được giao item)
 * @body    { itemId: String }
 */
router.post(
  '/:id/submit-item',
  authenticate,
  authorize('employee', 'admin'),
  userTaskController.submitChecklistItem
);

module.exports = router;
