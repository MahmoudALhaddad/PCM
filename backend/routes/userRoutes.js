const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getUserProfile, getUsersByRole } = require('../controllers/usersController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

// Get current user profile
router.get('/profile', authenticateToken, getUserProfile);

// Get users by role
router.get('/role/:role', authenticateToken, authorize(['admin', 'manager']), getUsersByRole);

// Admin routes
router.get('/', authenticateToken, authorize(['admin']), getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, authorize(['admin']), deleteUser);

module.exports = router;
