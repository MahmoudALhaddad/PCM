import express from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
  getProjectsWithTasks,
} from '../controllers/projectsController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all projects with tasks (authenticated users)
router.get('/with-tasks', authenticateToken, getProjectsWithTasks);

// Get all projects (authenticated users)
router.get('/', authenticateToken, getProjects);

// Create project (manager/admin only)
router.post('/', authenticateToken, authorize(['admin', 'manager']), createProject);

// Get project by ID
router.get('/:id', authenticateToken, getProjectById);

// Update project
router.put('/:id', authenticateToken, updateProject);

// Delete project (admin only)
router.delete('/:id', authenticateToken, authorize(['admin']), deleteProject);

export default router;
