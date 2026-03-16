/**
 * Notification Routes
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * All notification routes require authentication
 */

// Get user's notifications (with pagination and filters)
router.get('/', authenticate, notificationController.getNotifications);

// Get unread count
router.get('/unread/count', authenticate, notificationController.getUnreadCount);

// Mark all notifications as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// Mark specific notification as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
