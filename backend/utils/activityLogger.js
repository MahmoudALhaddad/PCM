import pool from '../config/database.js';

/**
 * Log user activity to the database
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Description of the action performed
 * @param {object} options - Optional project_id, task_id, or other metadata
 */
export const logActivity = async (userId, action, options = {}) => {
  try {
    const { projectId = null, taskId = null } = options;
    
    await pool.query(
      `INSERT INTO activity_log (user_id, project_id, task_id, action, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, projectId, taskId, action]
    );
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
};

/**
 * Get activity logs with optional filters
 * @param {object} filters - userId, projectId, taskId, limit, offset
 * @returns {Array} Activity log entries with user details
 */
export const getActivityLogs = async (filters = {}) => {
  try {
    const { userId, projectId, taskId, userName, projectName, taskTitle, limit = 50, offset = 0 } = filters;
    
    const conditions = [];
    const params = [];
    
    if (userId !== undefined) {
      params.push(userId);
      conditions.push(`al.user_id = $${params.length}`);
    }
    
    if (projectId !== undefined) {
      params.push(projectId);
      conditions.push(`al.project_id = $${params.length}`);
    }
    
    if (taskId !== undefined) {
      params.push(taskId);
      conditions.push(`al.task_id = $${params.length}`);
    }
    
    if (userName !== undefined) {
      params.push(`%${userName}%`);
      conditions.push(`u.name ILIKE $${params.length}`);
    }
    
    if (projectName !== undefined) {
      params.push(`%${projectName}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }
    
    if (taskTitle !== undefined) {
      params.push(`%${taskTitle}%`);
      conditions.push(`t.title ILIKE $${params.length}`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);
    const limitOffset = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const query = `SELECT 
        al.id, 
        al.action, 
        al.created_at,
        al.project_id,
        al.task_id,
        u.id as user_id,
        u.name as user_name,
        u.role as user_role,
        p.name as project_name,
        t.title as task_title
       FROM activity_log al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN projects p ON p.id = al.project_id
       LEFT JOIN tasks t ON t.id = al.task_id
       ${whereClause}
       ORDER BY al.created_at DESC
       ${limitOffset}`;
    
    console.log('Activity Query:', query);
    console.log('Params:', params);
    
    const result = await pool.query(query, params);
    
    return result.rows;
  } catch (error) {
    console.error('Get activity logs error:', error);
    throw error;
  }
};

/**
 * Get activity count for statistics
 */
export const getActivityCount = async (filters = {}) => {
  try {
    const { userId, projectId, taskId, userName, projectName, taskTitle } = filters;
    
    const conditions = [];
    const params = [];
    
    if (userId !== undefined) {
      params.push(userId);
      conditions.push(`al.user_id = $${params.length}`);
    }
    
    if (projectId !== undefined) {
      params.push(projectId);
      conditions.push(`al.project_id = $${params.length}`);
    }
    
    if (taskId !== undefined) {
      params.push(taskId);
      conditions.push(`al.task_id = $${params.length}`);
    }
    
    if (userName !== undefined) {
      params.push(`%${userName}%`);
      conditions.push(`u.name ILIKE $${params.length}`);
    }
    
    if (projectName !== undefined) {
      params.push(`%${projectName}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }
    
    if (taskTitle !== undefined) {
      params.push(`%${taskTitle}%`);
      conditions.push(`t.title ILIKE $${params.length}`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM activity_log al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN projects p ON p.id = al.project_id
       LEFT JOIN tasks t ON t.id = al.task_id
       ${whereClause}`;
    
    console.log('Count Query:', countQuery);
    console.log('Count Params:', params);
    
    const result = await pool.query(countQuery, params);
    
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Get activity count error:', error);
    throw error;
  }
};