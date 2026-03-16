/**
 * StoreTask Controller
 * Handles StoreTask management endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const StoreTask = require('../models/StoreTask');
const Broadcast = require('../models/Broadcast');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getEmployeeRole } = require('../helpers/authHelper');

/**
 * @route   GET /api/store-tasks
 * @desc    Get all store tasks with filtering
 * @access  Private (admin, manager)
 * @query   {string} status - Filter by status
 * @query   {string} broadcastId - Filter by broadcast
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @note    Manager can only see their own store's tasks
 */
const getStoreTasks = async (req, res) => {
  try {
    const { status, broadcastId, page = 1, limit = 20 } = req.query;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    // Build filter
    const filter = {};
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by broadcast
    if (broadcastId) {
      filter.broadcastId = broadcastId;
    }
    
    // Manager can only see their own store's tasks
    if (currentUserRole === 'manager') {
      filter.storeId = currentUser.ID_Branch;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Count total documents
    const total = await StoreTask.countDocuments(filter);
    
    // Fetch store tasks
    const storeTasks = await StoreTask.find(filter)
      .populate('broadcastId', 'title description priority deadline status')
      .populate('storeId', 'Name Map_Address Phone')
      .populate('managerId', 'FullName Phone Email')
      .populate('assignedEmployees', 'FullName Phone')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return sendSuccess(res, 'Store tasks fetched successfully', {
      storeTasks,
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
    console.error('getStoreTasks error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/store-tasks/:id
 * @desc    Get store task by ID
 * @access  Private (admin, manager)
 * @note    Manager can only see their own store's tasks
 */
const getStoreTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    const storeTask = await StoreTask.findById(id)
      .populate('broadcastId')
      .populate('storeId', 'Name Map_Address Phone')
      .populate('managerId', 'FullName Phone Email')
      .populate('assignedEmployees', 'FullName Phone Email')
      .select('-__v');
    
    if (!storeTask) {
      return sendError(res, 'Store task not found', 404);
    }
    
    // Manager can only view their own store's tasks
    if (currentUserRole === 'manager') {
      if (storeTask.storeId._id.toString() !== currentUser.ID_Branch.toString()) {
        return sendError(res, 'You can only view tasks of your own store', 403);
      }
    }
    
    // Get statistics
    const stats = await storeTask.getStats();
    
    // Check if overdue
    const isOverdue = await storeTask.isOverdue();
    
    return sendSuccess(res, 'Store task fetched successfully', {
      storeTask,
      stats,
      isOverdue
    });
  } catch (error) {
    console.error('getStoreTaskById error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/store-tasks/:id/accept
 * @desc    Accept a store task
 * @access  Private (manager only)
 * @note    Only manager of the store can accept
 */
const acceptStoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    // Find store task
    const storeTask = await StoreTask.findById(id)
      .populate('broadcastId', 'title deadline')
      .populate('storeId', 'Name');
    
    if (!storeTask) {
      return sendError(res, 'Store task not found', 404);
    }
    
    // Verify this is the manager of the store
    if (storeTask.managerId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'Only the assigned manager can accept this task', 403);
    }
    
    // Check if can accept
    const canAcceptResult = storeTask.canAccept();
    if (!canAcceptResult.canAccept) {
      return sendError(res, canAcceptResult.reason, 400);
    }
    
    // Update status to accepted
    storeTask.status = 'accepted';
    storeTask.acceptedAt = new Date();
    await storeTask.save();
    
    // Populate for response
    await storeTask.populate([
      { path: 'managerId', select: 'FullName Phone Email' },
      { path: 'storeId', select: 'Name Map_Address Phone' }
    ]);
    
    return sendSuccess(res, 'Store task accepted successfully', { storeTask });
  } catch (error) {
    console.error('acceptStoreTask error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   PUT /api/store-tasks/:id/reject
 * @desc    Reject a store task
 * @access  Private (manager only)
 * @body    {string} rejectedReason - Reason for rejection (required)
 * @note    Only manager of the store can reject
 */
const rejectStoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    // Validate rejectedReason
    if (!rejectedReason || rejectedReason.trim() === '') {
      return sendError(res, 'Rejection reason is required', 400);
    }
    
    // Find store task
    const storeTask = await StoreTask.findById(id)
      .populate('broadcastId', 'title deadline')
      .populate('storeId', 'Name');
    
    if (!storeTask) {
      return sendError(res, 'Store task not found', 404);
    }
    
    // Verify this is the manager of the store
    if (storeTask.managerId.toString() !== currentUser._id.toString()) {
      return sendError(res, 'Only the assigned manager can reject this task', 403);
    }
    
    // Check if can reject
    const canRejectResult = storeTask.canReject();
    if (!canRejectResult.canReject) {
      return sendError(res, canRejectResult.reason, 400);
    }
    
    // Update status to rejected
    storeTask.status = 'rejected';
    storeTask.rejectedReason = rejectedReason.trim();
    storeTask.rejectedAt = new Date();
    await storeTask.save();
    
    // Populate for response
    await storeTask.populate([
      { path: 'managerId', select: 'FullName Phone Email' },
      { path: 'storeId', select: 'Name Map_Address Phone' }
    ]);
    
    return sendSuccess(res, 'Store task rejected successfully', { storeTask });
  } catch (error) {
    console.error('rejectStoreTask error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getStoreTasks,
  getStoreTaskById,
  acceptStoreTask,
  rejectStoreTask
};
