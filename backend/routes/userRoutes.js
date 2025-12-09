import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile,
  getUsersByRole,
  createUser, // <-- import this
} from '../controllers/usersController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, getUserProfile);

// Get users by role
router.get('/role/:role', authenticateToken, authorize(['admin', 'manager']), getUsersByRole);

// Admin routes
router.get('/', authenticateToken, authorize(['admin']), getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, authorize(['admin']), deleteUser);

// Admin creates a new user
router.post('/', authenticateToken, authorize(['admin']), createUser); // <-- Add this

export default router;