const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getProjectTasks,
  getMyTasks,
} = require('../controllers/tasksController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get my tasks
router.get('/user/my-tasks', authenticateToken, getMyTasks);

// Get project tasks
router.get('/project/:projectId', authenticateToken, getProjectTasks);

// Get all tasks
router.get('/', authenticateToken, getAllTasks);

// Get task by ID
router.get('/:id', authenticateToken, getTaskById);

// Create task
router.post('/', authenticateToken, createTask);

// Update task
router.put('/:id', authenticateToken, updateTask);

// Delete task
router.delete('/:id', authenticateToken, deleteTask);

module.exports = router;
