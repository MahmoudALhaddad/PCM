const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user notifications
router.get('/', authenticateToken, getUserNotifications);

// Create notification
router.post('/', authenticateToken, createNotification);

// Mark all as read
router.put('/read-all', authenticateToken, markAllNotificationsAsRead);

// Mark notification as read
router.put('/:id/read', authenticateToken, markNotificationAsRead);

// Delete notification
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;
