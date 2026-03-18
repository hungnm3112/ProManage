/**
 * Broadcast Controller
 * Handles Broadcast management endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const Broadcast = require('../models/Broadcast');
const StoreTask = require('../models/StoreTask');
const Employee = require('../models/Employee');
const Brand = require('../models/Brand');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getEmployeeRole } = require('../helpers/authHelper');
const notificationService = require('../services/notificationService');

/**
 * @route   POST /api/broadcasts
 * @desc    Create a new broadcast (draft status)
 * @access  Private (admin only)
 */
const createBroadcast = async (req, res) => {
  try {
    console.log('[createBroadcast] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[createBroadcast] User ID:', req.user?._id);
    
    const {
      title,
      description,
      priority,
      deadline,
      assignedStores,
      checklist,
      attachments,
      recurring
    } = req.body;
    
    // Create broadcast with draft status
    const broadcast = new Broadcast({
      title,
      description,
      priority,
      deadline,
      assignedStores,
      checklist,
      attachments,
      recurring,
      status: 'draft',
      createdBy: req.user._id
    });
    
    console.log('[createBroadcast] Broadcast object before save:', JSON.stringify(broadcast, null, 2));
    
    await broadcast.save();
    
    console.log('[createBroadcast] Broadcast saved successfully! ID:', broadcast._id);
    
    // Populate creator and stores
    await broadcast.populate([
      { path: 'createdBy', select: 'FullName Phone Email' },
      { path: 'assignedStores', select: 'Name Map_Address Phone' }
    ]);
    
    console.log('[createBroadcast] Returning success response');
    return sendSuccess(res, 'Broadcast created successfully', { broadcast }, 201);
  } catch (error) {
    console.error('createBroadcast error:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, error.message, 400);
    }
    
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/broadcasts
 * @desc    Get all broadcasts with filtering
 * @access  Private (admin only)
 * @query   {string} status - Filter by status
 * @query   {string} priority - Filter by priority
 * @query   {string} createdBy - Filter by creator
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 */
const getBroadcasts = async (req, res) => {
  try {
    const { status, priority, createdBy, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Count total documents
    const total = await Broadcast.countDocuments(filter);
    
    // Fetch broadcasts, sort by newest first
    const broadcasts = await Broadcast.find(filter)
      .populate('createdBy', 'FullName Phone Email')
      .populate('assignedStores', 'Name Map_Address Phone Active')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return sendSuccess(res, 'Broadcasts fetched successfully', {
      broadcasts,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('getBroadcasts error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/broadcasts/:id
 * @desc    Get broadcast by ID with store tasks
 * @access  Private (admin only)
 */
const getBroadcastById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const broadcast = await Broadcast.findById(id)
      .populate('createdBy', 'FullName Phone Email')
      .populate('assignedStores', 'Name Map_Address Phone Active')
      .populate({
        path: 'store_tasks',
        populate: [
          { path: 'storeId', select: 'Name' },
          { path: 'managerId', select: 'FullName Phone' }
        ]
      })
      .select('-__v');
    
    if (!broadcast) {
      return sendError(res, 'Broadcast not found', 404);
    }
    
    // Get statistics if broadcast is active
    let stats = null;
    if (broadcast.status !== 'draft') {
      stats = await broadcast.getStats();
    }
    
    return sendSuccess(res, 'Broadcast fetched successfully', { 
      broadcast,
      stats
    });
  } catch (error) {
    console.error('getBroadcastById error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/broadcasts/:id
 * @desc    Update broadcast (only draft status)
 * @access  Private (admin only)
 */
const updateBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find broadcast
    const broadcast = await Broadcast.findById(id);
    
    if (!broadcast) {
      return sendError(res, 'Broadcast not found', 404);
    }
    
    // Admin can always edit; non-admin can only edit drafts
    const currentUser = req.user;
    const userRole = await getEmployeeRole(currentUser);
    if (userRole !== 'admin') {
      const canEditResult = broadcast.canEdit();
      if (!canEditResult.canEdit) {
        return sendError(res, canEditResult.reason, 400);
      }
    }
    
    // Allowed update fields
    const allowedUpdates = [
      'title',
      'description',
      'priority',
      'deadline',
      'assignedStores',
      'checklist',
      'attachments',
      'recurring'
    ];
    
    // Filter out fields not in allowedUpdates
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return sendError(res, 'No valid update fields provided', 400);
    }
    
    // Update broadcast
    Object.keys(updates).forEach(key => {
      broadcast[key] = updates[key];
    });
    
    await broadcast.save();
    
    // Populate
    await broadcast.populate([
      { path: 'createdBy', select: 'FullName Phone Email' },
      { path: 'assignedStores', select: 'Name Map_Address Phone' }
    ]);
    
    return sendSuccess(res, 'Broadcast updated successfully', { broadcast });
  } catch (error) {
    console.error('updateBroadcast error:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, error.message, 400);
    }
    
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   DELETE /api/broadcasts/:id
 * @desc    Delete broadcast (only draft status)
 * @access  Private (admin only)
 */
const deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find broadcast
    const broadcast = await Broadcast.findById(id);
    
    if (!broadcast) {
      return sendError(res, 'Broadcast not found', 404);
    }
    
    // Check if can delete
    const canDeleteResult = broadcast.canDelete();
    if (!canDeleteResult.canDelete) {
      return sendError(res, canDeleteResult.reason, 400);
    }
    
    // Delete broadcast
    await Broadcast.findByIdAndDelete(id);
    
    return sendSuccess(res, 'Broadcast deleted successfully', { 
      deletedId: id 
    });
  } catch (error) {
    console.error('deleteBroadcast error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/broadcasts/:id/publish
 * @desc    Publish broadcast and create store tasks
 * @access  Private (admin only)
 */
const publishBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find broadcast
    const broadcast = await Broadcast.findById(id)
      .populate('assignedStores');
    
    if (!broadcast) {
      return sendError(res, 'Broadcast not found', 404);
    }
    
    // Check if can publish
    const canPublishResult = broadcast.canPublish();
    if (!canPublishResult.canPublish) {
      return sendError(res, canPublishResult.reason, 400);
    }
    
    // Update broadcast status to active
    broadcast.status = 'active';
    broadcast.publishedAt = new Date();
    await broadcast.save();
    
    // Create store tasks for each assigned store
    const storeTasksPromises = broadcast.assignedStores.map(async (store) => {
      // Find manager of this store
      const manager = await Employee.findOne({
        ID_Branch: store._id,
        Status: 'Đang hoạt động'
      }).populate('ID_GroupUser');
      
      // Check if manager exists and has manager role
      if (!manager) {
        console.warn(`No active manager found for store ${store.Name}`);
        return null;
      }
      
      const managerRole = await getEmployeeRole(manager);
      if (managerRole !== 'manager') {
        console.warn(`Employee ${manager.FullName} at store ${store.Name} is not a manager`);
        return null;
      }
      
      // Create store task
      const storeTask = new StoreTask({
        broadcastId: broadcast._id,
        storeId: store._id,
        managerId: manager._id,
        status: 'pending'
      });
      
      await storeTask.save();
      
      return storeTask;
    });
    
    // Wait for all store tasks to be created
    const storeTasks = await Promise.all(storeTasksPromises);
    const createdStoreTasks = storeTasks.filter(task => task !== null);
    
    // Create notifications for managers
    if (createdStoreTasks.length > 0) {
      const managerIds = createdStoreTasks.map(task => task.managerId);
      await notificationService.notifyBroadcastPublished(managerIds, broadcast);
    }
    
    // Populate broadcast with store tasks
    await broadcast.populate([
      { path: 'createdBy', select: 'FullName Phone Email' },
      { path: 'assignedStores', select: 'Name Map_Address Phone' },
      {
        path: 'store_tasks',
        populate: [
          { path: 'storeId', select: 'Name' },
          { path: 'managerId', select: 'FullName Phone' }
        ]
      }
    ]);
    
    return sendSuccess(res, 'Broadcast published successfully', {
      broadcast,
      storeTasksCreated: createdStoreTasks.length,
      storeTasksFailed: broadcast.assignedStores.length - createdStoreTasks.length
    });
  } catch (error) {
    console.error('publishBroadcast error:', error);
    
    // If error occurs, rollback broadcast status
    try {
      await Broadcast.findByIdAndUpdate(id, {
        status: 'draft',
        publishedAt: null
      });
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/broadcasts/:id/assign
 * @desc    Assign broadcast to stores with specific employees or individual employees
 * @access  Private (admin only)
 * @body    { storeAssignments: [{ storeId, employeeIds }] } OR { employeeIds: [] }
 */
const assignBroadcast = async (req, res) => {
  const UserTask = require('../models/UserTask');
  
  try {
    const { id } = req.params;
    const { storeAssignments, employeeIds } = req.body;
    
    console.log('[assignBroadcast] Broadcast ID:', id);
    console.log('[assignBroadcast] Store Assignments:', storeAssignments);
    console.log('[assignBroadcast] Employee IDs:', employeeIds);
    
    // 1. Get broadcast and verify it exists
    const broadcast = await Broadcast.findById(id);
    if (!broadcast) {
      return sendError(res, 'Broadcast not found', 404);
    }
    
    // Check if broadcast is in valid status (not archived)
    if (broadcast.status === 'archived') {
      return sendError(res, 'Cannot assign archived broadcasts', 400);
    }
    
    const createdStoreTasks = [];
    const createdUserTasks = [];
    const errors = [];
    
    // 2. Handle assignment to STORES with specific employees
    if (storeAssignments && storeAssignments.length > 0) {
      console.log('[assignBroadcast] Processing store assignments...');
      
      for (const assignment of storeAssignments) {
        const { storeId, employeeIds: empIds } = assignment;
        
        try {
          // Find store
          const store = await Brand.findById(storeId);
          if (!store) {
            errors.push(`Store ${storeId} not found`);
            continue;
          }
          
          console.log(`[assignBroadcast] Processing store ${store.Name} with ${empIds.length} employees`);
          
          // Find manager for StoreTask (needed for managerId field)
          const allEmployees = await Employee.find({
            ID_Branch: storeId,
            Status: 'Đang hoạt động'
          }).populate('ID_GroupUser');
          
          let manager = null;
          for (const emp of allEmployees) {
            const role = await getEmployeeRole(emp);
            if (role === 'manager') {
              manager = emp;
              break;
            }
          }
          
          // If no manager, use first selected employee as fallback
          if (!manager && empIds.length > 0) {
            const firstEmp = await Employee.findById(empIds[0]);
            if (firstEmp) {
              console.log(`[assignBroadcast] No manager found for ${store.Name}, using first selected employee as fallback`);
              manager = firstEmp;
            }
          }
          
          if (!manager) {
            errors.push(`Cannot find manager or employee for store ${store.Name}`);
            continue;
          }
          
          // Check if StoreTask already exists
          let storeTask = await StoreTask.findOne({
            broadcastId: broadcast._id,
            storeId: storeId
          });
          
          // Create or update StoreTask
          if (!storeTask) {
            storeTask = new StoreTask({
              broadcastId: broadcast._id,
              storeId: storeId,
              managerId: manager._id,
              status: 'pending',
              assignedEmployees: empIds
            });
            
            await storeTask.save();
            createdStoreTasks.push(storeTask);
            console.log(`[assignBroadcast] Created StoreTask for ${store.Name}`);
          } else {
            // Check if StoreTask already has someone assigned
            if (storeTask.assignedEmployees.length > 0) {
              // Get current assigned employee
              const currentEmployeeId = storeTask.assignedEmployees[0];
              const currentEmployee = await Employee.findById(currentEmployeeId);
              const currentName = currentEmployee?.FullName || 'N/A';
              
              // Check if trying to assign different person to same store
              const isDifferentPerson = !empIds.some(id => id.toString() === currentEmployeeId.toString());
              
              if (isDifferentPerson) {
                // Reject: already has someone, suggest editing
                errors.push(`Chi nhánh "${store.Name}" đã được giao cho nhân viên ${currentName}. Vui lòng sửa task cũ để thay đổi người phụ trách.`);
                continue;
              } else {
                // Same person, skip
                console.log(`[assignBroadcast] StoreTask already assigned to same person for ${store.Name}`);
                continue;
              }
            } else {
              // No one assigned yet, proceed with assignment
              storeTask.assignedEmployees = empIds;
              await storeTask.save();
              console.log(`[assignBroadcast] Updated StoreTask for ${store.Name}`);
            }
          }
          
          // Create UserTask for each selected employee
          for (const employeeId of empIds) {
            try {
              // Find employee
              const employee = await Employee.findById(employeeId).populate('ID_GroupUser');
              if (!employee) {
                errors.push(`Employee ${employeeId} not found`);
                continue;
              }
              
              if (employee.Status !== 'Đang hoạt động') {
                errors.push(`Employee ${employee.FullName} is not active`);
                continue;
              }
              
              // Check if UserTask already exists
              const existingUserTask = await UserTask.findOne({
                broadcastId: broadcast._id,
                employeeId: employeeId
              });
              
              if (existingUserTask) {
                console.log(`[assignBroadcast] UserTask already exists for employee ${employeeId}, skipping...`);
                // Get the actual employee who is currently assigned
                const assignedEmployee = await Employee.findById(existingUserTask.employeeId);
                const assignedName = assignedEmployee?.FullName || 'N/A';
                console.log(`[assignBroadcast] Assigned employee: ${assignedName} (ID: ${existingUserTask.employeeId})`);
                errors.push(`Giao việc thất bại do công việc "${broadcast.title}" đã được giao cho nhân viên ${assignedName} phụ trách, vui lòng kiểm tra lại.`);
                continue;
              }
              
              // Create UserTask (Individual Task)
              const userTask = new UserTask({
                storeTaskId: storeTask._id,
                broadcastId: broadcast._id,
                employeeId: employeeId,
                checklist: broadcast.checklist.map(item => ({
                  task: item.task,
                  note: item.note || '',
                  required: item.required,
                  isCompleted: false
                })),
                status: 'assigned',
                evidences: []
              });
              
              await userTask.save();
              createdUserTasks.push(userTask);
              console.log(`[assignBroadcast] Created UserTask for ${employee.FullName} at ${store.Name}`);
              
            } catch (error) {
              console.error(`[assignBroadcast] Error processing employee ${employeeId}:`, error);
              errors.push(`Error assigning to employee ${employeeId}: ${error.message}`);
            }
          }
          
        } catch (error) {
          console.error(`[assignBroadcast] Error processing store ${storeId}:`, error);
          errors.push(`Error assigning to store ${storeId}: ${error.message}`);
        }
      }
    }
    
    // 3. Handle assignment to INDIVIDUAL EMPLOYEES
    if (employeeIds && employeeIds.length > 0) {
      console.log('[assignBroadcast] Processing individual employee assignments...');
      
      for (const employeeId of employeeIds) {
        try {
          // Find employee
          const employee = await Employee.findById(employeeId).populate('ID_GroupUser');
          if (!employee) {
            errors.push(`Employee ${employeeId} not found`);
            continue;
          }
          
          if (employee.Status !== 'Đang hoạt động') {
            errors.push(`Employee ${employee.FullName} is not active`);
            continue;
          }
          
          if (!employee.ID_Branch) {
            errors.push(`Employee ${employee.FullName} has no assigned branch`);
            continue;
          }
          
          // Check if UserTask already exists
          const existingIndividualTaskCheck = await UserTask.findOne({
            broadcastId: broadcast._id,
            employeeId: employeeId
          });
          
          if (existingIndividualTaskCheck) {
            console.log(`[assignBroadcast] UserTask already exists for employee ${employeeId}, skipping...`);
            // Get the actual employee who is currently assigned
            const assignedEmployee = await Employee.findById(existingIndividualTaskCheck.employeeId);
            const assignedName = assignedEmployee?.FullName || 'N/A';
            console.log(`[assignBroadcast] Assigned employee: ${assignedName} (ID: ${existingIndividualTaskCheck.employeeId})`);
            errors.push(`Giao việc thất bại do công việc "${broadcast.title}" đã được giao cho nhân viên ${assignedName} phụ trách, vui lòng kiểm tra lại.`);
            continue;
          }
          
          // Find or create StoreTask for this employee's branch
          let storeTask = await StoreTask.findOne({
            broadcastId: broadcast._id,
            storeId: employee.ID_Branch
          });
          
          // Check if UserTask already exists for this employee
          const existingIndividualTask = await UserTask.findOne({
            broadcastId: broadcast._id,
            employeeId: employeeId
          });
          
          if (existingIndividualTask) {
            console.log(`[assignBroadcast] UserTask already exists for employee ${employeeId}, skipping...`);
            // Get the actual employee who is currently assigned
            const assignedEmployee = await Employee.findById(existingIndividualTask.employeeId);
            const assignedName = assignedEmployee?.FullName || 'N/A';
            console.log(`[assignBroadcast] Assigned employee: ${assignedName} (ID: ${existingIndividualTask.employeeId})`);
            errors.push(`Công việc "${broadcast.title}" cho nhân viên ${assignedName} đã tồn tại. Vui lòng sửa task cũ để thay đổi người phụ trách.`);
            continue;
          }
          
          if (!storeTask) {
            // Find manager of this store
            const managers = await Employee.find({
              ID_Branch: employee.ID_Branch,
              Status: 'Đang hoạt động'
            }).populate('ID_GroupUser');
            
            let manager = null;
            for (const emp of managers) {
              const role = await getEmployeeRole(emp);
              if (role === 'manager') {
                manager = emp;
                break;
              }
            }
            
            // Use current employee as fallback if no manager
            if (!manager) {
              console.log(`[assignBroadcast] No manager found, using employee ${employee.FullName} as fallback`);
              manager = employee;
            }
            
            // Create StoreTask
            storeTask = new StoreTask({
              broadcastId: broadcast._id,
              storeId: employee.ID_Branch,
              managerId: manager._id,
              status: 'pending',
              assignedEmployees: [employeeId]
            });
            
            await storeTask.save();
            createdStoreTasks.push(storeTask);
            console.log(`[assignBroadcast] Created StoreTask for employee's branch`);
          } else {
            // Update assignedEmployees if not already included
            if (!storeTask.assignedEmployees.includes(employeeId)) {
              storeTask.assignedEmployees.push(employeeId);
              await storeTask.save();
            }
          }
          
          // Create UserTask for employee (Individual Task)
          const userTask = new UserTask({
            storeTaskId: storeTask._id,
            broadcastId: broadcast._id,
            employeeId: employeeId,
            checklist: broadcast.checklist.map(item => ({
              task: item.task,
              note: item.note || '',
              required: item.required,
              isCompleted: false
            })),
            status: 'assigned',
            evidences: []
          });
          
          await userTask.save();
          createdUserTasks.push(userTask);
          console.log(`[assignBroadcast] Created UserTask for ${employee.FullName}`);
          
        } catch (error) {
          console.error(`[assignBroadcast] Error processing employee ${employeeId}:`, error);
          errors.push(`Error assigning to employee ${employeeId}: ${error.message}`);
        }
      }
    }
    
    // 4. Update broadcast status to 'active' if it was 'draft'
    if (broadcast.status === 'draft' && createdUserTasks.length > 0) {
      broadcast.status = 'active';
      await broadcast.save();
      console.log('[assignBroadcast] Broadcast status updated to active');
    }
    
    // 5. Return response (success even with errors - errors are warnings)
    const response = {
      message: 'Assignment completed',
      created: {
        storeTasks: createdStoreTasks.length,
        userTasks: createdUserTasks.length
      },
      details: {
        storeTasks: createdStoreTasks.map(st => ({
          id: st._id,
          storeId: st.storeId,
          managerId: st.managerId
        })),
        userTasks: createdUserTasks.map(ut => ({
          id: ut._id,
          employeeId: ut.employeeId
        }))
      }
    };
    
    if (errors.length > 0) {
      response.errors = errors;
      response.message += ` with ${errors.length} warning(s)`;
    }
    
    console.log('[assignBroadcast] Success:', response);
    return sendSuccess(res, response.message, response, 200);
    
  } catch (error) {
    console.error('[assignBroadcast] Error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Update a UserTask (admin can edit all details and reassign)
 * @route   PUT /api/broadcasts/user-tasks/:taskId
 * @access  Private/Admin
 */
const updateUserTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    console.log(`[updateUserTask] Updating task ${taskId}:`, updates);
    
    // Find the UserTask
    const UserTask = require('../models/UserTask');
    const userTask = await UserTask.findById(taskId)
      .populate('broadcastId')
      .populate('employeeId');
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Check if task is completed - cannot edit completed tasks
    if (userTask.status === 'approved') {
      return sendError(res, 'Không thể sửa task đã hoàn thành', 400);
    }
    
    // If reassigning to different employee
    if (updates.employeeId && updates.employeeId !== userTask.employeeId.toString()) {
      const Employee = require('../models/Employee');
      const newEmployee = await Employee.findById(updates.employeeId);
      
      if (!newEmployee) {
        return sendError(res, 'Employee not found', 404);
      }
      
      if (newEmployee.Status !== 'Đang hoạt động') {
        return sendError(res, 'Employee is not active', 400);
      }
      
      // Check if new employee already has this task
      const existingTask = await UserTask.findOne({
        broadcastId: userTask.broadcastId._id,
        employeeId: updates.employeeId
      });
      
      if (existingTask && existingTask._id.toString() !== taskId) {
        return sendError(res, `Nhân viên ${newEmployee.FullName} đã có task này rồi`, 400);
      }
      
      // Save old employee reference before updating
      const oldEmployee = userTask.employeeId;
      userTask.employeeId = updates.employeeId;
      
      // Update StoreTask if employee is from different branch
      if (newEmployee.ID_Branch.toString() !== oldEmployee.ID_Branch.toString()) {
        const StoreTask = require('../models/StoreTask');
        
        // Find or create StoreTask for new branch
        let newStoreTask = await StoreTask.findOne({
          broadcastId: userTask.broadcastId._id,
          storeId: newEmployee.ID_Branch
        });
        
        if (!newStoreTask) {
          // Find manager for new branch
          const managers = await Employee.find({
            ID_Branch: newEmployee.ID_Branch,
            Status: 'Đang hoạt động'
          }).populate('ID_GroupUser');
          
          let manager = null;
          for (const emp of managers) {
            const role = await getEmployeeRole(emp);
            if (role === 'manager') {
              manager = emp;
              break;
            }
          }
          
          if (!manager) manager = newEmployee; // Fallback
          
          newStoreTask = new StoreTask({
            broadcastId: userTask.broadcastId._id,
            storeId: newEmployee.ID_Branch,
            managerId: manager._id,
            status: 'pending',
            assignedEmployees: [newEmployee._id]
          });
          
          await newStoreTask.save();
        } else {
          // Add to assignedEmployees if not already there
          if (!newStoreTask.assignedEmployees.includes(newEmployee._id)) {
            newStoreTask.assignedEmployees.push(newEmployee._id);
            await newStoreTask.save();
          }
        }
        
        // Remove from old StoreTask
        const oldStoreTask = await StoreTask.findById(userTask.storeTaskId);
        if (oldStoreTask) {
          oldStoreTask.assignedEmployees = oldStoreTask.assignedEmployees.filter(
            id => id.toString() !== oldEmployee._id.toString()
          );
          await oldStoreTask.save();
        }
        
        userTask.storeTaskId = newStoreTask._id;
      }
    }
    
    // Update broadcast-related fields (if editing broadcast details)
    if (updates.title || updates.description || updates.priority || updates.deadline || updates.checklist) {
      const broadcast = await userTask.broadcastId;
      
      if (updates.title) broadcast.title = updates.title;
      if (updates.description) broadcast.description = updates.description;
      if (updates.priority) broadcast.priority = updates.priority;
      if (updates.deadline) broadcast.deadline = new Date(updates.deadline);
      
      if (updates.checklist) {
        // Update broadcast checklist
        broadcast.checklist = updates.checklist.map(item => ({
          task: item.task,
          note: item.note || '',
          required: item.required !== undefined ? item.required : true
        }));
        
        // Update UserTask checklist
        userTask.checklist = updates.checklist.map(item => ({
          task: item.task,
          note: item.note || '',
          required: item.required !== undefined ? item.required : true,
          isCompleted: false
        }));
      }
      
      await broadcast.save();
    }
    
    await userTask.save();
    
    console.log(`[updateUserTask] Task updated successfully`);
    return sendSuccess(res, 'Task updated successfully', { task: userTask });
    
  } catch (error) {
    console.error('[updateUserTask] Error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Delete a UserTask (cannot delete completed tasks)
 * @route   DELETE /api/broadcasts/user-tasks/:taskId
 * @access  Private/Admin
 */
const deleteUserTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    console.log(`[deleteUserTask] Deleting task ${taskId}`);
    
    // Find the UserTask
    const UserTask = require('../models/UserTask');
    const userTask = await UserTask.findById(taskId);
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Check if task is completed - cannot delete completed tasks
    if (userTask.status === 'approved') {
      return sendError(res, 'Không thể xóa task đã hoàn thành. Vui lòng truy cập database để xóa trực tiếp nếu cần thiết.', 400);
    }
    
    // Remove employee from StoreTask assignedEmployees
    const StoreTask = require('../models/StoreTask');
    const storeTask = await StoreTask.findById(userTask.storeTaskId);
    
    if (storeTask) {
      storeTask.assignedEmployees = storeTask.assignedEmployees.filter(
        id => id.toString() !== userTask.employeeId.toString()
      );
      
      // If no more assigned employees, delete the StoreTask too
      if (storeTask.assignedEmployees.length === 0) {
        await StoreTask.findByIdAndDelete(storeTask._id);
        console.log(`[deleteUserTask] Also deleted empty StoreTask ${storeTask._id}`);
      } else {
        await storeTask.save();
      }
    }
    
    // Delete the UserTask
    await UserTask.findByIdAndDelete(taskId);
    
    console.log(`[deleteUserTask] Task deleted successfully`);
    return sendSuccess(res, 'Task deleted successfully');
    
  } catch (error) {
    console.error('[deleteUserTask] Error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  publishBroadcast,
  assignBroadcast,
  updateUserTask,
  deleteUserTask
};
