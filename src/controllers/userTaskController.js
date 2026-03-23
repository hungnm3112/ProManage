/**
 * UserTask Controller
 * Handles employee task execution endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const UserTask = require('../models/UserTask');
const StoreTask = require('../models/StoreTask');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const notificationService = require('../services/notificationService');

/**
 * @route   GET /api/my-tasks
 * @desc    Get all tasks assigned to current employee
 * @access  Private (employee)
 * @query   {string} status - Filter by status
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 */
const getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const currentUser = req.user;
    
    // Build filter
    const filter = {
      employeeId: currentUser._id
    };
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get tasks
    const userTasks = await UserTask.find(filter)
      .populate({
        path: 'broadcastId',
        select: 'title description priority deadline'
      })
      .populate({
        path: 'storeTaskId',
        select: 'status acceptedAt',
        populate: {
          path: 'storeId',
          select: 'Name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await UserTask.countDocuments(filter);
    
    // Format response with stats
    const tasksWithStats = userTasks.map(task => ({
      ...task.toObject(),
      stats: task.getStats()
    }));
    
    return sendSuccess(res, 'Tasks fetched successfully', {
      tasks: tasksWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: skip + userTasks.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('getMyTasks error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/my-tasks/:id
 * @desc    Get task details by ID
 * @access  Private (employee)
 * @note    Employee can only view their own tasks
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    // Find task
    const userTask = await UserTask.findById(id)
      .populate({
        path: 'broadcastId',
        select: 'title description priority deadline createdBy attachments',
        populate: { path: 'createdBy', select: 'FullName' }
      })
      .populate({
        path: 'storeTaskId',
        select: 'status acceptedAt startedAt assignedPersonId assignedEmployees storeId completionRate',
        populate: [
          { path: 'storeId', select: 'Name Map_Address Phone' },
          { path: 'assignedEmployees', select: 'FullName Phone' },
          { path: 'assignedPersonId', select: 'FullName Phone' }
        ]
      })
      .populate({
        path: 'employeeId',
        select: 'FullName Phone Email'
      })
      .populate({
        path: 'checklist.assignedTo',
        select: 'FullName Phone'
      });

    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }

    // Verify this task belongs to the current employee
    if (userTask.employeeId._id.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only view your own tasks', 403);
    }

    // Determine role: responsible person = in assignedEmployees
    const storeTask = userTask.storeTaskId;
    const assignedEmployees = storeTask?.assignedEmployees || [];
    const isResponsible = assignedEmployees.some(emp => {
      const empId = emp._id ? emp._id.toString() : emp.toString();
      return empId === currentUser._id.toString();
    });
    const assignedPersonId = storeTask?.assignedPersonId;

    let assignedItems = [];
    if (!isResponsible && storeTask?._id) {
      // External employee: look up items assigned to them across all responsible persons' UserTasks
      const responsibleIds = assignedEmployees.map(e => e._id || e);
      const responsibleUserTasks = await UserTask.find({
        storeTaskId: storeTask._id,
        employeeId: { $in: responsibleIds }
      }).select('checklist');
      for (const rt of responsibleUserTasks) {
        const items = rt.checklist
          .filter(item => item.assignedTo?.toString() === currentUser._id.toString())
          .map(item => (item.toObject ? item.toObject() : JSON.parse(JSON.stringify(item))));
        assignedItems.push(...items);
      }
    }

    const stats = userTask.getStats();

    return sendSuccess(res, 'Task fetched successfully', {
      task: userTask,
      stats,
      isResponsible,
      assignedItems
    });
  } catch (error) {
    console.error('getTaskById error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/my-tasks/:id/checklist
 * @desc    Update checklist items completion status
 * @access  Private (employee)
 * @body    {array} checklist - Array of { _id, isCompleted }
 */
const updateChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;
    const currentUser = req.user;
    
    // Validate input
    if (!checklist || !Array.isArray(checklist)) {
      return sendError(res, 'Checklist array is required', 400);
    }
    
    // Find task
    const userTask = await UserTask.findById(id);
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Verify this task belongs to the current employee
    if (userTask.employeeId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only update your own tasks', 403);
    }
    
    // Check if task can be updated
    if (!userTask.canUpdate()) {
      return sendError(res, 'Task cannot be updated in current status', 400);
    }
    
    // Update checklist items
    checklist.forEach(item => {
      const checklistItem = userTask.checklist.id(item._id);
      if (checklistItem) {
        const wasCompleted = checklistItem.isCompleted;
        checklistItem.isCompleted = item.isCompleted;
        
        // Update completedAt timestamp
        if (item.isCompleted && !wasCompleted) {
          checklistItem.completedAt = new Date();
        } else if (!item.isCompleted && wasCompleted) {
          checklistItem.completedAt = null;
        }
      }
    });
    
    // Auto-update status to in_progress if not already
    if (userTask.status === 'assigned') {
      userTask.status = 'in_progress';
    }
    
    await userTask.save();
    
    // Populate for response
    await userTask.populate([
      { path: 'broadcastId', select: 'title deadline' },
      { path: 'storeTaskId', select: 'status' }
    ]);
    
    return sendSuccess(res, 'Checklist updated successfully', {
      task: userTask,
      stats: userTask.getStats()
    });
  } catch (error) {
    console.error('updateChecklist error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/my-tasks/:id/evidence
 * @desc    Add evidence files to task
 * @access  Private (employee)
 * @body    {array} evidences - Array of { type, url, filename }
 */
const uploadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { evidences } = req.body;
    const currentUser = req.user;
    
    // Validate input
    if (!evidences || !Array.isArray(evidences) || evidences.length === 0) {
      return sendError(res, 'Evidences array is required', 400);
    }
    
    // Validate evidence format
    for (const evidence of evidences) {
      if (!evidence.type || !evidence.url || !evidence.filename) {
        return sendError(res, 'Each evidence must have type, url, and filename', 400);
      }
      
      if (!['photo', 'video', 'document', 'file'].includes(evidence.type)) {
        return sendError(res, 'Invalid evidence type. Must be photo, video, document, or file', 400);
      }
    }
    
    // Find task
    const userTask = await UserTask.findById(id);
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Verify this task belongs to the current employee
    if (userTask.employeeId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only upload evidence to your own tasks', 403);
    }
    
    // Check if task can be updated
    if (!userTask.canUpdate()) {
      return sendError(res, 'Cannot upload evidence in current status', 400);
    }
    
    // Add evidences
    evidences.forEach(evidence => {
      userTask.evidences.push({
        type: evidence.type,
        url: evidence.url,
        filename: evidence.filename,
        uploadedAt: new Date()
      });
    });
    
    // Auto-update status to in_progress if not already
    if (userTask.status === 'assigned') {
      userTask.status = 'in_progress';
    }
    
    await userTask.save();
    
    return sendSuccess(res, `${evidences.length} evidence(s) added successfully`, {
      task: userTask,
      stats: userTask.getStats()
    });
  } catch (error) {
    console.error('uploadEvidence error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/my-tasks/:id/submit
 * @desc    Submit task for review
 * @access  Private (employee)
 * @body    {string} overallNote - Optional note from employee
 */
const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { overallNote } = req.body;
    const currentUser = req.user;
    
    // Find task
    const userTask = await UserTask.findById(id)
      .populate('broadcastId', 'title')
      .populate('storeTaskId', 'status');
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Verify this task belongs to the current employee
    if (userTask.employeeId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only submit your own tasks', 403);
    }
    
    // Check if task can be submitted
    const canSubmitResult = userTask.canSubmit();
    if (!canSubmitResult.canSubmit) {
      return sendError(res, canSubmitResult.reason, 400);
    }
    
    // Update task
    userTask.status = 'submitted';
    userTask.submittedAt = new Date();
    if (overallNote) {
      userTask.overallNote = overallNote.trim();
    }
    
    await userTask.save();

    // Update store task status if needed
    const storeTask = await StoreTask.findById(userTask.storeTaskId)
      .populate('managerId', 'FullName');
    if (storeTask && storeTask.status === 'accepted') {
      storeTask.status = 'in_progress';
      storeTask.startedAt = new Date();
      await storeTask.save();
    }

    // Notify manager about task submission
    if (storeTask && storeTask.managerId) {
      await notificationService.notifyTaskSubmitted(
        storeTask.managerId._id,
        userTask,
        currentUser
      );
    }

    // Worker submission: mark their assigned checklist items as done in assignedPerson's UserTask
    if (storeTask && storeTask.assignedPersonId &&
        storeTask.assignedPersonId.toString() !== currentUser._id.toString()) {
      const assignedPersonTask = await UserTask.findOne({
        storeTaskId: storeTask._id,
        employeeId: storeTask.assignedPersonId
      });
      if (assignedPersonTask) {
        let itemsMarked = false;
        assignedPersonTask.checklist.forEach(item => {
          if (item.assignedTo?.toString() === currentUser._id.toString() && !item.isCompleted) {
            item.isCompleted = true;
            item.completedAt = new Date();
            // N-2c: reset reviewStatus so responsible can review again after resubmit
            item.reviewStatus = null;
            item.reviewNote = '';
            item.reviewedAt = null;
            item.reviewedBy = null;
            itemsMarked = true;
          }
        });
        if (itemsMarked) await assignedPersonTask.save();
      }
    }

    return sendSuccess(res, 'Task submitted successfully', {
      task: userTask,
      stats: userTask.getStats()
    });
  } catch (error) {
    console.error('submitTask error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/my-tasks/:id/assign-item
 * @desc    Người phụ trách giao checklist item cho nhân viên cùng chi nhánh (không giới hạn bởi danh sách admin chọn)
 * @access  Private (employee — chỉ người phụ trách mới được gọi)
 * @body    { itemId: String (ObjectId của checklist item), assignedToEmployeeId: String }
 */
const assignChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, assignedToEmployeeId } = req.body;
    const currentUser = req.user;

    if (!itemId || !assignedToEmployeeId) {
      return sendError(res, 'itemId và assignedToEmployeeId là bắt buộc', 400);
    }

    const userTask = await UserTask.findById(id).populate({
      path: 'storeTaskId',
      select: 'storeId assignedEmployees'
    });
    if (!userTask) {
      return sendError(res, 'Không tìm thấy UserTask', 404);
    }

    // Chỉ người phụ trách (UserTask.employeeId) mới được phân công
    if (userTask.employeeId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'Chỉ người phụ trách mới có thể phân công checklist item', 403);
    }

    // Không được giao cho chính mình
    if (assignedToEmployeeId === currentUser._id.toString()) {
      return sendError(res, 'Không thể giao item cho chính mình', 400);
    }

    // Validate: nhân viên được giao phải cùng chi nhánh với task (KHÔNG phụ thuộc assignedEmployees)
    const storeTask = userTask.storeTaskId;
    const targetEmployee = await Employee.findById(assignedToEmployeeId).select('ID_Branch Status FullName');
    if (!targetEmployee) {
      return sendError(res, 'Nhân viên không tồn tại', 404);
    }
    if (targetEmployee.Status === 'Đã nghỉ việc') {
      return sendError(res, 'Nhân viên này đã nghỉ việc', 400);
    }
    if (targetEmployee.ID_Branch.toString() !== storeTask.storeId.toString()) {
      return sendError(res, 'Chỉ có thể giao việc cho nhân viên thuộc cùng chi nhánh', 400);
    }

    // Tìm checklist item theo _id
    const checklistItem = userTask.checklist.id(itemId);
    if (!checklistItem) {
      return sendError(res, 'Không tìm thấy checklist item', 404);
    }

    if (checklistItem.isCompleted) {
      return sendError(res, 'Không thể giao item đã hoàn thành', 400);
    }

    checklistItem.assignedTo = assignedToEmployeeId;
    checklistItem.reviewStatus = null;
    await userTask.save();

    // Nếu nhân viên được giao chưa có UserTask cho StoreTask này → tạo UserTask rỗng cho visibility
    const existingTargetTask = await UserTask.findOne({
      storeTaskId: storeTask._id,
      employeeId: assignedToEmployeeId
    });
    if (!existingTargetTask) {
      await UserTask.create({
        storeTaskId: storeTask._id,
        broadcastId: userTask.broadcastId,
        employeeId: assignedToEmployeeId,
        checklist: [],
        evidences: [],
        status: 'assigned'
      });
    }

    // Notify nhân viên được giao
    try {
      const Broadcast = require('../models/Broadcast');
      const broadcast = await Broadcast.findById(userTask.broadcastId).select('title');
      await notificationService.createNotification({
        recipientId: assignedToEmployeeId,
        type: 'checklist_item_assigned',
        title: 'Được giao công việc mới',
        message: `Bạn được giao thực hiện: "${checklistItem.task}" trong task "${broadcast?.title || ''}"`,
        relatedId: userTask._id,
        relatedModel: 'UserTask'
      });
    } catch (notifErr) {
      console.error('assignChecklistItem notification error:', notifErr.message);
    }

    return sendSuccess(res, 'Phân công checklist item thành công', { 
      checklistItem: {
        _id: checklistItem._id,
        task: checklistItem.task,
        assignedTo: assignedToEmployeeId
      }
    });
  } catch (error) {
    console.error('assignChecklistItem error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/my-tasks/:id/review-item
 * @desc    Người phụ trách approve/reject checklist item của nhân viên được tag
 * @access  Private (employee — chỉ người phụ trách mới được gọi)
 * @body    { itemId: String, action: 'approve'|'reject', reviewNote: String }
 */
const reviewChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, action, reviewNote } = req.body;
    const currentUser = req.user;

    if (!itemId || !action || !['approve', 'reject'].includes(action)) {
      return sendError(res, 'itemId và action (approve|reject) là bắt buộc', 400);
    }

    const userTask = await UserTask.findById(id).populate('storeTaskId');
    if (!userTask) {
      return sendError(res, 'Không tìm thấy UserTask', 404);
    }

    // Chỉ người phụ trách mới được review
    if (userTask.employeeId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'Chỉ người phụ trách mới có thể review checklist item', 403);
    }

    const checklistItem = userTask.checklist.id(itemId);
    if (!checklistItem) {
      return sendError(res, 'Không tìm thấy checklist item', 404);
    }

    if (!checklistItem.assignedTo) {
      return sendError(res, 'Item này chưa được giao cho ai', 400);
    }

    if (checklistItem.reviewStatus === 'approved') {
      return sendError(res, 'Item này đã được phê duyệt rồi', 400);
    }

    // Cập nhật review
    checklistItem.reviewStatus = action === 'approve' ? 'approved' : 'rejected';
    checklistItem.reviewedAt = new Date();
    checklistItem.reviewedBy = currentUser._id;
    checklistItem.reviewNote = reviewNote || '';

    if (action === 'approve') {
      checklistItem.isCompleted = true;
      checklistItem.completedAt = new Date();
    } else {
      // N-1: reset completion so progress rate decreases correctly
      checklistItem.isCompleted = false;
      checklistItem.completedAt = null;
    }

    await userTask.save();

    // N-2a: reset worker's task status so they can resubmit
    if (action === 'reject' && checklistItem.assignedTo) {
      const storeTaskRef = userTask.storeTaskId._id || userTask.storeTaskId;
      const workerTask = await UserTask.findOne({
        storeTaskId: storeTaskRef,
        employeeId: checklistItem.assignedTo
      });
      if (workerTask && workerTask.status === 'submitted') {
        workerTask.status = 'in_progress';
        await workerTask.save();
      }
    }

    // Cập nhật completion rate của StoreTask
    const storeTask = userTask.storeTaskId;
    await storeTask.updateCompletionRate();

    // Notify nhân viên được review
    try {
      const Broadcast = require('../models/Broadcast');
      const broadcast = await Broadcast.findById(userTask.broadcastId).select('title');
      const actionText = action === 'approve' ? 'phê duyệt' : 'từ chối';
      await notificationService.createNotification({
        recipientId: checklistItem.assignedTo,
        type: 'checklist_item_reviewed',
        title: `Kết quả công việc: ${actionText === 'phê duyệt' ? '✅' : '❌'} ${actionText}`,
        message: `"${checklistItem.task}" trong task "${broadcast?.title || ''}" đã được ${actionText}${reviewNote ? `: ${reviewNote}` : ''}`,
        relatedId: userTask._id,
        relatedModel: 'UserTask'
      });
    } catch (notifErr) {
      console.error('reviewChecklistItem notification error:', notifErr.message);
    }

    return sendSuccess(res, `Checklist item đã được ${action === 'approve' ? 'phê duyệt' : 'từ chối'}`, {
      checklistItem: {
        _id: checklistItem._id,
        task: checklistItem.task,
        reviewStatus: checklistItem.reviewStatus,
        isCompleted: checklistItem.isCompleted,
        reviewNote: checklistItem.reviewNote
      },
      storeTaskCompletionRate: storeTask.completionRate,
      storeTaskStatus: storeTask.status
    });
  } catch (error) {
    console.error('reviewChecklistItem error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/my-tasks/:id/confirm
 * @desc    Người phụ trách xác nhận nhận việc → chuyển sang in_progress
 * @access  Private (employee — chỉ người phụ trách)
 */
const confirmTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const userTask = await UserTask.findById(id).populate('storeTaskId');
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }

    // Chỉ có thể xác nhận task của chính mình
    if (userTask.employeeId.toString() !== currentUserId.toString()) {
      return sendError(res, 'Không thể xác nhận task của người khác', 403);
    }

    if (userTask.status !== 'assigned') {
      return sendError(res, `Không thể xác nhận: task đang ở trạng thái "${userTask.status}"`, 400);
    }

    // Cập nhật UserTask
    userTask.status = 'in_progress';
    await userTask.save();

    // Cập nhật StoreTask chỉ khi người xác nhận là người phụ trách
    const storeTask = userTask.storeTaskId;
    if (storeTask.assignedPersonId?.toString() === currentUserId.toString()) {
      storeTask.status = 'in_progress';
      storeTask.startedAt = new Date();
      await storeTask.save();
    }

    console.log(`[confirmTask] Task ${id} confirmed by ${currentUserId}`);
    return sendSuccess(res, 'Xác nhận nhận việc thành công', {
      userTask: {
        _id: userTask._id,
        status: userTask.status
      },
      storeTask: {
        _id: storeTask._id,
        status: storeTask.status,
        startedAt: storeTask.startedAt
      }
    });
  } catch (error) {
    console.error('confirmTask error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getMyTasks,
  getTaskById,
  updateChecklist,
  uploadEvidence,
  submitTask,
  assignChecklistItem,
  reviewChecklistItem,
  confirmTask
};
