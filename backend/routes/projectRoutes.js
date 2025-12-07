const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getUserProjects,
  getProjectsByStatus,
} = require('../controllers/projectsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get user projects
router.get('/user/my-projects', authenticateToken, getUserProjects);

// Get projects by status
router.get('/status/:status', authenticateToken, getProjectsByStatus);

// Get all projects
router.get('/', authenticateToken, getAllProjects);

// Get project by ID
router.get('/:id', authenticateToken, getProjectById);

// Create project
router.post('/', authenticateToken, createProject);

// Update project
router.put('/:id', authenticateToken, updateProject);

// Delete project
router.delete('/:id', authenticateToken, deleteProject);

module.exports = router;
