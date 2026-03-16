/**
 * UserTask Controller
 * Handles employee task execution endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const UserTask = require('../models/UserTask');
const StoreTask = require('../models/StoreTask');
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
        select: 'title description priority deadline createdBy attachments'
      })
      .populate({
        path: 'storeTaskId',
        select: 'status acceptedAt startedAt',
        populate: {
          path: 'storeId',
          select: 'Name Map_Address Phone'
        }
      })
      .populate({
        path: 'employeeId',
        select: 'FullName Phone Email'
      });
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Verify this task belongs to the current employee
    if (userTask.employeeId._id.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only view your own tasks', 403);
    }
    
    // Get stats
    const stats = userTask.getStats();
    
    return sendSuccess(res, 'Task fetched successfully', {
      task: userTask,
      stats
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
    
    return sendSuccess(res, 'Task submitted successfully', {
      task: userTask,
      stats: userTask.getStats()
    });
  } catch (error) {
    console.error('submitTask error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getMyTasks,
  getTaskById,
  updateChecklist,
  uploadEvidence,
  submitTask
};
