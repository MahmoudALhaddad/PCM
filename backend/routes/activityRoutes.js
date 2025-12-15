import express from 'express';
import {
  getActivityLog,
  getRecentActivity,
  getUserActivity,
  getProjectActivity,
} from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all activity logs with filters
router.get('/', getActivityLog);

// Get recent activity (for dashboard)
router.get('/recent', getRecentActivity);

// Get user-specific activity
router.get('/user/:userId', getUserActivity);

// Get project-specific activity
router.get('/project/:projectId', getProjectActivity);

export default router;
