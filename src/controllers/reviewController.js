/**
 * Review Controller
 * Handles manager review and approval of employee tasks
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const UserTask = require('../models/UserTask');
const StoreTask = require('../models/StoreTask');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const notificationService = require('../services/notificationService');

/**
 * @route   GET /api/reviews/pending
 * @desc    Get all pending reviews (submitted user tasks)
 * @access  Private (manager)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @note    Manager only sees tasks from their own branch
 */
const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const currentUser = req.user;
    
    // Get all store tasks managed by this manager
    const storeTasks = await StoreTask.find({ managerId: currentUser._id })
      .select('_id');
    
    const storeTaskIds = storeTasks.map(st => st._id);
    
    // Build filter for submitted user tasks
    const filter = {
      storeTaskId: { $in: storeTaskIds },
      status: 'submitted'
    };
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get pending reviews
    const userTasks = await UserTask.find(filter)
      .populate({
        path: 'employeeId',
        select: 'FullName Phone Email'
      })
      .populate({
        path: 'broadcastId',
        select: 'title priority deadline'
      })
      .populate({
        path: 'storeTaskId',
        select: 'status',
        populate: {
          path: 'storeId',
          select: 'Name'
        }
      })
      .sort({ submittedAt: 1 }) // Oldest first
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await UserTask.countDocuments(filter);
    
    // Format response with stats
    const tasksWithStats = userTasks.map(task => ({
      ...task.toObject(),
      stats: task.getStats()
    }));
    
    return sendSuccess(res, 'Pending reviews fetched successfully', {
      reviews: tasksWithStats,
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
    console.error('getPendingReviews error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/reviews/:taskId/approve
 * @desc    Approve an employee task
 * @access  Private (manager)
 * @body    {number} rating - Rating 1-5
 * @body    {string} reviewNote - Optional review note
 */
const approveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { rating, reviewNote } = req.body;
    const currentUser = req.user;
    
    // Find user task
    const userTask = await UserTask.findById(taskId)
      .populate('storeTaskId')
      .populate('employeeId', 'FullName Phone Email');
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Verify this task belongs to a store managed by this manager
    if (userTask.storeTaskId.managerId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only review tasks from your own store', 403);
    }
    
    // Check if task can be reviewed
    if (!userTask.canReview()) {
      return sendError(res, 'Task is not in submitted status', 400);
    }
    
    // Update user task
    userTask.status = 'approved';
    userTask.rating = rating;
    userTask.reviewNote = reviewNote ? reviewNote.trim() : '';
    userTask.reviewedAt = new Date();
    
    await userTask.save();
    
    // Check if all user tasks for this store task are approved
    await checkStoreTaskCompletion(userTask.storeTaskId._id);
    
    // Notify employee about approval
    await notificationService.notifyTaskApproved(
      userTask.employeeId._id,
      userTask,
      rating
    );
    
    return sendSuccess(res, 'Task approved successfully', {
      task: userTask,
      stats: userTask.getStats()
    });
  } catch (error) {
    console.error('approveTask error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/reviews/:taskId/reject
 * @desc    Reject an employee task
 * @access  Private (manager)
 * @body    {string} reviewNote - Required review note explaining rejection
 */
const rejectTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reviewNote } = req.body;
    const currentUser = req.user;
    
    // Validate review note
    if (!reviewNote || reviewNote.trim() === '') {
      return sendError(res, 'Review note is required when rejecting a task', 400);
    }
    
    // Find user task
    const userTask = await UserTask.findById(taskId)
      .populate('storeTaskId')
      .populate('employeeId', 'FullName Phone Email');
    
    if (!userTask) {
      return sendError(res, 'Task not found', 404);
    }
    
    // Verify this task belongs to a store managed by this manager
    if (userTask.storeTaskId.managerId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'You can only review tasks from your own store', 403);
    }
    
    // Check if task can be reviewed
    if (!userTask.canReview()) {
      return sendError(res, 'Task is not in submitted status', 400);
    }
    
    // Update user task
    userTask.status = 'rejected';
    userTask.reviewNote = reviewNote.trim();
    userTask.reviewedAt = new Date();
    
    await userTask.save();
    
    // Notify employee about rejection
    await notificationService.notifyTaskRejected(
      userTask.employeeId._id,
      userTask
    );
    
    return sendSuccess(res, 'Task rejected successfully', {
      task: userTask,
      stats: userTask.getStats()
    });
  } catch (error) {
    console.error('rejectTask error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Helper function: Check and update StoreTask completion status
 * @param {ObjectId} storeTaskId - ID of the store task
 */
async function checkStoreTaskCompletion(storeTaskId) {
  try {
    // Get all user tasks for this store task
    const userTasks = await UserTask.find({ storeTaskId });
    
    if (userTasks.length === 0) {
      return;
    }
    
    // Check if all are approved
    const allApproved = userTasks.every(task => task.status === 'approved');
    
    if (allApproved) {
      // Update store task to completed
      const storeTask = await StoreTask.findById(storeTaskId);
      if (storeTask && storeTask.status !== 'completed') {
        storeTask.status = 'completed';
        storeTask.completedAt = new Date();
        
        // Calculate completion rate
        const approvedCount = userTasks.filter(t => t.status === 'approved').length;
        storeTask.completionRate = Math.round((approvedCount / userTasks.length) * 100);
        
        await storeTask.save();
        
        console.log(`StoreTask ${storeTaskId} automatically marked as completed`);
      }
    } else {
      // Update completion rate
      const approvedCount = userTasks.filter(t => t.status === 'approved').length;
      const storeTask = await StoreTask.findById(storeTaskId);
      if (storeTask) {
        storeTask.completionRate = Math.round((approvedCount / userTasks.length) * 100);
        await storeTask.save();
      }
    }
  } catch (error) {
    console.error('checkStoreTaskCompletion error:', error);
  }
}

module.exports = {
  getPendingReviews,
  approveTask,
  rejectTask,
  checkStoreTaskCompletion
};
