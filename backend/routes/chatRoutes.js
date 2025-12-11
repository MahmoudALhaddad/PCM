import express from 'express';
import { getChatHistory, getConversations, searchUsers } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get chat history with a specific user
router.get('/history', authenticateToken, getChatHistory);

// Get all conversations
router.get('/conversations', authenticateToken, getConversations);

// Search users
router.get('/search-users', authenticateToken, searchUsers);

export default router;
