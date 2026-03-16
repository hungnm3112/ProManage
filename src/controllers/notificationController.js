/**
 * Notification Controller
 * Handles notification API endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications
 * Get notifications for current user
 * Query params: isRead (filter), page, limit
 */
exports.getNotifications = async (req, res) => {
  try {
    const currentUser = req.user;
    const { isRead, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { userId: currentUser._id };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get notifications
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('data.broadcastId', 'title')
        .populate('data.employeeId', 'FullName')
        .lean(),
      Notification.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

/**
 * GET /api/notifications/unread/count
 * Get count of unread notifications
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUser = req.user;

    const count = await notificationService.getUnreadCount(currentUser._id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const currentUser = req.user;
    const notificationId = req.params.id;

    // Get notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check ownership
    if (notification.userId.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own notifications as read'
      });
    }

    // Mark as read if not already
    if (!notification.isRead) {
      await notificationService.markAsRead(notificationId);
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const currentUser = req.user;

    const result = await notificationService.markAllAsRead(currentUser._id);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};
