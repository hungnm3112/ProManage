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
 * @desc    Update UserTask (edit broadcast fields) and/or reassign to different employee (Admin only)
 * @access  Admin only
 * 
 * Business Logic: 01-BUSINESS-LOGIC.md § 2.8
 * 
 * SUPPORTS:
 * - Edit broadcast fields (title, description, priority, deadline, checklist, recurring)
 * - Reassign to different employee (optional)
 * - Both edit + reassign in one request
 * 
 * Process:
 * 1. Authorization: Verify req.user.role === 'admin' (middleware)
 * 2. Find UserTask by id (not storeTaskId - see Rule 2)
 * 3. If broadcast fields provided → Update Broadcast document
 * 4. If broadcast checklist changed → Update UserTask.checklist (reset isCompleted)
 * 5. If employeeId provided AND different → Reassign to new employee
 *    - Update UserTask.employeeId → new employee
 *    - If cross-store reassign:
 *      - Find/Create StoreTask for new store
 *      - Update UserTask.storeTaskId
 *      - Remove from old StoreTask.assignedEmployees
 *      - Add to new StoreTask.assignedEmployees
 *    - Create notifications for both employees
 * 6. Save and return updated UserTask
 */
const reassignUserTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      employeeId: newEmployeeId,
      title,
      description,
      priority,
      deadline,
      checklist,
      recurring
    } = req.body;
    
    console.log(`[Admin/updateUserTask] Updating UserTask ${id}:`, { 
      hasEmployeeId: !!newEmployeeId, 
      hasTitle: !!title,
      hasChecklist: !!checklist,
      hasDeadline: !!deadline
    });
    
    const userTask = await UserTask.findById(id)
      .populate('broadcastId')
      .populate('employeeId')
      .populate('storeTaskId');
    
    if (!userTask) {
      return sendError(res, 'Không tìm thấy UserTask', 404);
    }
    
    if (userTask.status === 'completed' || userTask.status === 'approved') {
      return sendError(res, 'Không thể cập nhật task đã hoàn thành', 400);
    }
    
    let updatedBroadcast = false;
    let reassigned = false;
    
    // PART 1: UPDATE BROADCAST FIELDS
    if (title || description || priority || deadline || checklist || recurring) {
      const Broadcast = require('../models/Broadcast');
      const broadcast = await Broadcast.findById(userTask.broadcastId._id);
      
      if (!broadcast) {
        return sendError(res, 'Không tìm thấy Broadcast', 404);
      }
      
      if (title) broadcast.title = title;
      if (description) broadcast.description = description;
      if (priority) broadcast.priority = priority;
      if (deadline) broadcast.deadline = new Date(deadline);
      if (checklist && Array.isArray(checklist)) broadcast.checklist = checklist;
      if (recurring) broadcast.recurring = recurring;
      
      await broadcast.save();
      console.log('[Admin/updateUserTask] Broadcast updated:', broadcast._id);
      updatedBroadcast = true;
      
      if (checklist && Array.isArray(checklist)) {
        userTask.checklist = checklist.map(item => ({
          task: typeof item === 'string' ? item : item.task,
          required: typeof item === 'object' ? item.required : true,
          isCompleted: false,
          completedAt: null
        }));
        console.log('[Admin/updateUserTask] UserTask checklist updated');
      }
    }
    
    // PART 2: REASSIGN TO NEW EMPLOYEE (OPTIONAL)
    if (newEmployeeId && newEmployeeId !== userTask.employeeId._id.toString()) {
      console.log(`[Admin/updateUserTask] Reassigning to employee ${newEmployeeId}`);
      
      const newEmployee = await Employee.findById(newEmployeeId).populate('ID_Branch');
      
      if (!newEmployee) {
        return sendError(res, 'Không tìm thấy employee mới', 404);
      }
      
      if (newEmployee.Trang_thai !== "1" && newEmployee.Status !== 'Đang hoạt động') {
        return sendError(res, 'Employee mới không active', 400);
      }
      
      const existingTask = await UserTask.findOne({
        broadcastId: userTask.broadcastId._id,
        employeeId: newEmployeeId
      });
      
      if (existingTask && existingTask._id.toString() !== id) {
        return sendError(res, `Nhân viên ${newEmployee.Ho_va_ten || newEmployee.FullName} đã có task này rồi`, 400);
      }
      
      const oldEmployee = userTask.employeeId;
      const oldStoreTask = userTask.storeTaskId;
      
      userTask.employeeId = newEmployeeId;
      
      const oldBranchId = oldEmployee.ID_Branch?._id || oldEmployee.ID_Branch;
      const newBranchId = newEmployee.ID_Branch?._id || newEmployee.ID_Branch;
      
      if (oldBranchId.toString() !== newBranchId.toString()) {
        console.log('[Admin/updateUserTask] Cross-store reassign detected');
        
        let newStoreTask = await StoreTask.findOne({
          broadcastId: userTask.broadcastId._id,
          storeId: newBranchId
        });
        
        if (!newStoreTask) {
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
          
          if (!manager) manager = newEmployee;
          
          newStoreTask = new StoreTask({
            broadcastId: userTask.broadcastId._id,
            storeId: newBranchId,
            managerId: manager._id,
            status: 'pending',
            assignedEmployees: [newEmployeeId]
          });
          
          await newStoreTask.save();
        } else {
          if (!newStoreTask.assignedEmployees.includes(newEmployeeId)) {
            newStoreTask.assignedEmployees.push(newEmployeeId);
            await newStoreTask.save();
          }
        }
        
        userTask.storeTaskId = newStoreTask._id;
        
        if (oldStoreTask) {
          const oldStoreTaskDoc = await StoreTask.findById(oldStoreTask._id);
          if (oldStoreTaskDoc) {
            oldStoreTaskDoc.assignedEmployees = oldStoreTaskDoc.assignedEmployees.filter(
              empId => empId.toString() !== oldEmployee._id.toString()
            );
            await oldStoreTaskDoc.save();
          }
        }
      }
      
      await notificationService.createNotification(
        newEmployeeId,
        'task_assigned',
        'Task mới được giao',
        `Bạn được giao task: ${userTask.broadcastId.title}`,
        {
          userTaskId: userTask._id,
          broadcastId: userTask.broadcastId._id,
          employeeId: newEmployeeId
        }
      );

      await notificationService.createNotification(
        oldEmployee._id,
        'task_reassigned',
        'Task đã được chuyển',
        `Task "${userTask.broadcastId.title}" đã được chuyển cho nhân viên khác`,
        {
          userTaskId: userTask._id,
          broadcastId: userTask.broadcastId._id,
          employeeId: newEmployeeId
        }
      );
      
      reassigned = true;
    }
    
    await userTask.save();
    
    let actionText = 'cập nhật';
    if (updatedBroadcast && reassigned) {
      actionText = 'cập nhật và giao lại';
    } else if (reassigned) {
      actionText = 'giao lại';
    }
    
    return sendSuccess(res, `Đã ${actionText} công việc thành công`, {
      userTask: {
        _id: userTask._id,
        employeeId: userTask.employeeId,
        storeTaskId: userTask.storeTaskId,
        status: userTask.status,
        updatedBroadcast,
        reassigned
      }
    });
    
  } catch (error) {
    console.error('[Admin/updateUserTask] Error:', error);
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

module.exports = {
  reassignUserTask,
  deleteUserTask
};
