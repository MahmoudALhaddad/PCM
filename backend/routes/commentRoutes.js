const express = require('express');
const router = express.Router();
const {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} = require('../controllers/commentsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get task comments
router.get('/task/:taskId', authenticateToken, getTaskComments);

// Create comment
router.post('/', authenticateToken, createComment);

// Update comment
router.put('/:id', authenticateToken, updateComment);

// Delete comment
router.delete('/:id', authenticateToken, deleteComment);

module.exports = router;
