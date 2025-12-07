const pool = require('../config/database');

// Get activity log
const getActivityLog = async (req, res) => {
  try {
    const { projectId, taskId, limit = 50, offset = 0 } = req.query;

    let query = `SELECT al.id, al.action, al.created_at, u.name as user_name, 
                        p.name as project_name, t.title as task_title
                 FROM activity_log al
                 LEFT JOIN users u ON al.user_id = u.id
                 LEFT JOIN projects p ON al.project_id = p.id
                 LEFT JOIN tasks t ON al.task_id = t.id
                 WHERE 1=1`;
    const params = [];

    if (projectId) {
      query += ' AND al.project_id = $' + (params.length + 1);
      params.push(projectId);
    }

    if (taskId) {
      query += ' AND al.task_id = $' + (params.length + 1);
      params.push(taskId);
    }

    query += ' ORDER BY al.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

// Log activity
const logActivity = async (req, res) => {
  try {
    const { userId, projectId, taskId, action } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const result = await pool.query(
      `INSERT INTO activity_log (user_id, project_id, task_id, action)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, project_id, task_id, action, created_at`,
      [userId, projectId, taskId, action]
    );

    res.status(201).json({
      message: 'Activity logged',
      log: result.rows[0],
    });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
};

module.exports = {
  getActivityLog,
  logActivity,
};
