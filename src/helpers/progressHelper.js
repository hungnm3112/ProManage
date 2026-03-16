/**
 * Progress Helper
 * Functions for calculating task completion progress
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const UserTask = require('../models/UserTask');
const StoreTask = require('../models/StoreTask');

/**
 * Calculate progress for a UserTask
 * @param {Object} userTask - UserTask document
 * @returns {Object} Progress information
 */
function calculateUserTaskProgress(userTask) {
  if (!userTask.checklist || userTask.checklist.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      requiredItems: 0,
      completedRequiredItems: 0,
      progress: 0,
      isComplete: false
    };
  }

  const totalItems = userTask.checklist.length;
  const completedItems = userTask.checklist.filter(item => item.isCompleted).length;
  const requiredItems = userTask.checklist.filter(item => item.required).length;
  const completedRequiredItems = userTask.checklist.filter(
    item => item.required && item.isCompleted
  ).length;

  const progress = Math.round((completedItems / totalItems) * 100);
  const isComplete = requiredItems === 0 || completedRequiredItems === requiredItems;

  return {
    totalItems,
    completedItems,
    requiredItems,
    completedRequiredItems,
    progress,
    isComplete
  };
}

/**
 * Calculate progress for a StoreTask
 * @param {ObjectId} storeTaskId - StoreTask ID
 * @returns {Promise<Object>} Progress information
 */
async function calculateStoreTaskProgress(storeTaskId) {
  try {
    // Get all user tasks for this store task
    const userTasks = await UserTask.find({ storeTaskId });

    if (userTasks.length === 0) {
      return {
        totalEmployees: 0,
        assigned: 0,
        in_progress: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        completionRate: 0,
        status: 'not_started'
      };
    }

    const statusCounts = {
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    };

    userTasks.forEach(task => {
      if (statusCounts.hasOwnProperty(task.status)) {
        statusCounts[task.status]++;
      }
    });

    const completionRate = Math.round((statusCounts.approved / userTasks.length) * 100);

    // Determine overall status
    let status = 'not_started';
    if (statusCounts.approved === userTasks.length) {
      status = 'completed';
    } else if (statusCounts.approved > 0 || statusCounts.submitted > 0 || statusCounts.in_progress > 0) {
      status = 'in_progress';
    } else if (statusCounts.assigned > 0) {
      status = 'assigned';
    }

    return {
      totalEmployees: userTasks.length,
      ...statusCounts,
      completionRate,
      status
    };
  } catch (error) {
    console.error('calculateStoreTaskProgress error:', error);
    return {
      totalEmployees: 0,
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      completionRate: 0,
      status: 'error'
    };
  }
}

/**
 * Calculate progress for a Broadcast
 * @param {ObjectId} broadcastId - Broadcast ID
 * @returns {Promise<Object>} Progress information
 */
async function calculateBroadcastProgress(broadcastId) {
  try {
    // Get all store tasks for this broadcast
    const storeTasks = await StoreTask.find({ broadcastId });

    if (storeTasks.length === 0) {
      return {
        totalStores: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        in_progress: 0,
        completed: 0,
        completionRate: 0,
        status: 'not_started'
      };
    }

    const statusCounts = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      in_progress: 0,
      completed: 0
    };

    storeTasks.forEach(task => {
      if (statusCounts.hasOwnProperty(task.status)) {
        statusCounts[task.status]++;
      }
    });

    const completionRate = Math.round((statusCounts.completed / storeTasks.length) * 100);

    // Determine overall status
    let status = 'not_started';
    if (statusCounts.completed === storeTasks.length) {
      status = 'completed';
    } else if (statusCounts.rejected === storeTasks.length) {
      status = 'all_rejected';
    } else if (statusCounts.completed > 0 || statusCounts.in_progress > 0 || statusCounts.accepted > 0) {
      status = 'in_progress';
    } else if (statusCounts.pending > 0) {
      status = 'pending';
    } else if (statusCounts.rejected > 0) {
      status = 'partially_rejected';
    }

    return {
      totalStores: storeTasks.length,
      ...statusCounts,
      completionRate,
      status
    };
  } catch (error) {
    console.error('calculateBroadcastProgress error:', error);
    return {
      totalStores: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      in_progress: 0,
      completed: 0,
      completionRate: 0,
      status: 'error'
    };
  }
}

module.exports = {
  calculateUserTaskProgress,
  calculateStoreTaskProgress,
  calculateBroadcastProgress
};
