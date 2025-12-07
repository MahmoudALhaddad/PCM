const express = require('express');
const router = express.Router();
const { getActivityLog, logActivity } = require('../controllers/activityLogController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get activity log
router.get('/', authenticateToken, getActivityLog);

// Log activity
router.post('/', authenticateToken, logActivity);

module.exports = router;
