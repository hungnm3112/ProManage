/**
 * Broadcast Routes
 * API endpoints for Broadcast management
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const express = require('express');
const router = express.Router();

const broadcastController = require('../controllers/broadcastController');
const broadcastValidator = require('../validators/broadcastValidator');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/broadcasts
 * @desc    Create a new broadcast (draft status)
 * @access  Private (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  broadcastValidator.validateCreateBroadcast,
  broadcastController.createBroadcast
);

/**
 * @route   GET /api/broadcasts
 * @desc    Get all broadcasts with filtering
 * @access  Private (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  broadcastValidator.validateGetBroadcasts,
  broadcastController.getBroadcasts
);

/**
 * @route   GET /api/broadcasts/:id
 * @desc    Get broadcast by ID with store tasks
 * @access  Private (admin only)
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin']),
  broadcastValidator.validateGetBroadcastById,
  broadcastController.getBroadcastById
);

/**
 * @route   PUT /api/broadcasts/:id
 * @desc    Update broadcast (only draft status)
 * @access  Private (admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  broadcastValidator.validateUpdateBroadcast,
  broadcastController.updateBroadcast
);

/**
 * @route   DELETE /api/broadcasts/:id
 * @desc    Delete broadcast (only draft status)
 * @access  Private (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  broadcastValidator.validateDeleteBroadcast,
  broadcastController.deleteBroadcast
);

/**
 * @route   POST /api/broadcasts/:id/publish
 * @desc    Publish broadcast and create store tasks
 * @access  Private (admin only)
 */
router.post(
  '/:id/publish',
  authenticate,
  authorize(['admin']),
  broadcastValidator.validatePublishBroadcast,
  broadcastController.publishBroadcast
);

module.exports = router;
