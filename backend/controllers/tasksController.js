import pool from '../config/database.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { logActivity } from '../utils/activityLogger.js';


// Multer storage setup
// Multer storage setup for employee submissions
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { taskId } = req.params;

    // Fetch project_id from DB
    const taskRes = await pool.query(
      `SELECT t.project_id, p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskRes.rows.length === 0) return cb(new Error('Task not found'));

    const projectName = taskRes.rows[0].project_name.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Correct folder: task_submissions (not employee_submissions)
    const dir = path.join('uploads', projectName, 'task_submissions');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${req.userSafeName || 'user'}_${Date.now()}_${safeName}`);
  }
});

export const upload = multer({ storage });

// Upload route
export const uploadTaskFile = async (req, res) => {
  const { taskId } = req.params;

  try {
    const hasAccess = await canAccessTask(taskId, req.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Insufficient permissions' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Optionally save file path in DB
    await pool.query(
      'INSERT INTO task_files (task_id, file_name, file_path, uploaded_by) VALUES ($1, $2, $3, $4)',
      [taskId, req.file.filename, req.file.path, req.userId]
    );

    res.json({ message: 'File uploaded successfully', path: req.file.path });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
};

const getUserRole = async (userId) => {
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.role;
};

const canAccessTask = async (taskId, userId) => {
  const role = await getUserRole(userId);
  if (role === 'admin' || role === 'manager') return true;

  const result = await pool.query(
    `SELECT 1 FROM tasks t
     LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $2
     LEFT JOIN task_members tm ON tm.task_id = t.id AND tm.user_id = $2
     WHERE t.id = $1 AND (tm.user_id IS NOT NULL OR pm.user_id IS NOT NULL OR t.created_by = $2)`,
    [taskId, userId]
  );

  return result.rows.length > 0;
};

// Get all tasks with assigned members
export const getTasks = async (req, res) => {
  try {
    const { projectId, status } = req.query;
    const role = await getUserRole(req.userId);

    const conditions = [];
    const params = [];

    if (projectId) {
      params.push(projectId);
      conditions.push(`t.project_id = $${params.length}`);
    }

    if (status) {
      const validStatuses = ['todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }

    if (role !== 'admin' && role !== 'manager') {
      params.push(req.userId);
      const idx = params.length;
      const accessClause = `(t.created_by = $${idx} OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $${idx}) OR t.id IN (SELECT task_id FROM task_members WHERE user_id = $${idx}))`;
      conditions.push(accessClause);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT t.*,
              creator.id AS created_by_id, creator.name AS created_by_name, creator.role AS created_by_role,
              p.name AS project_name, p.client_name AS project_client
       FROM tasks t
       LEFT JOIN users creator ON creator.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
       ${whereClause}
       ORDER BY t.created_at DESC`,
      params
    );

    // Fetch assigned members for each task
    const tasksWithMembers = await Promise.all(
      result.rows.map(async (task) => {
        const membersResult = await pool.query(
          `SELECT u.id as user_id, u.name as full_name
           FROM task_members tm
           JOIN users u ON u.id = tm.user_id
           WHERE tm.task_id = $1
           ORDER BY tm.added_at ASC`,
          [task.id]
        );
        return {
          ...task,
          assigned_to: membersResult.rows,
        };
      })
    );

    res.json(tasksWithMembers);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get task by ID with assigned members
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await canAccessTask(id, req.userId);
    if (!hasAccess) return res.status(403).json({ error: 'Insufficient permissions' });

    const result = await pool.query(
      `SELECT t.*,
              creator.id AS created_by_id, creator.name AS created_by_name, creator.role AS created_by_role,
              p.name AS project_name, p.client_name AS project_client
       FROM tasks t
       LEFT JOIN users creator ON creator.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];

    // Fetch assigned members
    const membersResult = await pool.query(
      `SELECT u.id as user_id, u.name as full_name
       FROM task_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.task_id = $1
       ORDER BY tm.added_at ASC`,
      [id]
    );

    res.json({
      ...task,
      assigned_to: membersResult.rows,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Create new task with assigned members
export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority = 'medium', dueDate, assignedTo = [], status = 'todo' } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'Project ID and title are required' });
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const projectExists = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (projectExists.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate all assigned users exist
    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        const user = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
          return res.status(400).json({ error: `User ${userId} does not exist` });
        }
      }
    }

    const role = await getUserRole(req.userId);
    if (!(role === 'admin' || role === 'manager')) {
      return res.status(403).json({ error: 'Only managers or admins can create tasks' });
    }

    const insertResult = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectId, title, description, status, priority, dueDate || null, req.userId]
    );

    const taskId = insertResult.rows[0].id;

    // Add task members
    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        await pool.query(
          'INSERT INTO task_members (task_id, user_id) VALUES ($1, $2)',
          [taskId, userId]
        );
      }
    }

    // Fetch full task details with assigned members
    const membersResult = await pool.query(
      `SELECT u.id as user_id, u.name as full_name
       FROM task_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.task_id = $1
       ORDER BY tm.added_at ASC`,
      [taskId]
    );

    const fullTask = await pool.query(
      `SELECT t.*,
              creator.id AS created_by_id, creator.name AS created_by_name, creator.role AS created_by_role,
              p.name AS project_name, p.client_name AS project_client
       FROM tasks t
       LEFT JOIN users creator ON creator.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [taskId]
    );

    const createdTask = fullTask.rows[0];

    // Log activity
    await logActivity(
      req.userId,
      `Created task "${title}"`,
      { projectId, taskId }
    );

    res.status(201).json({
      ...createdTask,
      assigned_to: membersResult.rows,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update task with assigned members
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (status) {
      const validStatuses = ['todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority' });
      }
    }

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const role = await getUserRole(req.userId);
    
    // Check if user is assigned to this task
    const isAssigned = await pool.query(
      'SELECT 1 FROM task_members WHERE task_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (!(role === 'admin' || role === 'manager' || isAssigned.rows.length > 0)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const canEditAll = role === 'admin' || role === 'manager';

    // Validate assigned users if provided
    if (canEditAll && Array.isArray(assignedTo)) {
      for (const userId of assignedTo) {
        const user = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
          return res.status(400).json({ error: `User ${userId} does not exist` });
        }
      }
    }

    // Update task fields
    await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date)
       WHERE id = $6`,
      [
        canEditAll ? title : null,
        canEditAll ? description : null,
        status || null,
        canEditAll ? priority : null,
        canEditAll ? dueDate : null,
        id,
      ]
    );

    // Update assigned members if manager/admin provided new list
    if (canEditAll && Array.isArray(assignedTo)) {
      // Delete old assignments
      await pool.query('DELETE FROM task_members WHERE task_id = $1', [id]);
      
      // Add new assignments
      for (const userId of assignedTo) {
        await pool.query(
          'INSERT INTO task_members (task_id, user_id) VALUES ($1, $2)',
          [id, userId]
        );
      }
    }

    // Fetch updated task with members
    const updatedTask = await pool.query(
      `SELECT t.*,
              creator.id AS created_by_id, creator.name AS created_by_name, creator.role AS created_by_role,
              p.name AS project_name, p.client_name AS project_client
       FROM tasks t
       LEFT JOIN users creator ON creator.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [id]
    );

    const membersResult = await pool.query(
      `SELECT u.id as user_id, u.name as full_name
       FROM task_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.task_id = $1
       ORDER BY tm.added_at ASC`,
      [id]
    );

    const taskData = updatedTask.rows[0];

    // Log activity
    const actionParts = [];
    if (status) actionParts.push(`status to "${status}"`);
    if (canEditAll && title) actionParts.push('details');
    const action = actionParts.length > 0 
      ? `Updated task "${taskData.title}" (${actionParts.join(', ')})`
      : `Updated task "${taskData.title}"`;
    
    await logActivity(req.userId, action, { projectId: taskData.project_id, taskId: id });

    res.json({
      ...taskData,
      assigned_to: membersResult.rows,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await getUserRole(req.userId);
    if (!(role === 'admin' || role === 'manager')) {
      return res.status(403).json({ error: 'Only managers or admins can delete tasks' });
    }

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = result.rows[0];
    
    // Log activity
    await logActivity(
      req.userId,
      `Deleted task "${deletedTask.title}"`,
      { projectId: deletedTask.project_id, taskId: id }
    );

    res.json({ message: 'Task deleted', task: deletedTask });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

