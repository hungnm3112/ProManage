const mongoose = require('mongoose');

/**
 * Notification Schema
 * 
 * Stores notifications for users
 */

const notificationSchema = new mongoose.Schema({
  // User who receives the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },

  // Notification type
  type: {
    type: String,
    enum: [
      'broadcast_published',      // Admin published a broadcast
      'task_assigned',            // Manager assigned task to employee
      'task_submitted',           // Employee submitted task
      'task_approved',            // Manager approved task
      'task_rejected',            // Manager rejected task
      'store_task_created',       // Store task created for manager
      'deadline_reminder',        // Reminder for upcoming deadline
      'task_overdue'             // Task is overdue
    ],
    required: true,
    index: true
  },

  // Notification title
  title: {
    type: String,
    required: true,
    maxlength: 200
  },

  // Notification message
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Related data (IDs of related objects)
  data: {
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Broadcast'
    },
    storeTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreTask'
    },
    userTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserTask'
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  // Read timestamp
  readAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

/**
 * Method: markAsRead
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

/**
 * Static: markAllAsRead
 * Mark all notifications as read for a user
 */
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
};

/**
 * Static: getUnreadCount
 * Get count of unread notifications for a user
 */
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
