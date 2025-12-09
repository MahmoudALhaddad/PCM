import express from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask, 
} from '../controllers/tasksController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all tasks (authenticated users) fay sooooooooooolllllllllllllll 
router.get('/', authenticateToken, getTasks);

// Create task (manager/admin only)
router.post('/', authenticateToken, authorize(['admin', 'manager']), createTask);

// Get task by ID
router.get('/:id', authenticateToken, getTaskById);

// Update task
router.put('/:id', authenticateToken, updateTask); 

// Delete task (manager/admin only)
router.delete('/:id', authenticateToken, authorize(['admin', 'manager']), deleteTask);

export default router;  