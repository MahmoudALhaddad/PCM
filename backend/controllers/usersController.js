// controllers/usersController.js
import pool from '../config/database.js';

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role, department, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, role, department, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, role, password } = req.body;

    if (role && !['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let hashedPassword;
    if (password) {
      const { hashPassword } = await import('../utils/authUtils.js');
      hashedPassword = await hashPassword(password);
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           password = COALESCE($2, password),
           department = COALESCE($3, department),
           role = COALESCE($4, role)
       WHERE id = $5
       RETURNING id, name, role, department`,
      [name, hashedPassword, department, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, role, department',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const userResult = await pool.query(
      'SELECT id, name, role, department, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const validRoles = ['admin', 'manager', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      'SELECT id, name, role, department, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Create new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, password, role, department } = req.body;

    // Validate required fields
    if (!name || !password || !role || !department) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Import hashing function dynamically
    const { hashPassword } = await import('../utils/authUtils.js');
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (name, password, role, department)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, role, department`,
      [name, hashedPassword, role, department]
    );

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
