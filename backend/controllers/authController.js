import pool from '../config/database.js';
import { comparePassword, generateToken } from '../utils/authUtils.js';
import { logActivity } from '../utils/activityLogger.js';

export const loginUser = async (req, res) => {
  const { name, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid name or password' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid name or password' });

    const token = generateToken(user.id);

    // Log successful login
    await logActivity(user.id, 'Logged in');

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, role: user.role, department: user.department } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};