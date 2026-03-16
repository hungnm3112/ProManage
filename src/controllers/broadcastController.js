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

/**
 * @route   POST /api/broadcasts
 * @desc    Create a new broadcast (draft status)
 * @access  Private (admin only)
 */
const createBroadcast = async (req, res) => {
  try {
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
    
    await broadcast.save();
    
    // Populate creator and stores
    await broadcast.populate([
      { path: 'createdBy', select: 'FullName Phone Email' },
      { path: 'assignedStores', select: 'Name Map_Address Phone' }
    ]);
    
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
    
    // Check if can edit
    const canEditResult = broadcast.canEdit();
    if (!canEditResult.canEdit) {
      return sendError(res, canEditResult.reason, 400);
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
    
    // TODO: Create notifications for managers (will be implemented later)
    
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

module.exports = {
  createBroadcast,
  getBroadcasts,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  publishBroadcast
};
