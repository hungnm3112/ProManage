/**
 * Admin Controller
 * Handles admin-only operations for UserTask management
 * 
 * REFACTORED: March 20, 2026
 * Routes moved from /api/broadcasts/user-tasks to /api/admin/user-tasks
 * Reason: RESTful standards, clearer admin permissions, reduces ID confusion
 * 
 * References:
 * - 01-BUSINESS-LOGIC.md § 2.8 (Reassign UserTask)
 * - 01-BUSINESS-LOGIC.md § 2.9 (Delete UserTask)
 * - 03-API-REFERENCE.md § 10 (ADMIN)
 */

const UserTask = require('../models/UserTask');
const StoreTask = require('../models/StoreTask');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getEmployeeRole } = require('../helpers/authHelper');
const notificationService = require('../services/notificationService');

/**
 * @route   PUT /api/admin/user-tasks/:id
 * @desc    Reassign UserTask to different employee (Admin only)
 * @access  Admin only
 * 
 * Business Logic: 01-BUSINESS-LOGIC.md § 2.8
 * 
 * Process:
 * 1. Authorization: Verify req.user.role === 'admin' (middleware)
 * 2. Find UserTask by id (not storeTaskId - see Rule 2)
 * 3. Update UserTask.employeeId → new employee
 * 4. If cross-store reassign:
 *    - Find/Create StoreTask for new store
 *    - Update UserTask.storeTaskId
 *    - Remove from old StoreTask.assignedEmployees
 *    - Add to new StoreTask.assignedEmployees
 * 5. Create notification for new employee
 * 6. Create notification for old employee (task removed)
 */
const reassignUserTask = async (req, res) => {
  try {
    const { id } = req.params; // userTaskId (NOT storeTaskId)
    const { employeeId: newEmployeeId } = req.body;
    
    console.log(`[Admin/reassignUserTask] Reassigning UserTask ${id} to employee ${newEmployeeId}`);
    
    // Find the UserTask by id
    const userTask = await UserTask.findById(id)
      .populate('broadcastId')
      .populate('employeeId')
      .populate('storeTaskId');
    
    if (!userTask) {
      return sendError(res, 'Không tìm thấy UserTask', 404);
    }
    
    // Check if task is already completed
    if (userTask.status === 'completed' || userTask.status === 'approved') {
      return sendError(res, 'Không thể reassign task đã hoàn thành', 400);
    }
    
    // Find new employee
    const newEmployee = await Employee.findById(newEmployeeId)
      .populate('ID_Branch');
    
    if (!newEmployee) {
      return sendError(res, 'Không tìm thấy employee mới', 404);
    }
    
    // Validate new employee is active (Rule 6: String "1" not boolean)
    if (newEmployee.Trang_thai !== "1" && newEmployee.Status !== 'Đang hoạt động') {
      return sendError(res, 'Employee mới không active', 400);
    }
    
    // Check if new employee already has this task (prevent duplicates)
    const existingTask = await UserTask.findOne({
      broadcastId: userTask.broadcastId._id,
      employeeId: newEmployeeId
    });
    
    if (existingTask && existingTask._id.toString() !== id) {
      return sendError(res, `Nhân viên ${newEmployee.Ho_va_ten} đã có task này rồi`, 400);
    }
    
    // Save old employee reference BEFORE updating (Bug #3 fix)
    const oldEmployee = userTask.employeeId;
    const oldStoreTask = userTask.storeTaskId;
    
    // Update UserTask.employeeId
    userTask.employeeId = newEmployeeId;
    
    // Check if cross-store reassign (different branches)
    const oldBranchId = oldEmployee.ID_Branch?._id || oldEmployee.ID_Branch;
    const newBranchId = newEmployee.ID_Branch?._id || newEmployee.ID_Branch;
    
    if (oldBranchId.toString() !== newBranchId.toString()) {
      console.log('[Admin/reassignUserTask] Cross-store reassign detected');
      
      // Find or create StoreTask for new branch
      let newStoreTask = await StoreTask.findOne({
        broadcastId: userTask.broadcastId._id,
        storeId: newBranchId
      });
      
      if (!newStoreTask) {
        console.log('[Admin/reassignUserTask] Creating new StoreTask for branch', newBranchId);
        
        // Find manager for new branch
        const managers = await Employee.find({
          ID_Branch: newBranchId,
          $or: [
            { Status: 'Đang hoạt động' },
            { Trang_thai: "1" }
          ]
        }).populate('ID_nhom');
        
        let manager = null;
        for (const emp of managers) {
          const role = await getEmployeeRole(emp);
          if (role === 'manager') {
            manager = emp;
            break;
          }
        }
        
        if (!manager) manager = newEmployee; // Fallback to new employee
        
        // Create new StoreTask
        newStoreTask = new StoreTask({
          broadcastId: userTask.broadcastId._id,
          storeId: newBranchId,
          managerId: manager._id,
          status: 'pending',
          assignedEmployees: [newEmployeeId]
        });
        
        await newStoreTask.save();
        console.log('[Admin/reassignUserTask] Created StoreTask:', newStoreTask._id);
      } else {
        // Add employee to existing StoreTask if not already there
        if (!newStoreTask.assignedEmployees.includes(newEmployeeId)) {
          newStoreTask.assignedEmployees.push(newEmployeeId);
          await newStoreTask.save();
          console.log('[Admin/reassignUserTask] Added employee to existing StoreTask');
        }
      }
      
      // Update UserTask.storeTaskId
      userTask.storeTaskId = newStoreTask._id;
      
      // Remove from old StoreTask.assignedEmployees
      if (oldStoreTask) {
        const oldStoreTaskDoc = await StoreTask.findById(oldStoreTask._id);
        if (oldStoreTaskDoc) {
          oldStoreTaskDoc.assignedEmployees = oldStoreTaskDoc.assignedEmployees.filter(
            empId => empId.toString() !== oldEmployee._id.toString()
          );
          await oldStoreTaskDoc.save();
          console.log('[Admin/reassignUserTask] Removed from old StoreTask');
        }
      }
    }
    
    // Save updated UserTask
    await userTask.save();
    
    // Create notification for new employee
    await notificationService.createNotification({
      userId: newEmployeeId,
      type: 'task_assigned',
      title: 'Task mới được giao',
      message: `Bạn được giao task: ${userTask.broadcastId.title}`,
      data: {
        userTaskId: userTask._id,
        broadcastId: userTask.broadcastId._id,
        employeeId: newEmployeeId
      }
    });
    
    // Create notification for old employee (task removed)
    await notificationService.createNotification({
      userId: oldEmployee._id,
      type: 'task_reassigned',
      title: 'Task đã được chuyển',
      message: `Task "${userTask.broadcastId.title}" đã được chuyển cho nhân viên khác`,
      data: {
        userTaskId: userTask._id,
        broadcastId: userTask.broadcastId._id,
        oldEmployeeId: oldEmployee._id,
        newEmployeeId: newEmployeeId
      }
    });
    
    console.log('[Admin/reassignUserTask] Reassign successful');
    
    return sendSuccess(res, 'Reassign thành công', {
      userTask: {
        _id: userTask._id,
        employeeId: newEmployeeId,
        oldEmployeeId: oldEmployee._id,
        storeTaskId: userTask.storeTaskId,
        status: userTask.status
      }
    });
    
  } catch (error) {
    console.error('[Admin/reassignUserTask] Error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   DELETE /api/admin/user-tasks/:id
 * @desc    Delete UserTask (Admin only, cannot delete completed tasks)
 * @access  Admin only
 * 
 * Business Logic: 01-BUSINESS-LOGIC.md § 2.9
 * 
 * Process:
 * 1. Authorization: Verify req.user.role === 'admin' (middleware)
 * 2. Find UserTask by id
 * 3. Verify status !== 'completed'
 * 4. Delete UserTask document
 * 5. Remove from StoreTask.assignedEmployees array
 * 6. Update StoreTask completion rate
 * 7. Create notification for employee (task cancelled)
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
        
        // Recalculate completion rate
        const remainingTasks = await UserTask.countDocuments({
          storeTaskId: storeTask._id
        });
        
        if (remainingTasks <= 1) {
          // This is the last task, delete StoreTask too
          await StoreTask.findByIdAndDelete(storeTask._id);
          console.log('[Admin/deleteUserTask] Deleted empty StoreTask');
        } else {
          // Update completion rate
          const completedTasks = await UserTask.countDocuments({
            storeTaskId: storeTask._id,
            status: { $in: ['completed', 'approved'] }
          });
          
          storeTask.completionRate = Math.round((completedTasks / (remainingTasks - 1)) * 100);
          await storeTask.save();
          console.log('[Admin/deleteUserTask] Updated StoreTask completion rate');
        }
      }
    }
    
    // Delete the UserTask
    await UserTask.findByIdAndDelete(id);
    console.log('[Admin/deleteUserTask] Deleted UserTask');
    
    // Create notification for employee (task cancelled)
    await notificationService.createNotification({
      userId: employeeId,
      type: 'task_cancelled',
      title: 'Task đã bị hủy',
      message: `Task "${broadcastTitle}" đã bị admin hủy`,
      data: {
        userTaskId: id,
        reason: 'Deleted by admin'
      }
    });
    
    console.log('[Admin/deleteUserTask] Delete successful');
    
    return sendSuccess(res, 'UserTask đã được xóa');
    
  } catch (error) {
    console.error('[Admin/deleteUserTask] Error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  reassignUserTask,
  deleteUserTask
};
