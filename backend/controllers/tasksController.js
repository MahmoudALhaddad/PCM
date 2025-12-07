const pool = require('../config/database');

// Create task
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority = 'medium', status = 'todo' } = req.body;
    const userId = req.userId;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Title and project ID required' });
    }

    // Validate status
    const validStatus = ['todo', 'in_progress', 'review', 'done'];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Validate priority
    const validPriority = ['low', 'medium', 'high'];
    if (priority && !validPriority.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, due_date, priority, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, project_id, assigned_to, due_date, priority, status, created_by, created_at`,
      [title, description, projectId, assignedTo, dueDate, priority, status, userId]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.project_id, t.assigned_to, t.due_date, t.priority, t.status,
              u.name as assigned_to_name, creator.name as created_by_name, p.name as project_name, t.created_at
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.project_id, t.assigned_to, t.due_date, t.priority, t.status,
              u.name as assigned_to_name, creator.name as created_by_name, p.name as project_name, t.created_at
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, dueDate, priority, status } = req.body;

    // Validate status if provided
    if (status && !['todo', 'in_progress', 'review', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           assigned_to = COALESCE($3, assigned_to),
           due_date = COALESCE($4, due_date),
           priority = COALESCE($5, priority),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING id, title, description, project_id, assigned_to, due_date, priority, status, created_at`,
      [title, description, assignedTo, dueDate, priority, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task deleted successfully',
      task: result.rows[0],
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Get project tasks
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.project_id, t.assigned_to, t.due_date, t.priority, t.status,
              u.name as assigned_to_name, creator.name as created_by_name, t.created_at
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users creator ON t.created_by = creator.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
};

// Get tasks assigned to user
const getMyTasks = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.project_id, t.due_date, t.priority, t.status,
              p.name as project_name, t.created_at
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1
       ORDER BY t.priority DESC, t.due_date ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getProjectTasks,
  getMyTasks,
};
