const pool = require('../config/database');

// Create project
const createProject = async (req, res) => {
  try {
    const { name, clientName, description, deadline, status = 'planning' } = req.body;
    const userId = req.userId;

    if (!name || !clientName) {
      return res.status(400).json({ error: 'Project name and client name required' });
    }

    // Validate status
    const validStatus = ['planning', 'in_progress', 'completed'];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, client_name, description, deadline, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, client_name, description, deadline, status, created_by, created_at`,
      [name, clientName, description, deadline, status, userId]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0],
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.client_name, p.description, p.status, p.deadline,
              p.created_by, u.name as created_by_name, 
              COUNT(t.id) as task_count, COUNT(pm.id) as member_count, p.created_at
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN tasks t ON p.id = t.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.name, p.client_name, p.description, p.status, p.deadline,
              p.created_by, u.name as created_by_name, p.created_at
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, clientName, description, deadline, status } = req.body;

    // Validate status if provided
    if (status && !['planning', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           client_name = COALESCE($2, client_name),
           description = COALESCE($3, description),
           deadline = COALESCE($4, deadline),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING id, name, client_name, description, deadline, status, created_by, created_at`,
      [name, clientName, description, deadline, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      message: 'Project updated successfully',
      project: result.rows[0],
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      message: 'Project deleted successfully',
      project: result.rows[0],
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// Get user projects
const getUserProjects = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT p.id, p.name, p.client_name, p.description, p.status, p.deadline,
              COUNT(t.id) as task_count, COUNT(pm.id) as member_count, p.created_at
       FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.created_by = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Failed to fetch user projects' });
  }
};

// Get projects by status
const getProjectsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const validStatus = ['planning', 'in_progress', 'completed'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `SELECT p.id, p.name, p.client_name, p.description, p.status, p.deadline,
              p.created_by, u.name as created_by_name, 
              COUNT(t.id) as task_count, p.created_at
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.status = $1
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`,
      [status]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get projects by status error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getUserProjects,
  getProjectsByStatus,
};
