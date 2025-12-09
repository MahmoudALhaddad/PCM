import pool from '../config/database.js';
import { comparePassword, generateToken, hashPassword } from '../utils/authUtils.js';
import { ROLES } from '../utils/constants.js';


export const loginUser = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE name = $1 LIMIT 1',
      [name]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Public registration (defaults to employee role)
export const registerUser = async (req, res) => {
  try {
    const { name, password, department } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    // Enforce unique identifiers
    const existing = await pool.query(
      'SELECT id FROM users WHERE name = $1',
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User with that name already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const role = 'employee';

    const insertResult = await pool.query(
      `INSERT INTO users (name, password, role, department)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, role, department, created_at`,
      [name, hashedPassword, role, department]
    );

    const newUser = insertResult.rows[0];
    const token = generateToken(newUser.id);

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
