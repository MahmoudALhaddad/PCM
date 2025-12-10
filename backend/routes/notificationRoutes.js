import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

// faisal - Get all notifications for current user
router.get('/', authenticateToken, getNotifications);

// faisal - Mark specific notifications as read
router.post('/mark-read', authenticateToken, markNotificationsRead);

// faisal - Mark all notifications as read
router.post('/mark-all-read', authenticateToken, markAllNotificationsRead);

export default router;
