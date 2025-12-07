const pool = require('../config/database');

// Add member to project
const addProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({ error: 'Project ID and User ID required' });
    }

    // Check if project exists
    const projectResult = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add member
    const result = await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       RETURNING id, project_id, user_id, added_at`,
      [projectId, userId]
    );

    res.status(201).json({
      message: 'Member added to project',
      member: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Get project members
const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department, pm.added_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.added_at DESC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Remove member from project
const removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const result = await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member removed from project' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

module.exports = {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
};
