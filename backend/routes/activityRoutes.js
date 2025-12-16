import express from 'express';
import {
  getActivityLog,
  getRecentActivity,
  getUserActivity,
  getProjectActivity,
} from '../controllers/activityController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// All activity log routes require admin or manager role
router.use(authorize(['admin', 'manager']));

// Get all activity logs with filters
router.get('/', getActivityLog);

// Get recent activity (for dashboard)
router.get('/recent', getRecentActivity);

// Get user-specific activity
router.get('/user/:userId', getUserActivity);

// Get project-specific activity
router.get('/project/:projectId', getProjectActivity);

export default router;