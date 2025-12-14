import express from 'express';
import { getChatHistory, getConversations, searchUsers, markMessagesAsRead } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get chat history with a specific user
router.get('/history', authenticateToken, getChatHistory);

// Get all conversations
router.get('/conversations', authenticateToken, getConversations);

// Search users
router.get('/search-users', authenticateToken, searchUsers);

// faisal - Mark messages as read
router.post('/mark-read', authenticateToken, (req, res) => {
  // Get io instance from app
  const io = req.app.get('io');
  markMessagesAsRead(req, res, io, req.userId);
});

export default router;
