/**
 * Admin Routes
 * Admin-only operations for system management
 * 
 * REFACTORED: March 20, 2026
 * New RESTful routes for admin UserTask operations
 * 
 * Base path: /api/admin
 * 
 * References:
 * - 03-API-REFERENCE.md § 10 (ADMIN)
 * - 01-BUSINESS-LOGIC.md § 2.8, 2.9
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  reassignUserTask,
  deleteUserTask
} = require('../controllers/adminController');

/**
 * @route   PUT /api/admin/user-tasks/:id
 * @desc    Reassign UserTask to different employee
 * @access  Admin only
 * 
 * Authorization: authenticate + authorize('admin')
 * 
 * Request body:
 * {
 *   "employeeId": "65f1234567890abcdef12349"
 * }
 * 
 * Validation:
 * - id must be valid UserTask ObjectId (NOT storeTaskId)
 * - employeeId must be valid Employee ObjectId
 * - UserTask must not be completed
 * - Employee must be active
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Reassign thành công",
 *   "data": {
 *     "userTask": {
 *       "_id": "...",
 *       "employeeId": "...",
 *       "oldEmployeeId": "...",
 *       ...
 *     }
 *   }
 * }
 * 
 * Response 400: Task completed, Employee not active
 * Response 403: Not admin
 * Response 404: UserTask or Employee not found
 */
router.put('/user-tasks/:id', authenticate, authorize('admin'), reassignUserTask);

/**
 * @route   DELETE /api/admin/user-tasks/:id
 * @desc    Delete UserTask (cannot delete completed tasks)
 * @access  Admin only
 * 
 * Authorization: authenticate + authorize('admin')
 * 
 * Validation:
 * - id must be valid UserTask ObjectId (NOT storeTaskId)
 * - UserTask must not be completed
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "UserTask đã được xóa"
 * }
 * 
 * Response 400: Task completed
 * Response 403: Not admin
 * Response 404: UserTask not found
 */
router.delete('/user-tasks/:id', authenticate, authorize('admin'), deleteUserTask);

module.exports = router;
