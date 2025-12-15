import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasksController.js';

import {
  prepareTaskUpload,
  taskFilesUpload,
  uploadTaskFile,
} from '../controllers/fileManagerController.js';

import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticateToken, getTasks);

// Create task
router.post('/', authenticateToken, authorize(['admin', 'manager']), createTask);

// Get task by ID
router.get('/:id', authenticateToken, getTaskById);

// Update task
router.put('/:id', authenticateToken, updateTask);

// Delete task
router.delete('/:id', authenticateToken, authorize(['admin', 'manager']), deleteTask);

// ✅ TASK FILE SUBMISSION (EMPLOYEE)
router.put(
  '/:taskId/upload',
  authenticateToken,
  prepareTaskUpload,
  taskFilesUpload.single('file'),
  uploadTaskFile
);

export default router;
