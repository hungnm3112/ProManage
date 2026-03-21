/**
 * Admin Routes
 * Admin-only operations for system management
 * 
 * Base path: /api/admin
 * 
 * References:
 * - 03-API-REFERENCE.md § 10 (ADMIN)
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  deleteUserTask,
  getCloneData
} = require('../controllers/adminController');

/**
 * @route   DELETE /api/admin/user-tasks/:id
 * @desc    Delete UserTask (cannot delete completed tasks)
 * @access  Admin only
 */
router.delete('/user-tasks/:id', authenticate, authorize('admin'), deleteUserTask);

/**
 * @route   GET /api/admin/broadcasts/:id/clone-data
 * @desc    Lấy metadata Broadcast để nhân bản (pre-fill form tạo mới)
 * @access  Admin only
 */
router.get('/broadcasts/:id/clone-data', authenticate, authorize('admin'), getCloneData);

module.exports = router;