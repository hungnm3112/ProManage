/**
 * Admin Controller
 * Handles admin-only operations for task management
 * 
 * References:
 * - 01-BUSINESS-LOGIC.md § 2.9 (Delete UserTask)
 * - 01-BUSINESS-LOGIC.md § 3.x (Clone Broadcast)
 * - 03-API-REFERENCE.md § 10 (ADMIN)
 */

const UserTask = require('../models/UserTask');
const StoreTask = require('../models/StoreTask');
const Broadcast = require('../models/Broadcast');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const notificationService = require('../services/notificationService');

/**
 * @route   DELETE /api/admin/user-tasks/:id
 * @desc    Delete UserTask (Admin only, cannot delete completed tasks)
 * @access  Admin only
 * 
 * Business Logic: 01-BUSINESS-LOGIC.md § 2.9
 */
const deleteUserTask = async (req, res) => {
  try {
    const { id } = req.params; // userTaskId (NOT storeTaskId)
    
    console.log(`[Admin/deleteUserTask] Deleting UserTask ${id}`);
    
    // Find the UserTask
    const userTask = await UserTask.findById(id)
      .populate('broadcastId')
      .populate('employeeId');
    
    if (!userTask) {
      return sendError(res, 'Không tìm thấy UserTask', 404);
    }
    
    // Check if task is completed - cannot delete completed tasks (Business Rule)
    if (userTask.status === 'completed' || userTask.status === 'approved') {
      return sendError(res, 'Không thể xóa task đã hoàn thành', 400);
    }
    
    // Save references before deletion
    const employeeId = userTask.employeeId._id;
    const storeTaskId = userTask.storeTaskId;
    const broadcastTitle = userTask.broadcastId?.title || 'Task';
    
    // Remove from StoreTask.assignedEmployees
    if (storeTaskId) {
      const storeTask = await StoreTask.findById(storeTaskId);
      
      if (storeTask) {
        storeTask.assignedEmployees = storeTask.assignedEmployees.filter(
          empId => empId.toString() !== employeeId.toString()
        );
        
        // Since there is now only 1 UserTask per StoreTask, delete the StoreTask too
        await StoreTask.findByIdAndDelete(storeTask._id);
        console.log('[Admin/deleteUserTask] Deleted associated StoreTask');
      }
    }
    
    // Delete the UserTask
    await UserTask.findByIdAndDelete(id);
    console.log('[Admin/deleteUserTask] Deleted UserTask');
    
    // Create notification for employee (task cancelled)
    await notificationService.createNotification(
      employeeId,
      'task_cancelled',
      'Task đã bị hủy',
      `Task "${broadcastTitle}" đã bị admin hủy`,
      { userTaskId: id }
    );
    
    console.log('[Admin/deleteUserTask] Delete successful');
    
    return sendSuccess(res, 'UserTask đã được xóa');
    
  } catch (error) {
    console.error('[Admin/deleteUserTask] Error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/admin/broadcasts/:id/clone-data
 * @desc    Lấy metadata của Broadcast để nhân bản (Admin only)
 * @access  Admin only
 * 
 * Trả về: title, description, priority, deadline, checklist, attachments
 * KHÔNG trả về: assignedStores, recurring (admin tự cấu hình mới)
 */
const getCloneData = async (req, res) => {
  try {
    const { id } = req.params;

    const broadcast = await Broadcast.findById(id)
      .select('title description priority deadline checklist attachments');

    if (!broadcast) {
      return sendError(res, 'Không tìm thấy Broadcast', 404);
    }

    return sendSuccess(res, 'Lấy dữ liệu nhân bản thành công', {
      title: broadcast.title,
      description: broadcast.description,
      priority: broadcast.priority,
      deadline: broadcast.deadline,
      checklist: broadcast.checklist,
      attachments: broadcast.attachments
    });

  } catch (error) {
    console.error('[Admin/getCloneData] Error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  deleteUserTask,
  getCloneData
};
