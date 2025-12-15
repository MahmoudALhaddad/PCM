import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  markChatNotificationsRead,
  markAllMessageNotificationsRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.post('/mark-read', authenticateToken, markNotificationsRead);
router.post('/mark-all-read', authenticateToken, markAllNotificationsRead);
router.post(
  "/mark-chat-read",
  authenticateToken,
  markChatNotificationsRead
);
router.post(
  "/mark-all-messages-read",
  authenticateToken,
  markAllMessageNotificationsRead
);

export default router;
