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
import {
  listProjectFiles,
  uploadProjectFile,
  uploadTaskFile,
  downloadFile,
  deleteFile,
  projectFilesUpload,
  taskFilesUpload,
  prepareTaskUpload,
} from '../controllers/fileManagerController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ---------------------
// Project routes
// ---------------------

// Get all projects with tasks
router.get('/with-tasks', authenticateToken, getProjectsWithTasks);

// Get all projects
router.get('/', authenticateToken, getProjects);

// Create project (manager/admin only)
router.post('/', authenticateToken, authorize(['admin', 'manager']), createProject);

// Get members of a project
router.get('/:projectId/members', authenticateToken, getProjectMembers);

// Get single project
router.get('/:id', authenticateToken, getProjectById);

// Update project
router.put('/:id', authenticateToken, updateProject);

// Delete project (admin only)
router.delete('/:id', authenticateToken, authorize(['admin']), deleteProject);

// ---------------------
// File management routes
// ---------------------

// Download a file (specific file)
router.get(
  '/:projectId/files/:folder/:fileName',
  authenticateToken,
  downloadFile
);

// List all files for a project
router.get('/:projectId/files', authenticateToken, listProjectFiles);

// Upload project files (admin or manager if you want)
router.post(
  '/:projectId/project_files/upload',
  authenticateToken,
  projectFilesUpload.single('file'),
  uploadProjectFile
);

// Upload task submission (employees)
router.put(
  '/:projectId/task_submissions/upload',
  authenticateToken,
  prepareTaskUpload,
  taskFilesUpload.single('file'),
  uploadTaskFile
);

// Delete a file (admin only)
router.delete(
  '/:projectId/files/:folder/:fileName',
  authenticateToken,
  authorize(['admin']),
  deleteFile
);

export default router;
