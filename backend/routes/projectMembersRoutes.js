const express = require('express');
const router = express.Router();
const { addProjectMember, getProjectMembers, removeProjectMember } = require('../controllers/projectMembersController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get project members
router.get('/:projectId', authenticateToken, getProjectMembers);

// Add member to project
router.post('/', authenticateToken, addProjectMember);

// Remove member from project
router.delete('/:projectId/:userId', authenticateToken, removeProjectMember);

module.exports = router;
