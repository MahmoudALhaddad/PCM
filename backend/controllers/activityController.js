import { getActivityLogs, getActivityCount } from '../utils/activityLogger.js';

/**
 * Get activity logs with pagination and filters
 */
export const getActivityLog = async (req, res) => {
  try {
    const { userId, projectId, taskId, limit = 50, offset = 0 } = req.query;
    
    const filters = {
      userId: userId ? parseInt(userId) : undefined,
      projectId: projectId ? parseInt(projectId) : undefined,
      taskId: taskId ? parseInt(taskId) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
    
    const [logs, total] = await Promise.all([
      getActivityLogs(filters),
      getActivityCount(filters),
    ]);
    
    res.json({
      logs,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

/**
 * Get recent activity summary (for dashboard widgets)
 */
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const logs = await getActivityLogs({ limit, offset: 0 });
    
    res.json(logs);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

/**
 * Get user-specific activity
 */
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const [logs, total] = await Promise.all([
      getActivityLogs({ userId: parseInt(userId), limit, offset }),
      getActivityCount({ userId: parseInt(userId) }),
    ]);
    
    res.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

/**
 * Get project-specific activity
 */
export const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const [logs, total] = await Promise.all([
      getActivityLogs({ projectId: parseInt(projectId), limit, offset }),
      getActivityCount({ projectId: parseInt(projectId) }),
    ]);
    
    res.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Get project activity error:', error);
    res.status(500).json({ error: 'Failed to fetch project activity' });
  }
};
