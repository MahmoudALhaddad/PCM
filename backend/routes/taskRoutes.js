import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pool from '../config/database.js'; 

import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask, 
} from '../controllers/tasksController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Multer setup for file uploads ---
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { taskId } = req.params;

    // Fetch task info including project name and assigned employee
    const taskRes = await pool.query(
      `SELECT t.id AS task_id, p.name AS project_name, u.name AS assigned_employee
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN task_members tm ON tm.task_id = t.id
       LEFT JOIN users u ON u.id = tm.user_id
       WHERE t.id = $1
       LIMIT 1`,
      [taskId]
    );

    if (taskRes.rows.length === 0) return cb(new Error('Task not found'));

    const { project_name, assigned_employee } = taskRes.rows[0];

    const safeProjectName = project_name.replace(/\s+/g, '_');
    const safeEmployeeName = (assigned_employee || 'unassigned').replace(/\s+/g, '_');

    const dir = path.join('uploads', `project_${safeProjectName}`, `task_${safeEmployeeName}`);
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });


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


// --- New route for file upload ---
router.put('/:taskId/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ message: 'File uploaded successfully', path: req.file.path });
});

export default router;  