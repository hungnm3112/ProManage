/**
 * Notification Service
 * Handles creation and management of notifications
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const Notification = require('../models/Notification');

/**
 * Create a notification for a single user
 * @param {ObjectId} userId - User to notify
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Related data (broadcastId, storeTaskId, etc.)
 * @returns {Promise<Notification>}
 */
async function createNotification(userId, type, title, message, data = {}) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      isRead: false
    });

    console.log(`Notification created for user ${userId}: ${type}`);
    return notification;
  } catch (error) {
    console.error('createNotification error:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * @param {Array<ObjectId>} userIds - Users to notify
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Related data
 * @returns {Promise<Array<Notification>>}
 */
async function sendToMultiple(userIds, type, title, message, data = {}) {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      data,
      isRead: false
    }));

    const created = await Notification.insertMany(notifications);
    console.log(`${created.length} notifications created for type: ${type}`);
    return created;
  } catch (error) {
    console.error('sendToMultiple error:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {ObjectId} notificationId - Notification ID
 * @returns {Promise<Notification>}
 */
async function markAsRead(notificationId) {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification.markAsRead();
  } catch (error) {
    console.error('markAsRead error:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>}
 */
async function markAllAsRead(userId) {
  try {
    const result = await Notification.markAllAsRead(userId);
    console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
    return result;
  } catch (error) {
    console.error('markAllAsRead error:', error);
    throw error;
  }
}

/**
 * Get unread count for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Number>}
 */
async function getUnreadCount(userId) {
  try {
    return await Notification.getUnreadCount(userId);
  } catch (error) {
    console.error('getUnreadCount error:', error);
    throw error;
  }
}

/**
 * Notification helper functions for specific events
 */

/**
 * Notify managers when broadcast is published
 * @param {Array<ObjectId>} managerIds - Manager IDs
 * @param {Object} broadcast - Broadcast object
 */
async function notifyBroadcastPublished(managerIds, broadcast) {
  const title = 'New Broadcast Published';
  const message = `A new broadcast "${broadcast.title}" has been assigned to your store. Deadline: ${new Date(broadcast.deadline).toLocaleDateString()}`;
  const data = { broadcastId: broadcast._id };

  return sendToMultiple(managerIds, 'broadcast_published', title, message, data);
}

/**
 * Notify manager when store task is created
 * @param {ObjectId} managerId - Manager ID
 * @param {Object} storeTask - StoreTask object
 * @param {Object} broadcast - Broadcast object
 */
async function notifyStoreTaskCreated(managerId, storeTask, broadcast) {
  const title = 'New Task Assigned';
  const message = `You have a new task: "${broadcast.title}". Please review and assign to your employees.`;
  const data = { 
    storeTaskId: storeTask._id,
    broadcastId: broadcast._id
  };

  return createNotification(managerId, 'store_task_created', title, message, data);
}

/**
 * Notify employee when task is assigned
 * @param {ObjectId} employeeId - Employee ID
 * @param {Object} userTask - UserTask object
 * @param {Object} broadcast - Broadcast object
 */
async function notifyTaskAssigned(employeeId, userTask, broadcast) {
  const title = 'Task Assigned to You';
  const message = `You have been assigned a new task: "${broadcast.title}". Deadline: ${new Date(broadcast.deadline).toLocaleDateString()}`;
  const data = {
    userTaskId: userTask._id,
    broadcastId: broadcast._id,
    storeTaskId: userTask.storeTaskId
  };

  return createNotification(employeeId, 'task_assigned', title, message, data);
}

/**
 * Notify manager when employee submits task
 * @param {ObjectId} managerId - Manager ID
 * @param {Object} userTask - UserTask object
 * @param {Object} employee - Employee object
 */
async function notifyTaskSubmitted(managerId, userTask, employee) {
  const title = 'Task Submitted for Review';
  const message = `${employee.FullName} has submitted a task for your review.`;
  const data = {
    userTaskId: userTask._id,
    employeeId: employee._id,
    storeTaskId: userTask.storeTaskId
  };

  return createNotification(managerId, 'task_submitted', title, message, data);
}

/**
 * Notify employee when task is approved
 * @param {ObjectId} employeeId - Employee ID
 * @param {Object} userTask - UserTask object
 * @param {Number} rating - Rating given
 */
async function notifyTaskApproved(employeeId, userTask, rating) {
  const title = 'Task Approved!';
  const message = `Your task has been approved with a rating of ${rating}/5. ${userTask.reviewNote ? `Note: ${userTask.reviewNote}` : ''}`;
  const data = {
    userTaskId: userTask._id,
    storeTaskId: userTask.storeTaskId
  };

  return createNotification(employeeId, 'task_approved', title, message, data);
}

/**
 * Notify employee when task is rejected
 * @param {ObjectId} employeeId - Employee ID
 * @param {Object} userTask - UserTask object
 */
async function notifyTaskRejected(employeeId, userTask) {
  const title = 'Task Needs Revision';
  const message = `Your task has been rejected. ${userTask.reviewNote ? `Reason: ${userTask.reviewNote}` : 'Please review and resubmit.'}`;
  const data = {
    userTaskId: userTask._id,
    storeTaskId: userTask.storeTaskId
  };

  return createNotification(employeeId, 'task_rejected', title, message, data);
}

module.exports = {
  createNotification,
  sendToMultiple,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  
  // Helper functions
  notifyBroadcastPublished,
  notifyStoreTaskCreated,
  notifyTaskAssigned,
  notifyTaskSubmitted,
  notifyTaskApproved,
  notifyTaskRejected
};
