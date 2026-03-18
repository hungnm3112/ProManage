/**
 * Review Routes
 * API endpoints for manager review and approval
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const reviewValidator = require('../validators/reviewValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/reviews/pending
 * @desc    Get all pending reviews (submitted user tasks)
 * @access  Private (manager)
 */
router.get(
  '/pending',
  authenticate,
  authorize('manager'),
  reviewValidator.validateGetPendingReviews,
  reviewController.getPendingReviews
);

/**
 * @route   POST /api/reviews/:taskId/approve
 * @desc    Approve an employee task
 * @access  Private (manager)
 */
router.post(
  '/:taskId/approve',
  authenticate,
  authorize('manager'),
  reviewValidator.validateApproveTask,
  reviewController.approveTask
);

/**
 * @route   POST /api/reviews/:taskId/reject
 * @desc    Reject an employee task
 * @access  Private (manager)
 */
router.post(
  '/:taskId/reject',
  authenticate,
  authorize('manager'),
  reviewValidator.validateRejectTask,
  reviewController.rejectTask
);

module.exports = router;
