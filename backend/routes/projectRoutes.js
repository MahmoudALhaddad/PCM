import express from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
  getProjectsWithTasks,
  getProjectMembers,
} from '../controllers/projectsController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all projects with tasks
router.get('/with-tasks', authenticateToken, getProjectsWithTasks);

// Get all projects
router.get('/', authenticateToken, getProjects);

// Create project (manager/admin only)
router.post('/', authenticateToken, authorize(['admin', 'manager']), createProject);

// Get single project
router.get('/:id', authenticateToken, getProjectById);

// ✅ Get members of a project (correct route)
router.get('/:projectId/members', authenticateToken, getProjectMembers);

// Update project
router.put('/:id', authenticateToken, updateProject);

// Delete project (admin only)
router.delete('/:id', authenticateToken, authorize(['admin']), deleteProject);

export default router;
